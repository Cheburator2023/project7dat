import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { JsonExportResponseDto } from "../dto";
import { ChangeEntity } from "../entities/change.entity";
import { EntityEntity } from "../entities/entity.entity";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "./cache.service";

interface EntityWithDetails {
	entity_id: number;
	full_name: string;
	name: string;
	description?: string;
	entity_type_id: number;
	entity_type_name: string;
	namespace?: string;
	system_code: string;
	system_name?: string;
	entity_change_date: Date;
	container_description?: string;
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

interface MappingWithDetails {
	entity_map_id: number;
	target_entity_id: number;
	target_entity_full_name: string;
	target_system_code: string;
	mapping_description?: string;
	relation_change_date: Date;
	process_id?: number;
	process_name?: string;
	process_description?: string;
	process_change_date?: Date;
	source_entity_id?: number;
	source_entity_full_name?: string;
	source_system_code?: string;
	attr_maps: Array<{
		src: string;
		dst: string;
		src_id?: number;
		dst_id?: number;
		relation_change: string;
	}>;
	atr_deps: Array<{
		attr: string;
		linkTypes: string[];
		src_id?: number;
		relation_change: string;
	}>;
}

@Injectable()
export class JsonSearchService {
	private readonly logger = new Logger(JsonSearchService.name);

	constructor(
		@InjectRepository(ChangeEntity)
		private readonly changeRepository: Repository<ChangeEntity>,
		@InjectRepository(EntityEntity)
		readonly _entityRepository: Repository<EntityEntity>,
		private readonly dataSource: DataSource,
		private readonly configService: ConfigService,
		readonly _cacheService: CacheService,
	) {
		this.cacheTtl = this.configService.get<number>("CACHE_TTL", 600);
	}

	/**
	 * Экспорт данных в формате JSON
	 */
	async getJson({
		search,
	}: {
		search: string;
	}): Promise<JsonExportResponseDto> {
		this.logger.log(
			"Начало исправленного экспорта данных РБД в новый формат JSON DL",
		);

		const startTime = Date.now();

		try {
			// Пробуем получить данные из кэша
			// this.logger.debug("Попытка получения данных из кэша нового формата");
			// const cachedData = await this.cacheService.getCachedExportAll();
			//
			// if (cachedData) {
			// 	const duration = Date.now() - startTime;
			// 	this.logger.log("Экспорт завершен (данные из кэша)", {
			// 		source: "cache",
			// 		duration,
			// 		entitiesCount: cachedData.entities?.length || 0,
			// 		mappingsCount: cachedData.mappings?.length || 0,
			// 	});
			// 	return cachedData;
			// }
			//
			// this.logger.debug(
			// 	"Кэш-промах, выполнение полного экспорта с новой структурой",
			// );

			// Получаем последнюю дату изменений
			const latestChange = await this.getLatestChange();

			// Получаем все сущности с деталями
			const entitiesWithDetails =
				await this.getEnhancedEntitiesWithDetails(search);

			const results: any[] = [];
			for (const entity of entitiesWithDetails) {
				const mappingForEntity = await this.exportEntityRelations(
					entity.full_name,
				);
				results.concat(mappingForEntity.mappings);
			}

			// Преобразуем данные в новую структуру JSON согласно ТЗ
			const entities = this.transformEnhancedEntities(
				entitiesWithDetails,
				results,
			);
			// const mappings =
			// 	this.transformEnhancedMappingsWithCorrectStructure(mappingsWithDetails);

			const result: JsonExportResponseDto = {
				desc: {
					change_date:
						latestChange?.change_date.toISOString() || new Date().toISOString(),
				},
				entities,
				mappings: results,
			};

			// Сохраняем в кэш
			// this.logger.debug("Сохранение данных экспорта в кэш (новая структура)");
			// await this.cacheService.setCachedExportAll(result);

			const duration = Date.now() - startTime;
			this.logger.log("Экспорт с новой структурой завершен и закэширован", {
				source: "database",
				duration,
				entitiesCount: entities.length,
				mappingsCount: 0,
				cacheSaved: true,
			});

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error(`Ошибка исправленного экспорта за ${duration}ms`, {
				error: error.message,
				stack: error.stack,
				duration,
				timestamp: new Date().toISOString(),
			});
			throw error;
		}
	}

	/**
	 * Получение сущностей с деталями
	 */
	private async getEnhancedEntitiesWithDetails(
		search?: string,
	): Promise<EntityWithDetails[]> {
		const query = `
            SELECT
                e.entity_id,
                e.full_name,
                e.name,
                e.description,
                e.entity_type_id,
                et.name as entity_type_name,
                ec.value as namespace,
                COALESCE(s.code,
                         CASE
                             WHEN ec.value LIKE '%1642%' OR e.full_name LIKE '%1642%' THEN '1642'
                             WHEN ec.value LIKE '%1655%' OR e.full_name LIKE '%1655%' THEN '1655'
                             WHEN et.name IN ('TABLE_HIVE', 'VIEW_HIVE') THEN '1642'
                             WHEN et.name IN ('JSON', 'INPUT_VECTOR') THEN '1655'
                             ELSE '1642'
                             END
                ) as system_code,
                s.name as system_name,
                s.system_id,
                c_entity.change_date as entity_change_date,
                ec.description as container_description,
                c_container.change_date as container_change_date
            FROM entity e
                     LEFT JOIN entity_type et ON e.entity_type_id = et.entity_type_id
                     LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
                     LEFT JOIN systems s ON ec.system_id = s.system_id
                     LEFT JOIN changes c_entity ON e.change_id = c_entity.change_id
                     LEFT JOIN changes c_container ON ec.change_id = c_container.change_id
            WHERE e.full_name LIKE '%' || $1 || '%'
            ORDER BY e.full_name
        `;

		const entities = await this.dataSource.query(query, [search]);

		// Загружаем атрибуты для каждой сущности
		for (const entity of entities) {
			entity.attributes = await this.getEnhancedAttributesForEntity(
				entity.entity_id,
			);
		}

		return entities;
	}

	/**
	 * Получение атрибутов для сущности
	 */
	private async getEnhancedAttributesForEntity(
		entityId: number,
	): Promise<any[]> {
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
            WHERE a.entity_id = $1
            ORDER BY a.name
        `;

		return await this.dataSource.query(query, [entityId]);
	}

	/**
	 * Преобразование сущностей в DTO
	 */
	private transformEnhancedEntities(
		entitiesWithDetails: EntityWithDetails[],
		mappingsWithDetails: MappingWithDetails[],
	): JsonExportResponseDto["entities"] {
		// Собираем целевые сущности из маппингов
		const targetEntityNames = new Set<string>();
		mappingsWithDetails.forEach((mapping) => {
			if (mapping.target_entity_full_name) {
				targetEntityNames.add(mapping.target_entity_full_name);
			}
		});

		return entitiesWithDetails.map((entity) => {
			const entityType = this.mapEntityTypeToJson(entity.entity_type_name);

			return {
				id: entity.full_name,
				modified: targetEntityNames.has(entity.full_name),
				type: entityType,
				namespace: entity.namespace || "default",
				name: entity.name,
				system_code: entity.system_code || "1642",
				system_name: entity.system_name,
				entity_change: entity.entity_change_date.toISOString(),
				description: entity.description || undefined,
				container_description: entity.container_description || undefined,
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

	/**
	 * Экспорт всех связей для одной сущности по full_name.
	 * Строит полный граф lineage (upstream + downstream) аналогично фронтовому buildLineageGraph,
	 * затем собирает все маппинги для связанных сущностей.
	 */
	async exportEntityRelations(
		entityFullName: string,
	): Promise<JsonExportResponseDto> {
		this.logger.log(`Экспорт связей для сущности: ${entityFullName}`);
		const startTime = Date.now();

		// 1. Строим полный граф lineage: target_full_name -> source_full_names[]
		const lineageEdges: Array<{
			entity_map_id: number;
			target_entity_id: number;
			target_full_name: string;
			source_entity_id: number;
			source_full_name: string;
		}> = await this.dataSource.query(
			`SELECT DISTINCT
				am.entity_map_id,
				em.entity_id AS target_entity_id,
				e_target.full_name AS target_full_name,
				a_source.entity_id AS source_entity_id,
				e_source.full_name AS source_full_name
			FROM attribute_map am
			INNER JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
			INNER JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
			INNER JOIN entity e_source ON a_source.entity_id = e_source.entity_id
			INNER JOIN entity_map em ON am.entity_map_id = em.entity_map_id
			INNER JOIN entity e_target ON em.entity_id = e_target.entity_id
			WHERE em.change_id IS NOT NULL`,
		);

		// Строим upstream/downstream графы (по full_name, как на фронте)
		const upstream = new Map<string, Set<string>>();
		const downstream = new Map<string, Set<string>>();

		for (const edge of lineageEdges) {
			if (!upstream.has(edge.target_full_name)) {
				upstream.set(edge.target_full_name, new Set());
			}
			upstream.get(edge.target_full_name)!.add(edge.source_full_name);

			if (!downstream.has(edge.source_full_name)) {
				downstream.set(edge.source_full_name, new Set());
			}
			downstream.get(edge.source_full_name)!.add(edge.target_full_name);
		}

		this.logger.log(
			`Граф lineage построен: ${lineageEdges.length} рёбер, ` +
				`${upstream.size} targets, ${downstream.size} sources`,
		);

		// 2. BFS upstream (кто поставляет данные в нашу сущность)
		const upstreamEntities = new Set<string>();
		{
			const queue = [entityFullName];
			const visited = new Set<string>([entityFullName]);
			while (queue.length > 0) {
				const current = queue.shift()!;
				const parents = upstream.get(current);
				if (!parents) continue;
				for (const parent of parents) {
					if (visited.has(parent)) continue;
					visited.add(parent);
					upstreamEntities.add(parent);
					queue.push(parent);
				}
			}
		}

		// 3. BFS downstream (куда наша сущность поставляет данные)
		const downstreamEntities = new Set<string>();
		{
			const queue = [entityFullName];
			const visited = new Set<string>([entityFullName]);
			while (queue.length > 0) {
				const current = queue.shift()!;
				const children = downstream.get(current);
				if (!children) continue;
				for (const child of children) {
					if (visited.has(child)) continue;
					visited.add(child);
					downstreamEntities.add(child);
					queue.push(child);
				}
			}
		}

		const allRelatedNames = new Set<string>([
			entityFullName,
			...upstreamEntities,
			...downstreamEntities,
		]);

		this.logger.log(
			`BFS для ${entityFullName}: upstream=${upstreamEntities.size}, ` +
				`downstream=${downstreamEntities.size}, total=${allRelatedNames.size}`,
		);

		// 4. Собираем все entity_map_id, которые связывают наши сущности
		const relevantEntityMapIds = new Set<number>();
		for (const edge of lineageEdges) {
			if (
				allRelatedNames.has(edge.target_full_name) &&
				allRelatedNames.has(edge.source_full_name)
			) {
				relevantEntityMapIds.add(edge.entity_map_id);
			}
		}

		const entityMapIds = Array.from(relevantEntityMapIds);
		this.logger.log(`Релевантных entity_map: ${entityMapIds.length}`);

		if (entityMapIds.length === 0) {
			return {
				desc: { change_date: new Date().toISOString() },
				entities: [],
				mappings: [],
			};
		}

		// 5. Загружаем все entity_map записи
		const entityMaps = await this.dataSource.query(
			`SELECT
				em.entity_map_id,
				em.entity_id AS target_entity_id,
				e_target.full_name AS target_full_name,
				em.description,
				em.process_id,
				p.name AS process_name,
				p.description AS process_description,
				c_rel.change_date AS relation_change_date,
				c_proc.change_date AS process_change_date
			FROM entity_map em
			INNER JOIN entity e_target ON em.entity_id = e_target.entity_id
			LEFT JOIN process p ON em.process_id = p.process_id
			LEFT JOIN changes c_rel ON em.change_id = c_rel.change_id
			LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
			WHERE em.entity_map_id = ANY($1)
			ORDER BY em.entity_map_id`,
			[entityMapIds],
		);

		// 6. Загружаем все атрибутные маппинги
		const allAttrMaps = await this.dataSource.query(
			`SELECT
				am.entity_map_id,
				am.attribute_id AS target_attribute_id,
				a_target.name AS target_attribute_name,
				ams.source_attribute_id,
				a_source.name AS source_attribute_name,
				a_source.entity_id AS source_entity_id,
				e_source.full_name AS source_full_name,
				GREATEST(
					COALESCE(c_am.change_date, '1970-01-01'),
					COALESCE(c_ams.change_date, '1970-01-01')
				) AS relation_change_date
			FROM attribute_map am
			INNER JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
			INNER JOIN attribute a_target ON am.attribute_id = a_target.attribute_id
			INNER JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
			INNER JOIN entity e_source ON a_source.entity_id = e_source.entity_id
			LEFT JOIN changes c_am ON am.change_id = c_am.change_id
			LEFT JOIN changes c_ams ON ams.change_id = c_ams.change_id
			WHERE am.entity_map_id = ANY($1)
			ORDER BY a_source.name`,
			[entityMapIds],
		);

		// 7. Загружаем все функциональные зависимости
		const allAttrDeps = await this.dataSource.query(
			`SELECT
				eam.entity_map_id,
				eam.source_attribute_id,
				a.name AS source_attribute_name,
				a.entity_id AS source_entity_id,
				e.full_name AS source_full_name,
				ARRAY_AGG(DISTINCT eam.deptype_id) AS link_types,
				MAX(c_dep.change_date) AS relation_change_date
			FROM entity_attribute_map eam
			INNER JOIN attribute a ON eam.source_attribute_id = a.attribute_id
			INNER JOIN entity e ON a.entity_id = e.entity_id
			LEFT JOIN changes c_dep ON eam.change_id = c_dep.change_id
			WHERE eam.entity_map_id = ANY($1)
			GROUP BY eam.entity_map_id, eam.source_attribute_id, a.name, a.entity_id, e.full_name
			ORDER BY a.name`,
			[entityMapIds],
		);

		// 8. Загружаем детали всех связанных сущностей
		const allEntityDetails = new Map<string, any>();
		if (allRelatedNames.size > 0) {
			const entityRows = await this.dataSource.query(
				`SELECT
					e.entity_id,
					e.full_name,
					e.name,
					e.description,
					e.entity_type_id,
					et.name AS entity_type_name,
					ec.value AS namespace,
					COALESCE(s.code,
						CASE
							WHEN ec.value LIKE '%1642%' OR e.full_name LIKE '%1642%' THEN '1642'
							WHEN ec.value LIKE '%1655%' OR e.full_name LIKE '%1655%' THEN '1655'
							WHEN et.name IN ('TABLE_HIVE','VIEW_HIVE') THEN '1642'
							WHEN et.name IN ('JSON','INPUT_VECTOR') THEN '1655'
							ELSE '1642'
						END
					) AS system_code,
					s.name AS system_name,
					c.change_date AS entity_change_date,
					ec.description AS container_description,
					c_cont.change_date AS container_change_date
				FROM entity e
				LEFT JOIN entity_type et ON e.entity_type_id = et.entity_type_id
				LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
				LEFT JOIN systems s ON ec.system_id = s.system_id
				LEFT JOIN changes c ON e.change_id = c.change_id
				LEFT JOIN changes c_cont ON ec.change_id = c_cont.change_id
				WHERE e.full_name = ANY($1)`,
				[Array.from(allRelatedNames)],
			);

			for (const row of entityRows) {
				row.attributes = await this.getEnhancedAttributesForEntity(
					row.entity_id,
				);
				allEntityDetails.set(row.full_name, row);
			}
		}

		// 9. Собираем entities DTO
		const entitiesDto: JsonExportResponseDto["entities"] = [];
		for (const [fullName, detail] of allEntityDetails) {
			entitiesDto.push(
				this.buildEntityDto(
					detail,
					detail.attributes,
					fullName === entityFullName,
				),
			);
		}

		// 10. Группируем маппинги: каждый entity_map → один mapping с deps[]
		const mappingsDto: JsonExportResponseDto["mappings"] = [];

		for (const em of entityMaps) {
			const emAttrMaps = allAttrMaps.filter(
				(am: any) => am.entity_map_id === em.entity_map_id,
			);
			const emAttrDeps = allAttrDeps.filter(
				(ad: any) => ad.entity_map_id === em.entity_map_id,
			);

			const depsMap = new Map<
				number,
				JsonExportResponseDto["mappings"][0]["deps"][0]
			>();

			for (const am of emAttrMaps) {
				if (!depsMap.has(am.source_entity_id)) {
					const srcDetail = allEntityDetails.get(am.source_full_name);
					depsMap.set(am.source_entity_id, {
						entityId: am.source_full_name,
						system_code: srcDetail?.system_code ?? "1642",
						source_id: am.source_entity_id,
						process_id: em.process_id ?? undefined,
						process: em.process_name ?? undefined,
						process_description: em.process_description ?? undefined,
						process_change: em.process_change_date?.toISOString(),
						attrMaps: [],
						atrDeps: [],
					});
				}
				depsMap.get(am.source_entity_id)!.attrMaps.push({
					src: am.source_attribute_name,
					dst: am.target_attribute_name,
					src_id: am.source_attribute_id,
					dst_id: am.target_attribute_id,
					relation_change:
						am.relation_change_date?.toISOString?.() ??
						new Date().toISOString(),
				});
			}

			for (const ad of emAttrDeps) {
				if (!depsMap.has(ad.source_entity_id)) {
					const srcDetail = allEntityDetails.get(ad.source_full_name);
					depsMap.set(ad.source_entity_id, {
						entityId: ad.source_full_name,
						system_code: srcDetail?.system_code ?? "1642",
						source_id: ad.source_entity_id,
						process_id: em.process_id ?? undefined,
						process: em.process_name ?? undefined,
						process_description: em.process_description ?? undefined,
						process_change: em.process_change_date?.toISOString(),
						attrMaps: [],
						atrDeps: [],
					});
				}
				depsMap.get(ad.source_entity_id)!.atrDeps.push({
					attr: ad.source_attribute_name,
					linkTypes: ad.link_types ?? [],
					src_id: ad.source_attribute_id,
					relation_change:
						ad.relation_change_date?.toISOString?.() ??
						new Date().toISOString(),
				});
			}

			const targetDetail = allEntityDetails.get(em.target_full_name);
			mappingsDto.push({
				entityId: em.target_full_name,
				description: em.description ?? undefined,
				entity_map_id: em.entity_map_id,
				target_id: em.target_entity_id,
				system_code: targetDetail?.system_code || "1642",
				relation_change:
					em.relation_change_date?.toISOString() ?? new Date().toISOString(),
				deps: Array.from(depsMap.values()),
			});
		}

		const duration = Date.now() - startTime;
		const totalDeps = mappingsDto.reduce((sum, m) => sum + m.deps.length, 0);
		this.logger.log(
			`Экспорт связей для ${entityFullName} завершён за ${duration}ms: ` +
				`${mappingsDto.length} маппингов, ${totalDeps} зависимостей, ${entitiesDto.length} сущностей`,
		);

		return {
			desc: {
				change_date:
					allEntityDetails
						.get(entityFullName)
						?.entity_change_date?.toISOString() || new Date().toISOString(),
			},
			entities: entitiesDto,
			mappings: mappingsDto,
		};
	}

	private buildEntityDto(
		entity: any,
		attributes: any[],
		modified = false,
	): JsonExportResponseDto["entities"][0] {
		return {
			id: entity.full_name,
			modified,
			type: this.mapEntityTypeToJson(entity.entity_type_name ?? ""),
			namespace: entity.namespace || "default",
			name: entity.name,
			system_code: entity.system_code || "1642",
			system_name: entity.system_name,
			entity_change:
				entity.entity_change_date?.toISOString() ?? new Date().toISOString(),
			description: entity.description || undefined,
			container_description: entity.container_description || undefined,
			container_change:
				entity.container_change_date?.toISOString() ??
				entity.entity_change_date?.toISOString() ??
				new Date().toISOString(),
			attrSeq: (attributes ?? []).map((attr: any) => ({
				name: attr.name,
				type: this.normalizeAttributeType(attr.type_name ?? ""),
				comment: attr.description || undefined,
				attr_change:
					attr.attribute_change_date?.toISOString() ?? new Date().toISOString(),
			})),
		};
	}

	/**
	 * Получение последнего изменения
	 */
	private async getLatestChange(): Promise<ChangeEntity | null> {
		return await this.changeRepository.findOne({
			where: {},
			order: { change_date: "DESC" },
		});
	}

	/**
	 * Маппинг типа сущности
	 */
	private mapEntityTypeToJson(entityTypeName: string): string {
		const typeMapping: { [key: string]: string } = {
			TABLE_HIVE: "table",
			VIEW_HIVE: "view",
			JSON: "json",
			INPUT_VECTOR: "input_vector",
			UNRESOLVED: "unresolved",
			RDD: "rdd",
			TABLE: "table",
			VIEW: "view",
		};

		const normalizedType = entityTypeName?.toUpperCase() || "";
		return typeMapping[normalizedType] || "table";
	}

	/**
	 * Нормализация типа атрибута
	 */
	private normalizeAttributeType(typeName: string): string {
		if (!typeName) return "STRING";

		const type = typeName.toLowerCase();

		if (
			type.includes("timestamp") ||
			type.includes("date") ||
			type.includes("datetime")
		) {
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
		} else if (type.includes("bool")) {
			return "BOOLEAN";
		} else {
			return "STRING";
		}
	}
}
