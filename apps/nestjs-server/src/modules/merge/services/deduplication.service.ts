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
	 * Уникальность определяется по связке entity.full_name + system.code (через entity_container).
	 * При дубликатах оставляем самую новую запись (по changes.change_date),
	 * переносим все связи со старых записей на новую, затем удаляем старые.
	 */
	async deduplicateEntities(): Promise<DeduplicationResult> {
		this.logger.log("Запуск дедупликации сущностей...");
		const startTime = Date.now();

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();

		try {
			await queryRunner.startTransaction();

			// 1. Находим группы дубликатов: full_name + system_code
			const duplicateGroups = await queryRunner.query(`
				SELECT
					e.full_name,
					COALESCE(s.code, '1642') AS system_code,
					array_agg(e.entity_id ORDER BY c.change_date DESC NULLS LAST, e.entity_id DESC) AS entity_ids,
					count(*) AS cnt
				FROM entity e
				LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
				LEFT JOIN systems s ON ec.system_id = s.system_id
				LEFT JOIN changes c ON e.change_id = c.change_id
				GROUP BY e.full_name, COALESCE(s.code, '1642')
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

				this.logger.log(
					`Дедупликация: full_name=${group.full_name}, system_code=${group.system_code}, ` +
						`оставляем entity_id=${keepId}, удаляем: [${removeIds.join(", ")}]`,
				);

				// 2. Переносим связи attribute со старых entity на оставляемую
				// Атрибуты с одинаковым именем — оставляем у keepId, удаляем дубли
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

				totalRemoved += removeIds.length;
				details.push({
					fullName: group.full_name,
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
	 * Проверяет наличие дубликатов в БД (без удаления)
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
				e.full_name,
				COALESCE(s.code, '1642') AS system_code,
				count(*) AS cnt
			FROM entity e
			LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
			LEFT JOIN systems s ON ec.system_id = s.system_id
			GROUP BY e.full_name, COALESCE(s.code, '1642')
			HAVING count(*) > 1
			ORDER BY count(*) DESC
		`);

		return {
			hasDuplicates: groups.length > 0,
			count: groups.reduce((sum, g) => sum + (Number(g.cnt) - 1), 0),
			groups: groups.map((g) => ({
				fullName: g.full_name,
				systemCode: g.system_code,
				count: Number(g.cnt),
			})),
		};
	}
}
