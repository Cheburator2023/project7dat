import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";

export interface DeduplicationResult {
	success: boolean;
	removedCount: number;
	affectedGroups: number;
	errorMessage?: string;
	details: Array<{
		fullName: string;
		systemCode: string;
		keptEntityId: number;
		removedEntityIds: number[];
	}>;
}

interface DeduplicationOptions {
	checkCancelled?: () => void;
	onProgress?: (payload: {
		progress: number;
		stage: string;
		totalGroups: number;
		processedGroups: number;
	}) => Promise<void> | void;
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
	async deduplicateEntities(
		options?: DeduplicationOptions,
	): Promise<DeduplicationResult> {
		this.logger.log("Запуск дедупликации сущностей...");
		const startTime = Date.now();

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();

		try {
			await queryRunner.startTransaction();

			// 1. Находим группы дубликатов по name + entity_container_id
			// entity_container_id уже включает namespace + system (через entity_container.value + system_id)
			// Это реальный unique key — сущности с одинаковым name и container_id являются дублями
			const duplicateGroups = await queryRunner.query(`
				SELECT
					e.name AS entity_name,
					e.entity_container_id,
					COALESCE(ec.value, 'default') AS namespace,
					COALESCE(s.code, '1642') AS system_code,
					array_agg(e.entity_id ORDER BY c.change_date DESC NULLS LAST, e.entity_id DESC) AS entity_ids,
					array_agg(e.full_name ORDER BY c.change_date DESC NULLS LAST, e.entity_id DESC) AS full_names,
					count(*) AS cnt
				FROM entity e
				LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
				LEFT JOIN systems s ON ec.system_id = s.system_id
				LEFT JOIN changes c ON e.change_id = c.change_id
				GROUP BY e.name, e.entity_container_id, ec.value, s.code
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
			await options?.onProgress?.({
				progress: 10,
				stage: "Найдены группы дубликатов",
				totalGroups: duplicateGroups.length,
				processedGroups: 0,
			});

			let totalRemoved = 0;
			const details: DeduplicationResult["details"] = [];
			let processedGroups = 0;

			for (const group of duplicateGroups) {
				options?.checkCancelled?.();
				const entityIds: number[] = group.entity_ids;
				const keepId = entityIds[0]; // самый новый по change_date
				const removeIds = entityIds.slice(1);

				// Чистый full_name: namespace/name (без system_code суффиксов)
				const cleanFullName =
					group.namespace && group.namespace !== "default"
						? `${group.namespace}.${group.entity_name}`
						: group.entity_name;

				this.logger.log(
					`Дедупликация: name=${group.entity_name}, namespace=${group.namespace}, system_code=${group.system_code}, ` +
						`оставляем entity_id=${keepId}, удаляем: [${removeIds.join(", ")}], ` +
						`full_names: [${(group.full_names as string[]).join(", ")}] → ${cleanFullName}`,
				);

				for (const removeId of removeIds) {
					options?.checkCancelled?.();
					await this.mergeEntityAttributes(queryRunner, keepId, removeId);

					await queryRunner.query(
						`
						DELETE FROM entity_map_source ems
						USING entity_map_source existing
						WHERE ems.source_entity_id = $2
							AND existing.entity_map_id = ems.entity_map_id
							AND existing.source_entity_id = $1
						`,
						[keepId, removeId],
					);

					await queryRunner.query(
						`UPDATE entity_map_source SET source_entity_id = $1 WHERE source_entity_id = $2`,
						[keepId, removeId],
					);

					await queryRunner.query(
						`UPDATE entity_map SET entity_id = $1 WHERE entity_id = $2`,
						[keepId, removeId],
					);

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
				processedGroups += 1;
				const progress = Math.min(
					95,
					10 + Math.round((processedGroups / duplicateGroups.length) * 85),
				);
				await options?.onProgress?.({
					progress,
					stage: `Обработано групп дубликатов: ${processedGroups}/${duplicateGroups.length}`,
					totalGroups: duplicateGroups.length,
					processedGroups,
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
				errorMessage,
				details: [],
			};
		} finally {
			await queryRunner.release();
		}
	}

	/**
	 * Проверяет наличие дубликатов в БД (без удаления).
	 * Группирует по name + entity_container_id.
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
				e.entity_container_id,
				COALESCE(ec.value, 'default') AS namespace,
				COALESCE(s.code, '1642') AS system_code,
				count(*) AS cnt
			FROM entity e
			LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
			LEFT JOIN systems s ON ec.system_id = s.system_id
			GROUP BY e.name, e.entity_container_id, ec.value, s.code
			HAVING count(*) > 1
			ORDER BY count(*) DESC
		`);

		return {
			hasDuplicates: groups.length > 0,
			count: groups.reduce((sum, g) => sum + (Number(g.cnt) - 1), 0),
			groups: groups.map((g) => ({
				fullName:
					g.namespace && g.namespace !== "default"
						? `${g.namespace}.${g.entity_name}`
						: g.entity_name,
				systemCode: g.system_code,
				count: Number(g.cnt),
			})),
		};
	}

	private async mergeEntityAttributes(
		queryRunner: { query: (sql: string, params?: unknown[]) => Promise<any> },
		keepId: number,
		removeId: number,
	): Promise<void> {
		const keepAttributes: Array<{ attribute_id: number; name: string }> =
			await queryRunner.query(
				`SELECT attribute_id, name FROM attribute WHERE entity_id = $1`,
				[keepId],
			);
		const removeAttributes: Array<{ attribute_id: number; name: string }> =
			await queryRunner.query(
				`SELECT attribute_id, name FROM attribute WHERE entity_id = $1`,
				[removeId],
			);

		const keepByName = new Map<string, number>();
		for (const attribute of keepAttributes) {
			keepByName.set(attribute.name, attribute.attribute_id);
		}

		for (const attribute of removeAttributes) {
			const keepAttributeId = keepByName.get(attribute.name);
			if (!keepAttributeId) {
				await queryRunner.query(
					`UPDATE attribute SET entity_id = $1 WHERE attribute_id = $2`,
					[keepId, attribute.attribute_id],
				);
				keepByName.set(attribute.name, attribute.attribute_id);
				continue;
			}

			await queryRunner.query(
				`
				DELETE FROM attribute_map_source ams
				USING attribute_map_source existing
				WHERE ams.source_attribute_id = $2
					AND existing.attribute_map_id = ams.attribute_map_id
					AND existing.source_attribute_id = $1
				`,
				[keepAttributeId, attribute.attribute_id],
			);

			await queryRunner.query(
				`UPDATE attribute_map_source SET source_attribute_id = $1 WHERE source_attribute_id = $2`,
				[keepAttributeId, attribute.attribute_id],
			);

			await queryRunner.query(
				`
				DELETE FROM entity_attribute_map eam
				USING entity_attribute_map existing
				WHERE eam.source_attribute_id = $2
					AND existing.entity_map_id = eam.entity_map_id
					AND existing.deptype_id = eam.deptype_id
					AND existing.source_attribute_id = $1
				`,
				[keepAttributeId, attribute.attribute_id],
			);

			await queryRunner.query(
				`UPDATE entity_attribute_map SET source_attribute_id = $1 WHERE source_attribute_id = $2`,
				[keepAttributeId, attribute.attribute_id],
			);

			await queryRunner.query(
				`UPDATE attribute_map SET attribute_id = $1 WHERE attribute_id = $2`,
				[keepAttributeId, attribute.attribute_id],
			);

			await queryRunner.query(`DELETE FROM attribute WHERE attribute_id = $1`, [
				attribute.attribute_id,
			]);
		}
	}
}
