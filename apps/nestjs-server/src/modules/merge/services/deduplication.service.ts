import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";

export interface DeduplicationResult {
	success: boolean;
	removedCount: number;
	affectedGroups: number;
	details: Array<{
		fullName: string;
		systemCode: string;
		keptEntityId: number;
		removedEntityIds: number[];
	}>;
}

@Injectable()
export class DeduplicationService {
	private readonly logger = new Logger(DeduplicationService.name);

	constructor(private readonly dataSource: DataSource) {}

	/**
	 * Дедупликация сущностей в БД.
	 *
	 * Проблема: при реимпорте из JSON system_code накапливается в full_name:
	 *   BDM.ACCOUNT.1480 → BDM.ACCOUNT.1480.1480 → BDM.ACCOUNT.1480.1480.1480
	 * Все эти записи — одна и та же сущность (name=ACCOUNT, namespace=BDM, system=1480).
	 *
	 * Группируем по entity.name + entity_container.value (namespace) + systems.code.
	 * Оставляем самую новую запись, переносим связи, удаляем остальные.
	 * У оставляемой записи исправляем full_name на чистое значение (namespace/name).
	 */
	async deduplicateEntities(): Promise<DeduplicationResult> {
		this.logger.log("Запуск дедупликации сущностей...");
		const startTime = Date.now();

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();

		try {
			await queryRunner.startTransaction();

			// 1. Находим группы дубликатов по name + namespace + system_code
			const duplicateGroups = await queryRunner.query(`
				SELECT
					e.name AS entity_name,
					COALESCE(ec.value, 'default') AS namespace,
					COALESCE(s.code, '1642') AS system_code,
					array_agg(e.entity_id ORDER BY c.change_date DESC NULLS LAST, e.entity_id DESC) AS entity_ids,
					array_agg(e.full_name ORDER BY c.change_date DESC NULLS LAST, e.entity_id DESC) AS full_names,
					count(*) AS cnt
				FROM entity e
				LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
				LEFT JOIN systems s ON ec.system_id = s.system_id
				LEFT JOIN changes c ON e.change_id = c.change_id
				GROUP BY e.name, COALESCE(ec.value, 'default'), COALESCE(s.code, '1642')
				HAVING count(*) > 1
				ORDER BY count(*) DESC
			`);

			if (duplicateGroups.length === 0) {
				await queryRunner.commitTransaction();
				this.logger.log("Дубликатов не найдено");
				return {
					success: true,
					removedCount: 0,
					affectedGroups: 0,
					details: [],
				};
			}

			this.logger.log(`Найдено ${duplicateGroups.length} групп дубликатов`);

			let totalRemoved = 0;
			const details: DeduplicationResult["details"] = [];

			for (const group of duplicateGroups) {
				const entityIds: number[] = group.entity_ids;
				const keepId = entityIds[0]; // самый новый по change_date
				const removeIds = entityIds.slice(1);

				// Чистый full_name: namespace/name (без system_code суффиксов)
				const cleanFullName =
					group.namespace && group.namespace !== "default"
						? `${group.namespace}/${group.entity_name}`
						: group.entity_name;

				this.logger.log(
					`Дедупликация: name=${group.entity_name}, namespace=${group.namespace}, system_code=${group.system_code}, ` +
						`оставляем entity_id=${keepId}, удаляем: [${removeIds.join(", ")}], ` +
						`full_names: [${(group.full_names as string[]).join(", ")}] → ${cleanFullName}`,
				);

				for (const removeId of removeIds) {
					// 2a. Переносим атрибуты (только те, которых нет у keepId)
					await queryRunner.query(
						`
						UPDATE attribute
						SET entity_id = $1
						WHERE entity_id = $2
							AND name NOT IN (
								SELECT name FROM attribute WHERE entity_id = $1
							)
						`,
						[keepId, removeId],
					);

					// 2b. Удаляем оставшиеся дубликаты атрибутов
					await queryRunner.query(
						`DELETE FROM attribute WHERE entity_id = $1`,
						[removeId],
					);

					// 3. Переносим entity_map (target entity)
					await queryRunner.query(
						`UPDATE entity_map SET entity_id = $1 WHERE entity_id = $2`,
						[keepId, removeId],
					);

					// 4. Переносим entity_map_source (source entity)
					await queryRunner.query(
						`UPDATE entity_map_source SET source_entity_id = $1 WHERE source_entity_id = $2`,
						[keepId, removeId],
					);

					// 5. Удаляем старую entity
					await queryRunner.query(`DELETE FROM entity WHERE entity_id = $1`, [
						removeId,
					]);
				}

				// 6. Исправляем full_name у оставляемой записи на чистое значение
				await queryRunner.query(
					`UPDATE entity SET full_name = $1 WHERE entity_id = $2`,
					[cleanFullName, keepId],
				);

				totalRemoved += removeIds.length;
				details.push({
					fullName: cleanFullName,
					systemCode: group.system_code,
					keptEntityId: keepId,
					removedEntityIds: removeIds,
				});
			}

			await queryRunner.commitTransaction();

			const duration = Date.now() - startTime;
			this.logger.log(
				`Дедупликация завершена за ${duration}ms: удалено ${totalRemoved} дубликатов из ${duplicateGroups.length} групп`,
			);

			return {
				success: true,
				removedCount: totalRemoved,
				affectedGroups: duplicateGroups.length,
				details,
			};
		} catch (error) {
			await queryRunner.rollbackTransaction();
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Ошибка при дедупликации: ${errorMessage}`,
				error instanceof Error ? error.stack : undefined,
			);
			return {
				success: false,
				removedCount: 0,
				affectedGroups: 0,
				details: [],
			};
		} finally {
			await queryRunner.release();
		}
	}

	/**
	 * Проверяет наличие дубликатов в БД (без удаления).
	 * Группирует по name + namespace + system_code.
	 */
	async checkDuplicatesInDb(): Promise<{
		hasDuplicates: boolean;
		count: number;
		groups: Array<{
			fullName: string;
			systemCode: string;
			count: number;
		}>;
	}> {
		const groups = await this.dataSource.query(`
			SELECT
				e.name AS entity_name,
				COALESCE(ec.value, 'default') AS namespace,
				COALESCE(s.code, '1642') AS system_code,
				count(*) AS cnt
			FROM entity e
			LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
			LEFT JOIN systems s ON ec.system_id = s.system_id
			GROUP BY e.name, COALESCE(ec.value, 'default'), COALESCE(s.code, '1642')
			HAVING count(*) > 1
			ORDER BY count(*) DESC
		`);

		return {
			hasDuplicates: groups.length > 0,
			count: groups.reduce((sum, g) => sum + (Number(g.cnt) - 1), 0),
			groups: groups.map((g) => ({
				fullName:
					g.namespace && g.namespace !== "default"
						? `${g.namespace}/${g.entity_name}`
						: g.entity_name,
				systemCode: g.system_code,
				count: Number(g.cnt),
			})),
		};
	}
}
