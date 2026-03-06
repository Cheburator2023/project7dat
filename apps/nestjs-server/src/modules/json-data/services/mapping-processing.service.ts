import { Injectable, Logger } from "@nestjs/common";
import { In, QueryRunner } from "typeorm";
import { EntityMapEntity } from "../entities/entity-map.entity";
import { AttributeMapEntity } from "../entities/attribute-map.entity";
import { AttributeMapSourceEntity } from "../entities/attribute-map-source.entity";
import { EntityAttributeMapEntity } from "../entities/entity-attribute-map.entity";
import { FailedMappingsEntity } from "../entities/failed-mappings.entity";
import { EntityEntity } from "../entities/entity.entity";
import { AttributeEntity } from "../entities/attribute.entity";
import { EntityMapSourceEntity } from "../entities/entity-map-source.entity";
import { EntityContainerEntity } from "../entities/entity-container.entity";
import { SystemsEntity } from "../entities/systems.entity";

interface ExistingDepData {
	sourceEntityId: number;
	attrMaps: Set<string>;          // ключ "src:dst"
	atrDeps: Map<number, Set<string>>; // ключ source_attribute_id, значение Set<deptype_id>
}

interface ExistingMappingData {
	entityMapId: number;
	targetEntityId: number;
	processId: number;
	deps: Map<number, ExistingDepData>;
}

@Injectable()
export class MappingProcessingService {
	private readonly logger = new Logger(MappingProcessingService.name);

	async handleMappings(
		mappings: any[],
		processId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<{ count: number; warnings: string[] }> {
		if (!mappings || !Array.isArray(mappings)) {
			return { count: 0, warnings: [] };
		}

		// Предзагружаем все сущности и атрибуты, упомянутые в маппингах
		const { entityCache, attributeCacheByEntity } = await this.preloadCommitEntities(mappings, queryRunner);

		// Загружаем существующие маппинги для процесса
		const existingMappings = await this.loadExistingMappingsOptimized(processId, queryRunner);

		let processedCount = 0;
		const warnings: string[] = [];
		const startTotal = Date.now();

		for (const mapping of mappings) {
			const mappingStart = Date.now();
			try {
				const targetEntity = entityCache.get(mapping.entityId);
				if (!targetEntity) {
					warnings.push(`Target entity не найдена: ${mapping.entityId}, маппинг пропущен`);
					continue;
				}

				const unchanged = await this.isMappingUnchanged(
					mapping,
					targetEntity.entity_id,
					processId,
					existingMappings,
					entityCache,
					attributeCacheByEntity,
				);

				if (unchanged) {
					this.logger.log(`Маппинг для ${mapping.entityId} не изменился, пропускаем`);
					continue;
				}

				// Маппинг изменился – обрабатываем
				await this.handleChangedMapping(
					mapping,
					targetEntity.entity_id,
					processId,
					changeId,
					queryRunner,
					entityCache,
					attributeCacheByEntity,
				);
				processedCount++;
			} catch (error) {
				this.logger.error(`Ошибка обработки маппинга: ${error.message}`, error.stack);
				await this.handleFailedMapping(mapping, error.message, changeId, queryRunner);
				warnings.push(`Маппинг для ${mapping.entityId} завершился с ошибкой: ${error.message}`);
			} finally {
				const mappingTime = Date.now() - mappingStart;
				this.logger.log(`Маппинг ${processedCount}/${mappings.length} (${mapping.entityId}) обработан за ${mappingTime}ms`);
			}
		}

		const totalTime = Date.now() - startTotal;
		this.logger.log(`handleMappings завершён за ${totalTime}ms, обработано маппингов: ${processedCount}`);
		return { count: processedCount, warnings };
	}

	/**
	 * Предзагружает все сущности и атрибуты, встречающиеся в маппингах коммита.
	 */
	private async preloadCommitEntities(
		mappings: any[],
		queryRunner: QueryRunner,
	): Promise<{
		entityCache: Map<string, EntityEntity>;
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>;
	}> {
		const fullNames = new Set<string>();
		for (const m of mappings) {
			if (m.entityId) fullNames.add(m.entityId);
			for (const d of m.deps || []) {
				if (d.entityId) fullNames.add(d.entityId);
			}
		}

		const entityCache = new Map<string, EntityEntity>();
		const attributeCacheByEntity = new Map<number, Map<string, AttributeEntity>>();

		if (fullNames.size === 0) return { entityCache, attributeCacheByEntity };

		const existingEntities = await queryRunner.manager.find(EntityEntity, {
			where: { full_name: In([...fullNames]) },
		});
		for (const ent of existingEntities) {
			entityCache.set(ent.full_name, ent);
		}

		const entityIds = existingEntities.map(e => e.entity_id);
		if (entityIds.length > 0) {
			const attributes = await queryRunner.manager.find(AttributeEntity, {
				where: { entity_id: In(entityIds) },
			});
			for (const attr of attributes) {
				if (!attributeCacheByEntity.has(attr.entity_id)) {
					attributeCacheByEntity.set(attr.entity_id, new Map());
				}
				attributeCacheByEntity.get(attr.entity_id)!.set(attr.name, attr);
			}
		}

		return { entityCache, attributeCacheByEntity };
	}

	/**
	 * Оптимизированная загрузка существующих маппингов для процесса одним сложным запросом.
	 */
	private async loadExistingMappingsOptimized(
		processId: number,
		queryRunner: QueryRunner,
	): Promise<Map<number, ExistingMappingData>> {
		const result = new Map<number, ExistingMappingData>();

		const query = `
            SELECT
                em.entity_map_id,
                em.entity_id AS target_entity_id,
                em.process_id,
                am.attribute_map_id,
                am.attribute_id AS target_attribute_id,
                a_target.name AS target_attribute_name,
                ams.source_attribute_id,
                a_source.name AS source_attribute_name,
                a_source.entity_id AS source_entity_id,
                eam.source_attribute_id AS dep_source_attribute_id,
                eam.deptype_id
            FROM entity_map em
            LEFT JOIN attribute_map am ON am.entity_map_id = em.entity_map_id
            LEFT JOIN attribute_map_source ams ON ams.attribute_map_id = am.attribute_map_id
            LEFT JOIN attribute a_source ON a_source.attribute_id = ams.source_attribute_id
            LEFT JOIN attribute a_target ON a_target.attribute_id = am.attribute_id
            LEFT JOIN entity_attribute_map eam ON eam.entity_map_id = em.entity_map_id
            WHERE em.process_id = $1
        `;

		const rows = await queryRunner.query(query, [processId]);

		for (const row of rows) {
			const targetId = row.target_entity_id;
			if (!result.has(targetId)) {
				result.set(targetId, {
					entityMapId: row.entity_map_id,
					targetEntityId: targetId,
					processId: row.process_id,
					deps: new Map(),
				});
			}
			const targetMap = result.get(targetId)!;

			if (row.source_entity_id) {
				if (!targetMap.deps.has(row.source_entity_id)) {
					targetMap.deps.set(row.source_entity_id, {
						sourceEntityId: row.source_entity_id,
						attrMaps: new Set(),
						atrDeps: new Map(),
					});
				}
				const dep = targetMap.deps.get(row.source_entity_id)!;
				if (row.source_attribute_name && row.target_attribute_name) {
					dep.attrMaps.add(`${row.source_attribute_name}:${row.target_attribute_name}`);
				}
			}

			if (row.dep_source_attribute_id && row.deptype_id) {
				const srcAttrId = row.dep_source_attribute_id;
			}
		}

		const depQuery = `
            SELECT
                eam.entity_map_id,
                eam.source_attribute_id,
                a.name AS source_attribute_name,
                a.entity_id AS source_entity_id,
                eam.deptype_id
            FROM entity_attribute_map eam
            INNER JOIN attribute a ON a.attribute_id = eam.source_attribute_id
            WHERE eam.entity_map_id IN (
                SELECT entity_map_id FROM entity_map WHERE process_id = $1
            )
        `;
		const depRows = await queryRunner.query(depQuery, [processId]);
		for (const row of depRows) {
			// find target entity by entity_map_id
			let targetId: number | null = null;
			for (const [tid, data] of result.entries()) {
				if (data.entityMapId === row.entity_map_id) {
					targetId = tid;
					break;
				}
			}
			if (targetId === null) continue;

			const targetMap = result.get(targetId)!;
			if (!targetMap.deps.has(row.source_entity_id)) {
				targetMap.deps.set(row.source_entity_id, {
					sourceEntityId: row.source_entity_id,
					attrMaps: new Set(),
					atrDeps: new Map(),
				});
			}
			const dep = targetMap.deps.get(row.source_entity_id)!;
			if (!dep.atrDeps.has(row.source_attribute_id)) {
				dep.atrDeps.set(row.source_attribute_id, new Set());
			}
			dep.atrDeps.get(row.source_attribute_id)!.add(row.deptype_id);
		}

		return result;
	}

	private async isMappingUnchanged(
		mapping: any,
		targetEntityId: number,
		processId: number,
		existingMappings: Map<number, ExistingMappingData>,
		entityCache: Map<string, EntityEntity>,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<boolean> {
		const existing = existingMappings.get(targetEntityId);
		if (!existing) return false;

		// Строим данные коммита для сравнения
		const commitSources = new Map<number, { attrMaps: Set<string>; atrDeps: Map<number, Set<string>> }>();

		for (const dep of mapping.deps || []) {
			const sourceEntity = entityCache.get(dep.entityId);
			if (!sourceEntity) continue; // новая сущность – маппинг точно изменился
			const sourceId = sourceEntity.entity_id;

			const srcData = {
				attrMaps: new Set<string>(),
				atrDeps: new Map<number, Set<string>>(),
			};

			for (const am of dep.attrMaps || []) {
				srcData.attrMaps.add(`${am.src}:${am.dst}`);
			}

			for (const ad of dep.atrDeps || []) {
				const attrMap = attributeCacheByEntity.get(sourceId);
				if (attrMap) {
					const attr = attrMap.get(ad.attr);
					if (attr) {
						if (!srcData.atrDeps.has(attr.attribute_id)) {
							srcData.atrDeps.set(attr.attribute_id, new Set());
						}
						for (const lt of ad.linkTypes || []) {
							srcData.atrDeps.get(attr.attribute_id)!.add(lt);
						}
					}
				}
			}

			commitSources.set(sourceId, srcData);
		}

		const existingDeps = existing.deps;
		if (commitSources.size !== existingDeps.size) return false;

		for (const [srcId, srcData] of commitSources) {
			const existingSrc = existingDeps.get(srcId);
			if (!existingSrc) return false;

			// attrMaps
			if (srcData.attrMaps.size !== existingSrc.attrMaps.size) return false;
			for (const pair of srcData.attrMaps) {
				if (!existingSrc.attrMaps.has(pair)) return false;
			}

			// atrDeps
			if (srcData.atrDeps.size !== existingSrc.atrDeps.size) return false;
			for (const [attrId, linkSet] of srcData.atrDeps) {
				const existingLinkSet = existingSrc.atrDeps.get(attrId);
				if (!existingLinkSet) return false;
				if (linkSet.size !== existingLinkSet.size) return false;
				for (const lt of linkSet) {
					if (!existingLinkSet.has(lt)) return false;
				}
			}
		}

		return true;
	}

	private async handleChangedMapping(
		mapping: any,
		targetEntityId: number,
		processId: number,
		changeId: number,
		queryRunner: QueryRunner,
		entityCache: Map<string, EntityEntity>,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<void> {
		// Находим существующий entity_map
		let entityMap = await queryRunner.manager.findOne(EntityMapEntity, {
			where: { entity_id: targetEntityId, process_id: processId },
		});

		if (entityMap) {
			// 1. Удаляем attribute_map_source (зависит от attribute_map)
			const attrMaps = await queryRunner.manager.find(AttributeMapEntity, {
				where: { entity_map_id: entityMap.entity_map_id },
			});
			const attrMapIds = attrMaps.map(am => am.attribute_map_id);

			if (attrMapIds.length > 0) {
				// Удаление записей из attribute_map_source
				await queryRunner.manager.delete(AttributeMapSourceEntity, {
					attribute_map_id: In(attrMapIds),
				});

				// Удаление entity_attribute_map (привязаны к entity_map_id, не к attribute_map)
				await queryRunner.manager.delete(EntityAttributeMapEntity, {
					entity_map_id: entityMap.entity_map_id,
				});

				// Удаление самих attribute_map
				await queryRunner.manager.delete(AttributeMapEntity, {
					entity_map_id: entityMap.entity_map_id,
				});
			}

			// 2. Удаляем entity_map_source
			await queryRunner.manager.delete(EntityMapSourceEntity, {
				entity_map_id: entityMap.entity_map_id,
			});

			// 3. Обновляем change_id у entity_map
			entityMap.change_id = changeId;

			entityMap = await queryRunner.manager.save(EntityMapEntity, entityMap);
		} else {
			// Создаём новый entity_map
			entityMap = new EntityMapEntity();
			entityMap.entity_id = targetEntityId;
			entityMap.process_id = processId;
			entityMap.change_id = changeId;
			entityMap.description = `Маппинг для ${mapping.entityId}`;
			entityMap = await queryRunner.manager.save(EntityMapEntity, entityMap);
		}

		// 4. Обрабатываем зависимости (создаём новые связи)
		if (mapping.deps && Array.isArray(mapping.deps)) {
			for (const dep of mapping.deps) {
				await this.handleDependency(
					dep,
					entityMap.entity_map_id,
					changeId,
					queryRunner,
					entityCache,
					attributeCacheByEntity,
				);
			}
		}
	}

	private async handleDependency(
		dep: any,
		entityMapId: number,
		changeId: number,
		queryRunner: QueryRunner,
		entityCache: Map<string, EntityEntity>,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<string[]> {
		const warnings: string[] = [];

		// 1. Ищем source сущность в кэше с учетом system_code
		let sourceEntity: EntityEntity | null | undefined = entityCache.get(dep.entityId);

		// 2. Если не найдена, создаем с учетом system_code
		if (!sourceEntity) {
			const warning = `Source сущность не найдена: ${dep.entityId}. Будет создана новая запись.`;
			this.logger.warn(warning);
			warnings.push(warning);

			// Создаем новую сущность с учетом system_code
			sourceEntity = await this.createEntityWithSystemCode(
				dep.entityId,
				dep.entityId.split('.').pop() || dep.entityId,
				dep.system_code || "1642",
				changeId,
				queryRunner,
			);

			if (sourceEntity) {
				// Добавляем в кэш
				entityCache.set(dep.entityId, sourceEntity);
				attributeCacheByEntity.set(sourceEntity.entity_id, new Map());
			} else {
				// Создать не удалось – дальше обрабатывать эту зависимость нельзя
				warnings.push(`Не удалось создать сущность: ${dep.entityId}`);
				return warnings;
			}
		} else if (dep.system_code) {
			// Проверяем соответствие system_code
			const entitySystemCode = sourceEntity.entity_container?.system?.code;
			if (entitySystemCode !== dep.system_code) {
				const warning = `Несоответствие system_code: сущность ${dep.entityId} имеет system_code ${entitySystemCode}, а в зависимости указан ${dep.system_code}`;
				this.logger.warn(warning);
				warnings.push(warning);
			}
		}

		// 3. Обработка attrMaps
		if (dep.attrMaps && Array.isArray(dep.attrMaps)) {
			for (const attrMap of dep.attrMaps) {
				try {
					await this.handleAttrMap(
						attrMap,
						entityMapId,
						sourceEntity.entity_id,
						changeId,
						queryRunner,
						attributeCacheByEntity,
					);
				} catch (error) {
					const warning = `Ошибка обработки attrMap для зависимости ${dep.entityId}: ${error.message}`;
					this.logger.warn(warning);
					warnings.push(warning);
				}
			}
		}

		// 4. Обработка attrDeps
		if (dep.atrDeps && Array.isArray(dep.atrDeps)) {
			for (const attrDep of dep.atrDeps) {
				try {
					await this.handleAttrDep(
						attrDep,
						entityMapId,
						sourceEntity.entity_id,
						changeId,
						queryRunner,
						attributeCacheByEntity,
					);
				} catch (error) {
					const warning = `Ошибка обработки attrDep для зависимости ${dep.entityId}: ${error.message}`;
					this.logger.warn(warning);
					warnings.push(warning);
				}
			}
		}

        return warnings;
    }

	private async createEntityWithSystemCode(
		fullName: string,
		name: string,
		systemCode: string,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<EntityEntity | null> {
		try {
			// Получаем или создаем систему
			let system = await queryRunner.manager.findOne(SystemsEntity, {
				where: { code: systemCode },
			});

            if (!system) {
                system = new SystemsEntity();
                system.code = systemCode;
                system.name = `Система ${systemCode}`;
                system = await queryRunner.manager.save(SystemsEntity, system);
            }

            // Создаем контейнер
            const namespace = fullName.includes('.')
                ? fullName.substring(0, fullName.lastIndexOf('.'))
                : 'default';

			let container = await queryRunner.manager.findOne(EntityContainerEntity, {
				where: { value: namespace },
			});

            if (!container) {
                container = new EntityContainerEntity();
                container.change_id = changeId;
                container.entity_container_type_id = 1; // DB_HIVE
                container.value = namespace;
                container.description = `Контейнер для ${namespace} (система: ${systemCode})`;
                container.system_id = system.system_id;
                container = await queryRunner.manager.save(EntityContainerEntity, container);
            }

            // Создаем сущность
            const entity = new EntityEntity();
            entity.full_name = fullName;
            entity.name = name;
            entity.entity_type_id = 1; // TABLE_HIVE по умолчанию
            entity.entity_container_id = container.entity_container_id;
            entity.change_id = changeId;
            entity.description = `Автоматически созданная сущность для системы ${systemCode}`;

            return await queryRunner.manager.save(EntityEntity, entity);
        } catch (error) {
            this.logger.error(`Ошибка создания сущности: ${error.message}`);
            return null;
        }
    }

	private async handleAttrMap(
		attrMap: any,
		entityMapId: number,
		sourceEntityId: number,
		changeId: number,
		queryRunner: QueryRunner,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<void> {
		// Поиск source атрибута в кэше
		const sourceAttrMap = attributeCacheByEntity.get(sourceEntityId);
		const sourceAttribute = sourceAttrMap?.get(attrMap.src);
		if (!sourceAttribute) {
			throw new Error(
				`Source атрибут не найден: ${attrMap.src} в сущности ${sourceEntityId}`,
			);
		}

		// Находим target entity из entity_map
		const entityMap = await queryRunner.manager.findOne(EntityMapEntity, {
			where: { entity_map_id: entityMapId },
		});

		if (!entityMap) {
			throw new Error(`Entity_map не найден: ${entityMapId}`);
		}

		// Поиск target атрибута в кэше
		const targetAttribute = await queryRunner.manager.findOne(AttributeEntity, {
			where: {
				entity_id: entityMap.entity_id,
				name: attrMap.dst,
			},
		});

		if (!targetAttribute) {
			throw new Error(
				`Target атрибут не найден: ${attrMap.dst} в сущности ${entityMap.entity_id}`,
			);
		}

		// Создание или обновление attribute_map
		const attributeMap = await this.createOrUpdateAttributeMap(
			entityMapId,
			targetAttribute.attribute_id,
			changeId,
			queryRunner,
		);

		// Создание attribute_map_source
		await this.createOrUpdateAttributeMapSource(
			attributeMap.attribute_map_id,
			sourceAttribute.attribute_id,
			changeId,
			queryRunner,
		);
	}

	private async createOrUpdateAttributeMap(
		entityMapId: number,
		attributeId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<AttributeMapEntity> {
		let attributeMap = await queryRunner.manager.findOne(AttributeMapEntity, {
			where: {
				entity_map_id: entityMapId,
				attribute_id: attributeId,
			},
		});

		if (!attributeMap) {
			attributeMap = new AttributeMapEntity();
			attributeMap.entity_map_id = entityMapId;
			attributeMap.attribute_id = attributeId;
			attributeMap.change_id = changeId;

			attributeMap = await queryRunner.manager.save(
				AttributeMapEntity,
				attributeMap,
			);
		} else {
			attributeMap.change_id = changeId;
			attributeMap = await queryRunner.manager.save(
				AttributeMapEntity,
				attributeMap,
			);
		}

		return attributeMap;
	}

	private async createOrUpdateAttributeMapSource(
		attributeMapId: number,
		sourceAttributeId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<AttributeMapSourceEntity> {
		const existingSource = await queryRunner.manager.findOne(
			AttributeMapSourceEntity,
			{
				where: {
					attribute_map_id: attributeMapId,
					source_attribute_id: sourceAttributeId,
				},
			},
		);

		if (!existingSource) {
			const attributeMapSource = new AttributeMapSourceEntity();
			attributeMapSource.attribute_map_id = attributeMapId;
			attributeMapSource.source_attribute_id = sourceAttributeId;
			attributeMapSource.change_id = changeId;

			return await queryRunner.manager.save(
				AttributeMapSourceEntity,
				attributeMapSource,
			);
		} else {
			existingSource.change_id = changeId;
			return await queryRunner.manager.save(
				AttributeMapSourceEntity,
				existingSource,
			);
		}
	}

	private async handleAttrDep(
		attrDep: any,
		entityMapId: number,
		sourceEntityId: number,
		changeId: number,
		queryRunner: QueryRunner,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<void> {
		// Поиск source атрибута в кэше
		const sourceAttrMap = attributeCacheByEntity.get(sourceEntityId);
		const sourceAttribute = sourceAttrMap?.get(attrDep.attr);
		if (!sourceAttribute) {
			throw new Error(
				`Source атрибут не найден: ${attrDep.attr} в сущности ${sourceEntityId}`,
			);
		}

		// Создание entity_attribute_map для каждого linkType
		if (attrDep.linkTypes && Array.isArray(attrDep.linkTypes)) {
			for (const linkType of attrDep.linkTypes) {
				await this.createOrUpdateEntityAttributeMap(
					entityMapId,
					sourceAttribute.attribute_id,
					linkType,
					changeId,
					queryRunner,
				);
			}
		}
	}

	private async createOrUpdateEntityAttributeMap(
		entityMapId: number,
		sourceAttributeId: number,
		deptypeId: string,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<EntityAttributeMapEntity> {
		const existingMap = await queryRunner.manager.findOne(
			EntityAttributeMapEntity,
			{
				where: {
					entity_map_id: entityMapId,
					source_attribute_id: sourceAttributeId,
					deptype_id: deptypeId,
				},
			},
		);

		if (!existingMap) {
			const entityAttributeMap = new EntityAttributeMapEntity();
			entityAttributeMap.entity_map_id = entityMapId;
			entityAttributeMap.source_attribute_id = sourceAttributeId;
			entityAttributeMap.deptype_id = deptypeId;
			entityAttributeMap.change_id = changeId;

			return await queryRunner.manager.save(
				EntityAttributeMapEntity,
				entityAttributeMap,
			);
		} else {
			existingMap.change_id = changeId;
			return await queryRunner.manager.save(
				EntityAttributeMapEntity,
				existingMap,
			);
		}
	}

	private async handleFailedMapping(
		mapping: any,
		errorMessage: string,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		const failedMapping = new FailedMappingsEntity();
		failedMapping.change_id = changeId;
		failedMapping.entity_name = mapping.entityId || "Unknown";
		failedMapping.error_description = errorMessage;
		failedMapping.unmatched_entities = JSON.stringify(mapping.unmatched || []);

		await queryRunner.manager.save(FailedMappingsEntity, failedMapping);
	}

	async handleFailedMappings(
		failedMappings: any[],
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<{ count: number }> {
		if (!failedMappings || !Array.isArray(failedMappings)) {
			return { count: 0 };
		}

		for (const failedMapping of failedMappings) {
			await this.handleSingleFailedMapping(
				failedMapping,
				changeId,
				queryRunner,
			);
		}

		return { count: failedMappings.length };
	}

	private async handleSingleFailedMapping(
		failedMapping: any,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		const failedMappingsEntity = new FailedMappingsEntity();
		failedMappingsEntity.change_id = changeId;
		failedMappingsEntity.entity_name =
			failedMapping.entityName || failedMapping.entityId;
		failedMappingsEntity.error_description =
			failedMapping.errorDescription || failedMapping.error;
		failedMappingsEntity.unmatched_entities = JSON.stringify(
			failedMapping.unmatchedEntities || failedMapping.unmatched || [],
		);

		await queryRunner.manager.save(FailedMappingsEntity, failedMappingsEntity);
	}
}
