import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { JsonExportResponseDto } from "../dto";
import { ChangeEntity } from "../entities/change.entity";
import { EntityEntity } from "../entities/entity.entity";
import { ProcessEntity } from "../entities/process.entity";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "./cache.service";

interface EntityWithDetails {
	entity_id: number;
	full_name: string;
	name: string;
	description?: string;
	entity_type_id: number;
	entity_container_id?: number;
	change_id: number;
	entity_type_name: string;
	container_value?: string;
	container_description?: string;
	system_code?: string;
	entity_change_date: Date;
	container_change_date?: Date;
	attributes: Array<{
		attribute_id: number;
		name: string;
		description?: string;
		type_id: number;
		type_name: string;
		attribute_change_date: Date;
	}>;
}

interface AttributeDepRaw {
	source_attribute_id: number;
	source_attribute_name: string;
	deptype_id: string;
	relation_change_date: Date;
}

interface AttributeDepGrouped {
	source_attribute_id: number;
	source_attribute_name: string;
	linkTypes: string[];
	relation_change_date: Date;
}

interface AttributeMapRaw {
	attribute_map_id: number;
	target_attribute_id: number;
	target_attribute_name: string;
	source_attribute_id: number;
	source_attribute_name: string;
	relation_change_date: Date;
	source_entity_id: number;
}

interface MappingWithDetails {
	entity_map_id: number;
	target_entity_id: number;
	target_entity_name: string;
	target_full_name: string;
	process_id: number;
	process_name?: string;
	process_description?: string;
	process_change_date?: Date;
	entity_map_description?: string;
	relation_change_date: Date;
	dependencies: Array<{
		source_entity_id: number;
		source_entity_name: string;
		source_full_name: string;
		attr_maps: AttributeMapRaw[];
		attr_deps: AttributeDepGrouped[];
	}>;
	change_id: number;
	unmatched?: string;
}

@Injectable()
export class JsonExportService {
	private readonly logger = new Logger(JsonExportService.name);
	private readonly cacheTtl: number;

	constructor(
		@InjectRepository(ChangeEntity)
		private readonly changeRepository: Repository<ChangeEntity>,
		@InjectRepository(EntityEntity)
		readonly _entityRepository: Repository<EntityEntity>,
		@InjectRepository(ProcessEntity)
		readonly _processRepository: Repository<ProcessEntity>,
		private readonly dataSource: DataSource,
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
	) {
		this.cacheTtl = this.configService.get<number>("CACHE_TTL", 600); // 10 минут по умолчанию
	}

	async exportToJson(): Promise<JsonExportResponseDto> {
		this.logger.log("Начало экспорта данных РБД в JSON DL");

		const startTime = Date.now();

		try {
			// Пробуем получить данные из кэша
			this.logger.debug("Попытка получения данных из кэша общего экспорта");
			const cachedData = await this.cacheService.getCachedExportAll();

			if (cachedData) {
				const duration = Date.now() - startTime;
				this.logger.log("Экспорт завершен (данные из кэша)", {
					source: "cache",
					duration,
					entitiesCount: cachedData.entities?.length || 0,
					mappingsCount: cachedData.mappings?.length || 0,
				});

				return cachedData;
			}

			this.logger.debug("Кэш-промах, выполнение полного экспорта");

			// Получаем последнюю дату изменений для desc.change_date
			const latestChange = await this.getLatestChange();

			// Получаем все сущности с деталями
			const entitiesWithDetails = await this.getEntitiesWithDetails();

			// Получаем все маппинги с деталями
			const mappingsWithDetails = await this.getMappingsWithDetails();

			// Преобразуем данные в структуру JSON согласно документации
			const entities = this.transformEntities(
				entitiesWithDetails,
				mappingsWithDetails,
			);
			const mappings = this.transformMappings(mappingsWithDetails);

			const result: JsonExportResponseDto = {
				desc: {
					change_date:
						latestChange?.change_date.toISOString() || new Date().toISOString(),
				},
				entities,
				mappings,
			};

			// Сохраняем в кэш
			this.logger.debug("Сохранение данных экспорта в кэш");
			await this.cacheService.setCachedExportAll(result);

			const duration = Date.now() - startTime;
			this.logger.log("Экспорт завершен и закэширован", {
				source: "database",
				duration,
				entitiesCount: entities.length,
				mappingsCount: mappings.length,
				cacheSaved: true,
			});

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error(`Ошибка экспорта за ${duration}ms`, {
				error: error.message,
				stack: error.stack,
				duration,
				timestamp: new Date().toISOString(),
			});
			throw error;
		}
	}

	async exportByChangeId(changeId: number): Promise<JsonExportResponseDto> {
		this.logger.log(`Экспорт данных по change_id: ${changeId}`);

		const startTime = Date.now();

		try {
			// Пробуем получить данные из кэша
			this.logger.debug(
				`Попытка получения данных из кэша для change_id: ${changeId}`,
			);
			const cachedData =
				await this.cacheService.getCachedExportByChangeId(changeId);

			if (cachedData) {
				const duration = Date.now() - startTime;
				this.logger.log(
					`Экспорт по change_id ${changeId} завершен (данные из кэша)`,
					{
						source: "cache",
						duration,
						changeId,
						entitiesCount: cachedData.entities?.length || 0,
						mappingsCount: cachedData.mappings?.length || 0,
					},
				);

				return cachedData;
			}

			this.logger.debug(
				`Кэш-промах для change_id ${changeId}, выполнение экспорта из БД`,
			);

			// Проверяем существование change_id
			const change = await this.changeRepository.findOne({
				where: { change_id: changeId },
			});

			if (!change) {
				throw new NotFoundException(`Change с ID ${changeId} не найден`);
			}

			// Получаем сущности на момент указанного change_id
			const entitiesWithDetails = await this.getEntitiesWithDetails(changeId);

			// Получаем маппинги на момент указанного change_id
			const mappingsWithDetails = await this.getMappingsWithDetails(changeId);

			// Преобразуем данные в структуру JSON
			const entities = this.transformEntities(
				entitiesWithDetails,
				mappingsWithDetails,
			);
			const mappings = this.transformMappings(mappingsWithDetails);

			const result: JsonExportResponseDto = {
				desc: {
					change_date: change.change_date.toISOString(),
				},
				entities,
				mappings,
			};

			// Сохраняем в кэш
			this.logger.debug(
				`Сохранение данных экспорта для change_id ${changeId} в кэш`,
			);
			await this.cacheService.setCachedExportByChangeId(
				changeId,
				result,
				this.cacheTtl,
			);

			const duration = Date.now() - startTime;
			this.logger.log(
				`Экспорт по change_id ${changeId} завершен и закэширован`,
				{
					source: "database",
					duration,
					changeId,
					entitiesCount: entities.length,
					mappingsCount: mappings.length,
					cacheSaved: true,
				},
			);

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error(
				`Ошибка экспорта по change_id ${changeId} за ${duration}ms`,
				{
					error: error.message,
					stack: error.stack,
					changeId,
					duration,
					timestamp: new Date().toISOString(),
				},
			);

			if (error instanceof NotFoundException) {
				throw error;
			}

			throw error;
		}
	}

	private async getLatestChange(): Promise<ChangeEntity | null> {
		return await this.changeRepository.findOne({
			where: {},
			order: { change_date: "DESC" },
		});
	}

	private async getEntitiesWithDetails(
		changeId?: number,
	): Promise<EntityWithDetails[]> {
		let dateFilter = "";
		const params: any[] = [];

		if (changeId) {
			// Получаем дату изменения для указанного change_id
			const change = await this.changeRepository.findOne({
				where: { change_id: changeId },
			});
			if (!change) {
				throw new NotFoundException(`Change с ID ${changeId} не найден`);
			}
			dateFilter = `
                AND e.change_id IN (
                    SELECT MAX(e2.change_id) 
                    FROM entity e2 
                    WHERE e2.full_name = e.full_name 
                    AND e2.change_id <= $1
                    GROUP BY e2.full_name
                )
                AND (ec.change_id IS NULL OR ec.change_id <= $2)
            `;
			params.push(changeId, changeId);
		}

		const query = `
            SELECT
                e.entity_id,
                e.full_name,
                e.name,
                e.description,
                e.entity_type_id,
                e.entity_container_id,
                e.change_id,
                et.name as entity_type_name,
                ec.value as container_value,
                ec.description as container_description,
                s.code as system_code,
                c_entity.change_date as entity_change_date,
                c_container.change_date as container_change_date
            FROM entity e
                     LEFT JOIN entity_type et ON e.entity_type_id = et.entity_type_id
                     LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
                     LEFT JOIN systems s ON ec.system_id = s.system_id
                     LEFT JOIN changes c_entity ON e.change_id = c_entity.change_id
                     LEFT JOIN changes c_container ON ec.change_id = c_container.change_id
            WHERE 1=1 ${dateFilter}
            ORDER BY e.full_name
        `;

		const entities = await this.dataSource.query(query, params);

		// Загружаем атрибуты для каждой сущности
		for (const entity of entities) {
			entity.attributes = await this.getAttributesForEntity(
				entity.entity_id,
				changeId,
			);
		}

		return entities;
	}

	private async getAttributesForEntity(
		entityId: number,
		changeId?: number,
	): Promise<any[]> {
		let dateFilter = "";
		const params: any[] = [entityId];

		if (changeId) {
			dateFilter = " AND a.change_id <= $2";
			params.push(changeId);
		}

		const query = `
            SELECT
                a.attribute_id,
                a.name,
                a.description,
                a.type_id,
                at.name as type_name,
                c.change_date as attribute_change_date
            FROM attribute a
                     LEFT JOIN attribute_type at ON a.type_id = at.type_id
                LEFT JOIN changes c ON a.change_id = c.change_id
            WHERE a.entity_id = $1 ${dateFilter}
            ORDER BY a.name
        `;

		return await this.dataSource.query(query, params);
	}

	private async getMappingsWithDetails(
		changeId?: number,
	): Promise<MappingWithDetails[]> {
		let dateFilter = "";
		const params: any[] = [];

		if (changeId) {
			dateFilter = `
                AND em.change_id IN (
                    SELECT MAX(em2.change_id) 
                    FROM entity_map em2 
                    WHERE em2.entity_id = em.entity_id 
                    AND em2.process_id = em.process_id
                    AND em2.change_id <= $1
                    GROUP BY em2.entity_id, em2.process_id
                )
                AND (p.change_id IS NULL OR p.change_id <= $2)
            `;
			params.push(changeId, changeId);
		}

		// Получаем основные данные entity_map с информацией о процессе
		const entityMapsQuery = `
            SELECT
                em.entity_map_id,
                em.entity_id as target_entity_id,
                em.process_id,
                em.description as entity_map_description,
                em.change_id,
                e_target.full_name as target_full_name,
                e_target.name as target_entity_name,
                p.name as process_name,
                p.description as process_description,
                c_em.change_date as relation_change_date,
                c_process.change_date as process_change_date
            FROM entity_map em
                     INNER JOIN entity e_target ON em.entity_id = e_target.entity_id
                     LEFT JOIN process p ON em.process_id = p.process_id
                     LEFT JOIN changes c_em ON em.change_id = c_em.change_id
                     LEFT JOIN changes c_process ON p.change_id = c_process.change_id
            WHERE 1=1 ${dateFilter}
            ORDER BY e_target.full_name
        `;

		const entityMaps = await this.dataSource.query(entityMapsQuery, params);

		// Для каждого entity_map получаем зависимости из ВСЕХ таблиц
		for (const entityMap of entityMaps) {
			entityMap.dependencies = await this.getDependenciesForEntityMap(
				entityMap.entity_map_id,
				changeId,
			);

			// Получаем информацию о неудачных маппингах
			entityMap.unmatched = await this.getUnmatchedEntities(
				entityMap.target_entity_name,
				changeId,
			);
		}

		return entityMaps;
	}

	private async getDependenciesForEntityMap(
		entityMapId: number,
		changeId?: number,
	): Promise<MappingWithDetails["dependencies"]> {
		// Используем Set для уникальных зависимостей
		const dependenciesMap = new Map<
			number,
			{
				source_entity_id: number;
				source_entity_name: string;
				source_full_name: string;
				attr_maps: AttributeMapRaw[];
				attr_deps: AttributeDepGrouped[];
			}
		>();

		// Получаем зависимости из entity_map_source
		const sourceEntities = await this.getSourceEntitiesFromEntityMap(
			entityMapId,
			changeId,
		);

		// Получаем зависимости из attribute_map и attribute_map_source
		const attrMapDependencies = await this.getDependenciesFromAttributeMaps(
			entityMapId,
			changeId,
		);

		// Получаем зависимости из entity_attribute_map
		const attrDepDependencies =
			await this.getDependenciesFromEntityAttributeMap(entityMapId, changeId);

		// Объединяем все зависимости
		for (const sourceEntity of sourceEntities) {
			if (!dependenciesMap.has(sourceEntity.source_entity_id)) {
				dependenciesMap.set(sourceEntity.source_entity_id, {
					source_entity_id: sourceEntity.source_entity_id,
					source_entity_name: sourceEntity.source_entity_name,
					source_full_name: sourceEntity.source_full_name,
					attr_maps: [],
					attr_deps: [],
				});
			}
		}

		// Добавляем attr_maps из attribute_map_source
		for (const attrMap of attrMapDependencies) {
			const dependency = dependenciesMap.get(attrMap.source_entity_id);
			if (dependency) {
				dependency.attr_maps.push({
					attribute_map_id: attrMap.attribute_map_id,
					target_attribute_id: attrMap.target_attribute_id,
					target_attribute_name: attrMap.target_attribute_name,
					source_attribute_id: attrMap.source_attribute_id,
					source_attribute_name: attrMap.source_attribute_name,
					relation_change_date: attrMap.relation_change_date,
					source_entity_id: attrMap.source_entity_id,
				});
			} else {
				// Если зависимость не найдена в entity_map_source, создаем новую
				dependenciesMap.set(attrMap.source_entity_id, {
					source_entity_id: attrMap.source_entity_id,
					source_entity_name: await this.getEntityNameById(
						attrMap.source_entity_id,
					),
					source_full_name: await this.getEntityFullNameById(
						attrMap.source_entity_id,
					),
					attr_maps: [
						{
							attribute_map_id: attrMap.attribute_map_id,
							target_attribute_id: attrMap.target_attribute_id,
							target_attribute_name: attrMap.target_attribute_name,
							source_attribute_id: attrMap.source_attribute_id,
							source_attribute_name: attrMap.source_attribute_name,
							relation_change_date: attrMap.relation_change_date,
							source_entity_id: attrMap.source_entity_id,
						},
					],
					attr_deps: [],
				});
			}
		}

		// Добавляем attr_deps из entity_attribute_map
		for (const attrDep of attrDepDependencies) {
			const dependency = dependenciesMap.get(attrDep.source_entity_id);
			if (dependency) {
				// Ищем существующий attr_dep или создаем новый
				const existingDep = dependency.attr_deps.find(
					(d) => d.source_attribute_id === attrDep.source_attribute_id,
				);

				if (existingDep) {
					if (!existingDep.linkTypes.includes(attrDep.deptype_id)) {
						existingDep.linkTypes.push(attrDep.deptype_id);
					}
					// Обновляем дату на самую позднюю
					if (attrDep.relation_change_date > existingDep.relation_change_date) {
						existingDep.relation_change_date = attrDep.relation_change_date;
					}
				} else {
					dependency.attr_deps.push({
						source_attribute_id: attrDep.source_attribute_id,
						source_attribute_name: attrDep.source_attribute_name,
						linkTypes: [attrDep.deptype_id],
						relation_change_date: attrDep.relation_change_date,
					});
				}
			} else {
				// Если зависимость не найдена, создаем новую
				dependenciesMap.set(attrDep.source_entity_id, {
					source_entity_id: attrDep.source_entity_id,
					source_entity_name: await this.getEntityNameById(
						attrDep.source_entity_id,
					),
					source_full_name: await this.getEntityFullNameById(
						attrDep.source_entity_id,
					),
					attr_maps: [],
					attr_deps: [
						{
							source_attribute_id: attrDep.source_attribute_id,
							source_attribute_name: attrDep.source_attribute_name,
							linkTypes: [attrDep.deptype_id],
							relation_change_date: attrDep.relation_change_date,
						},
					],
				});
			}
		}

		return Array.from(dependenciesMap.values());
	}

	private async getSourceEntitiesFromEntityMap(
		entityMapId: number,
		changeId?: number,
	): Promise<any[]> {
		let dateFilter = "";
		const params: any[] = [entityMapId];

		if (changeId) {
			dateFilter = " AND ems.change_id <= $2";
			params.push(changeId);
		}

		const query = `
            SELECT DISTINCT
                ems.source_entity_id,
                e_source.name as source_entity_name,
                e_source.full_name as source_full_name
            FROM entity_map_source ems
                     INNER JOIN entity e_source ON ems.source_entity_id = e_source.entity_id
            WHERE ems.entity_map_id = $1 ${dateFilter}
        `;

		return await this.dataSource.query(query, params);
	}

	private async getDependenciesFromAttributeMaps(
		entityMapId: number,
		changeId?: number,
	): Promise<any[]> {
		let dateFilter = "";
		const params: any[] = [entityMapId];

		if (changeId) {
			dateFilter = `
                AND am.change_id <= $2
                AND ams.change_id <= $3
            `;
			params.push(changeId, changeId);
		}

		const query = `
            SELECT DISTINCT
                am.attribute_map_id,
                am.attribute_id as target_attribute_id,
                a_target.name as target_attribute_name,
                ams.source_attribute_id,
                a_source.name as source_attribute_name,
                a_source.entity_id as source_entity_id,
                GREATEST(
                        COALESCE(c_am.change_date, '1970-01-01'),
                        COALESCE(c_ams.change_date, '1970-01-01')
                ) as relation_change_date
            FROM attribute_map am
                     INNER JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
                     INNER JOIN attribute a_target ON am.attribute_id = a_target.attribute_id
                     INNER JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
                     LEFT JOIN changes c_am ON am.change_id = c_am.change_id
                     LEFT JOIN changes c_ams ON ams.change_id = c_ams.change_id
            WHERE am.entity_map_id = $1 ${dateFilter}
        `;

		return await this.dataSource.query(query, params);
	}

	private async getDependenciesFromEntityAttributeMap(
		entityMapId: number,
		changeId?: number,
	): Promise<any[]> {
		let dateFilter = "";
		const params: any[] = [entityMapId];

		if (changeId) {
			dateFilter = " AND eam.change_id <= $2";
			params.push(changeId);
		}

		const query = `
            SELECT DISTINCT
                eam.source_attribute_id,
                a.name as source_attribute_name,
                a.entity_id as source_entity_id,
                eam.deptype_id,
                c_eam.change_date as relation_change_date
            FROM entity_attribute_map eam
                     INNER JOIN attribute a ON eam.source_attribute_id = a.attribute_id
                     LEFT JOIN changes c_eam ON eam.change_id = c_eam.change_id
            WHERE eam.entity_map_id = $1 ${dateFilter}
        `;

		return await this.dataSource.query(query, params);
	}

	private async getUnmatchedEntities(
		entityName: string,
		changeId?: number,
	): Promise<string> {
		let dateFilter = "";
		const params: any[] = [entityName];

		if (changeId) {
			dateFilter = " AND fm.change_id <= $2";
			params.push(changeId);
		}

		const query = `
            SELECT fm.unmatched_entities
            FROM failed_mappings fm
            WHERE fm.entity_name = $1 ${dateFilter}
            ORDER BY fm.change_id DESC
                LIMIT 1
        `;

		const result = await this.dataSource.query(query, params);
		return result.length > 0 ? result[0].unmatched_entities : "";
	}

	private async getEntityNameById(entityId: number): Promise<string> {
		const query = `
            SELECT name FROM entity WHERE entity_id = $1
        `;
		const result = await this.dataSource.query(query, [entityId]);
		return result.length > 0 ? result[0].name : `Unknown Entity ${entityId}`;
	}

	private async getEntityFullNameById(entityId: number): Promise<string> {
		const query = `
            SELECT full_name FROM entity WHERE entity_id = $1
        `;
		const result = await this.dataSource.query(query, [entityId]);
		return result.length > 0 ? result[0].full_name : `unknown.${entityId}`;
	}

	private transformEntities(
		entitiesWithDetails: EntityWithDetails[],
		mappingsWithDetails: MappingWithDetails[],
	): JsonExportResponseDto["entities"] {
		// Собираем Set entity_id, которые являются целевыми (присутствуют в entity_map)
		const targetEntityIds = new Set<number>();
		mappingsWithDetails.forEach((mapping) => {
			targetEntityIds.add(mapping.target_entity_id);
		});

		return entitiesWithDetails.map((entity) => {
			const entityType = this.mapEntityTypeToJson(entity.entity_type_name);

			return {
				id: entity.full_name, // Используем full_name как полное составное имя
				modified: targetEntityIds.has(entity.entity_id),
				type: entityType,
				namespace: entity.container_value || "default",
				name: entity.name,
				entity_change: entity.entity_change_date.toISOString(),
				description: entity.description || undefined,
				container_description: entity.container_description || undefined,
				system_code: entity.system_code || undefined,
				container_change:
					entity.container_change_date?.toISOString() ||
					entity.entity_change_date.toISOString(),
				attrSeq: entity.attributes.map((attr) => ({
					name: attr.name,
					type: this.normalizeAttributeType(attr.type_name),
					comment: attr.description || undefined,
					attr_change: attr.attribute_change_date.toISOString(),
				})),
			};
		});
	}

	private transformMappings(
		mappingsWithDetails: MappingWithDetails[],
	): JsonExportResponseDto["mappings"] {
		return mappingsWithDetails.map((mapping) => ({
			entityId: mapping.target_full_name, // Полное составное имя сущности
			process: mapping.process_name || undefined, // Имя процесса
			process_description: mapping.process_description || undefined, // Описание процесса
			process_change: mapping.process_change_date?.toISOString() || undefined,
			description: mapping.entity_map_description || undefined,
			relation_change: mapping.relation_change_date.toISOString(),
			deps: mapping.dependencies.map((dep) => ({
				entityId: dep.source_full_name, // Полное составное имя source entity
				attrMaps: dep.attr_maps.map((attrMap) => ({
					src: attrMap.source_attribute_name,
					dst: attrMap.target_attribute_name,
					relation_change: attrMap.relation_change_date.toISOString(),
				})),
				atrDeps: dep.attr_deps.map((attrDep) => ({
					attr: attrDep.source_attribute_name,
					linkTypes: attrDep.linkTypes,
					relation_change: attrDep.relation_change_date.toISOString(),
				})),
			})),
			unmatched: mapping.unmatched || undefined,
		}));
	}

	private mapEntityTypeToJson(entityTypeName: string): string {
		const typeMapping: { [key: string]: string } = {
			TABLE_HIVE: "table",
			VIEW_HIVE: "view",
			JSON: "json",
			INPUT_VECTOR: "input_vector",
			UNRESOLVED: "unresolved",
			RDD: "rdd",
		};

		return typeMapping[entityTypeName] || "table";
	}

	private normalizeAttributeType(typeName: string): string {
		const type = typeName.toLowerCase();

		if (type.includes("timestamp") || type.includes("date")) {
			return "TIMESTAMP";
		} else if (
			type.includes("decimal") ||
			type.includes("numeric") ||
			type.includes("float") ||
			type.includes("double")
		) {
			return "DECIMAL";
		} else if (type.includes("int") || type.includes("integer")) {
			return "INTEGER";
		} else {
			return "STRING";
		}
	}
}
