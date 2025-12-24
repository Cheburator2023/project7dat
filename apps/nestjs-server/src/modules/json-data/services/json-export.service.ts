import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { JsonExportResponseDto } from "../dto";
import { ChangeEntity } from "../entities/change.entity";

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
        attr_maps: Array<{
            attribute_map_id: number;
            target_attribute_id: number;
            target_attribute_name: string;
            source_attribute_id: number;
            source_attribute_name: string;
            relation_change_date: Date;
        }>;
        attr_deps: AttributeDepGrouped[];
    }>;
    change_id: number;
    unmatched?: string;
}

@Injectable()
export class JsonExportService {
    private readonly logger = new Logger(JsonExportService.name);

    constructor(
        @InjectRepository(ChangeEntity)
        private readonly changeRepository: Repository<ChangeEntity>,
        private readonly dataSource: DataSource,
    ) {}

    async exportToJson(): Promise<JsonExportResponseDto> {
        this.logger.log("Начало экспорта данных РБД в JSON DL");

        try {
            // Получаем последнюю дату изменений для desc.change_date
            const latestChange = await this.getLatestChange();

            // Получаем все сущности с деталями
            const entitiesWithDetails = await this.getEntitiesWithDetails();

            // Получаем все маппинги с деталями
            const mappingsWithDetails = await this.getMappingsWithDetails();

            // Преобразуем данные в структуру JSON согласно документации
            const entities = this.transformEntities(entitiesWithDetails, mappingsWithDetails);
            const mappings = this.transformMappings(mappingsWithDetails);

            const result: JsonExportResponseDto = {
                desc: {
                    change_date: latestChange?.change_date.toISOString() || new Date().toISOString(),
                },
                entities,
                mappings,
            };

            this.logger.log(`Экспорт завершен: ${entities.length} сущностей, ${mappings.length} маппингов`);
            return result;
        } catch (error) {
            this.logger.error(`Ошибка экспорта: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async getLatestChange(): Promise<ChangeEntity | null> {
        return await this.changeRepository.findOne({
            where: {},
            order: { change_date: "DESC" },
        });
    }

    private async getEntitiesWithDetails(changeId?: number): Promise<EntityWithDetails[]> {
        let dateFilter = "";
        let params: any[] = [];

        if (changeId) {
            // Получаем дату изменения для указанного change_id
            const change = await this.changeRepository.findOne({ where: { change_id: changeId } });
            if (!change) {
                throw new NotFoundException(`Change с ID ${changeId} не найден`);
            }
            dateFilter = `
                AND e.change_id IN (
                    SELECT MAX(e2.change_id) 
                    FROM entity e2 
                    WHERE e2.full_name = e.full_name 
                    AND e2.change_id <= ?
                    GROUP BY e2.full_name
                )
                AND (ec.change_id IS NULL OR ec.change_id <= ?)
                AND a.change_id <= ?
            `;
            params = [changeId, changeId, changeId];
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
                c_entity.change_date as entity_change_date,
                c_container.change_date as container_change_date
            FROM entity e
                     LEFT JOIN entity_type et ON e.entity_type_id = et.entity_type_id
                     LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
                     LEFT JOIN changes c_entity ON e.change_id = c_entity.change_id
                     LEFT JOIN changes c_container ON ec.change_id = c_container.change_id
            WHERE 1=1 ${dateFilter}
            ORDER BY e.full_name
        `;

        const entities = await this.dataSource.query(query, params);

        // Загружаем атрибуты для каждой сущности
        for (const entity of entities) {
            entity.attributes = await this.getAttributesForEntity(entity.entity_id, changeId);
        }

        return entities;
    }

    private async getAttributesForEntity(entityId: number, changeId?: number): Promise<any[]> {
        let dateFilter = "";
        let params: any[] = [entityId];

        if (changeId) {
            dateFilter = " AND a.change_id <= ?";
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

    private async getMappingsWithDetails(changeId?: number): Promise<MappingWithDetails[]> {
        let dateFilter = "";
        let params: any[] = [];

        if (changeId) {
            dateFilter = `
            AND em.change_id IN (
                SELECT MAX(em2.change_id) 
                FROM entity_map em2 
                WHERE em2.entity_id = em.entity_id 
                AND em2.process_id = em.process_id
                AND em2.change_id <= ?
                GROUP BY em2.entity_id, em2.process_id
            )
            AND (p.change_id IS NULL OR p.change_id <= ?)
        `;
            params = [changeId, changeId];
        }

        // Получаем основные данные entity_map
        const entityMapsQuery = `
            SELECT
                em.entity_map_id,
                em.entity_id as target_entity_id,
                em.process_id,
                em.description as entity_map_description,
                em.change_id,
                e_target.name as target_entity_name,
                e_target.full_name as target_full_name,
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

        // Для каждого entity_map получаем зависимости и неудачные маппинги
        for (const entityMap of entityMaps) {
            entityMap.dependencies = await this.getDependenciesForEntityMap(entityMap.entity_map_id, changeId);

            // Получаем информацию о неудачных маппингах по имени сущности
            entityMap.unmatched = await this.getUnmatchedEntities(entityMap.target_entity_name, changeId);
        }

        return entityMaps;
    }

    private async getDependenciesForEntityMap(entityMapId: number, changeId?: number): Promise<MappingWithDetails['dependencies']> {
        let dateFilter = "";
        let params: any[] = [entityMapId];

        if (changeId) {
            dateFilter = " AND ems.change_id IN (SELECT MAX(ems2.change_id) FROM entity_map_source ems2 WHERE ems2.entity_map_id = ems.entity_map_id AND ems2.source_entity_id = ems.source_entity_id AND ems2.change_id <= ? GROUP BY ems2.entity_map_id, ems2.source_entity_id)";
            params.push(changeId);
        }

        const sourceEntitiesQuery = `
            SELECT DISTINCT
                ems.source_entity_id,
                e_source.name as source_entity_name,
                e_source.full_name as source_full_name
            FROM entity_map_source ems
                     INNER JOIN entity e_source ON ems.source_entity_id = e_source.entity_id
            WHERE ems.entity_map_id = $1 ${dateFilter}
        `;

        const sourceEntities = await this.dataSource.query(sourceEntitiesQuery, params);

        // Для каждого source entity получаем attrMaps и attrDeps
        for (const sourceEntity of sourceEntities) {
            sourceEntity.attr_maps = await this.getAttributeMapsForDependency(entityMapId, sourceEntity.source_entity_id, changeId);
            sourceEntity.attr_deps = await this.getAttributeDepsForDependency(entityMapId, sourceEntity.source_entity_id, changeId);
        }

        return sourceEntities;
    }

    private async getAttributeMapsForDependency(entityMapId: number, sourceEntityId: number, changeId?: number): Promise<any[]> {
        let dateFilter = "";
        let params: any[] = [entityMapId, sourceEntityId];

        if (changeId) {
            dateFilter = `
            AND am.change_id IN (
                SELECT MAX(am2.change_id) 
                FROM attribute_map am2 
                WHERE am2.entity_map_id = am.entity_map_id 
                AND am2.attribute_id = am.attribute_id
                AND am2.change_id <= ?
                GROUP BY am2.entity_map_id, am2.attribute_id
            )
            AND ams.change_id IN (
                SELECT MAX(ams2.change_id) 
                FROM attribute_map_source ams2 
                WHERE ams2.attribute_map_id = ams.attribute_map_id 
                AND ams2.source_attribute_id = ams.source_attribute_id
                AND ams2.change_id <= ?
                GROUP BY ams2.attribute_map_id, ams2.source_attribute_id
            )
        `;
            params.push(changeId, changeId);
        }

        const query = `
            SELECT
                am.attribute_map_id,
                am.attribute_id as target_attribute_id,
                a_target.name as target_attribute_name,
                ams.source_attribute_id,
                a_source.name as source_attribute_name,
                c_am.change_date as relation_change_date
            FROM attribute_map am
                     INNER JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
                     INNER JOIN attribute a_target ON am.attribute_id = a_target.attribute_id
                     INNER JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
                     LEFT JOIN changes c_am ON am.change_id = c_am.change_id
            WHERE am.entity_map_id = $1
              AND a_source.entity_id = $2
              AND a_target.entity_id IN (
                SELECT entity_id FROM entity_map WHERE entity_map_id = $1
            ) ${dateFilter}
        `;

        return await this.dataSource.query(query, params);
    }

    private async getAttributeDepsForDependency(entityMapId: number, sourceEntityId: number, changeId?: number): Promise<AttributeDepGrouped[]> {
        let dateFilter = "";
        let params: any[] = [entityMapId, sourceEntityId];

        if (changeId) {
            dateFilter = `
            AND eam.change_id IN (
                SELECT MAX(eam2.change_id) 
                FROM entity_attribute_map eam2 
                WHERE eam2.entity_map_id = eam.entity_map_id 
                AND eam2.source_attribute_id = eam.source_attribute_id
                AND eam2.deptype_id = eam.deptype_id
                AND eam2.change_id <= ?
                GROUP BY eam2.entity_map_id, eam2.source_attribute_id, eam2.deptype_id
            )
        `;
            params.push(changeId);
        }

        const query = `
            SELECT
                eam.source_attribute_id,
                a.name as source_attribute_name,
                eam.deptype_id,
                c_eam.change_date as relation_change_date
            FROM entity_attribute_map eam
                     INNER JOIN attribute a ON eam.source_attribute_id = a.attribute_id
                     LEFT JOIN changes c_eam ON eam.change_id = c_eam.change_id
            WHERE eam.entity_map_id = $1
              AND a.entity_id = $2 ${dateFilter}
        `;

        const attrDeps: AttributeDepRaw[] = await this.dataSource.query(query, params);

        // Группируем по source_attribute_id для объединения linkTypes
        const groupedDeps = new Map<number, AttributeDepGrouped>();

        for (const dep of attrDeps) {
            if (!groupedDeps.has(dep.source_attribute_id)) {
                groupedDeps.set(dep.source_attribute_id, {
                    source_attribute_id: dep.source_attribute_id,
                    source_attribute_name: dep.source_attribute_name,
                    linkTypes: [dep.deptype_id],
                    relation_change_date: dep.relation_change_date
                });
            } else {
                // Добавляем deptype_id в существующий массив linkTypes
                const existing = groupedDeps.get(dep.source_attribute_id)!;
                if (!existing.linkTypes.includes(dep.deptype_id)) {
                    existing.linkTypes.push(dep.deptype_id);
                }
                // Обновляем дату изменения на самую позднюю
                if (dep.relation_change_date > existing.relation_change_date) {
                    existing.relation_change_date = dep.relation_change_date;
                }
            }
        }

        return Array.from(groupedDeps.values());
    }

    private async getUnmatchedEntities(entityName: string, changeId?: number): Promise<string> {
        let dateFilter = "";
        let params: any[] = [entityName];

        if (changeId) {
            dateFilter = " AND fm.change_id <= ?";
            params.push(changeId);
        }

        const query = `
            SELECT fm.unmatched_entities
            FROM failed_mappings fm
            WHERE fm.entity_name = $1 ${dateFilter}
            ORDER BY fm.change_date DESC
                LIMIT 1
        `;

        const result = await this.dataSource.query(query, params);
        return result.length > 0 ? result[0].unmatched_entities : "";
    }

    private transformEntities(
        entitiesWithDetails: EntityWithDetails[],
        mappingsWithDetails: MappingWithDetails[]
    ): JsonExportResponseDto['entities'] {
        // Собираем Set entity_id, которые являются целевыми (присутствуют в entity_map)
        const targetEntityIds = new Set<number>();
        mappingsWithDetails.forEach(mapping => {
            targetEntityIds.add(mapping.target_entity_id);
        });

        return entitiesWithDetails.map(entity => {
            const entityType = this.mapEntityTypeToJson(entity.entity_type_name);

            return {
                id: entity.full_name,
                modified: targetEntityIds.has(entity.entity_id),
                type: entityType,
                namespace: entity.container_value || 'default',
                name: entity.name,
                entity_change: entity.entity_change_date.toISOString(),
                description: entity.description || undefined,
                container_description: entity.container_description || undefined,
                container_change: entity.container_change_date?.toISOString() || entity.entity_change_date.toISOString(),
                attrSeq: entity.attributes.map(attr => ({
                    name: attr.name,
                    type: this.normalizeAttributeType(attr.type_name),
                    comment: attr.description || undefined,
                    attr_change: attr.attribute_change_date.toISOString()
                }))
            };
        });
    }

    private transformMappings(mappingsWithDetails: MappingWithDetails[]): JsonExportResponseDto['mappings'] {
        return mappingsWithDetails.map(mapping => ({
            entityId: mapping.target_entity_name,
            process: mapping.process_name || undefined,
            process_description: mapping.process_description || undefined,
            process_change: mapping.process_change_date?.toISOString() || undefined,
            description: mapping.entity_map_description || undefined,
            relation_change: mapping.relation_change_date.toISOString(),
            deps: mapping.dependencies.map(dep => ({
                entityId: dep.source_entity_name,
                attrMaps: dep.attr_maps.map(attrMap => ({
                    src: attrMap.source_attribute_name,
                    dst: attrMap.target_attribute_name,
                    relation_change: attrMap.relation_change_date.toISOString()
                })),
                atrDeps: dep.attr_deps.map(attrDep => ({
                    attr: attrDep.source_attribute_name,
                    linkTypes: attrDep.linkTypes,
                    relation_change: attrDep.relation_change_date.toISOString()
                }))
            })),
            unmatched: mapping.unmatched || undefined
        }));
    }

    private mapEntityTypeToJson(entityTypeName: string): string {
        const typeMapping: { [key: string]: string } = {
            'TABLE_HIVE': 'table',
            'VIEW_HIVE': 'view',
            'JSON': 'json',
            'INPUT_VECTOR': 'input_vector',
            'UNRESOLVED': 'unresolved',
            'RDD': 'rdd'
        };

        return typeMapping[entityTypeName] || 'table';
    }

    private normalizeAttributeType(typeName: string): string {
        const type = typeName.toLowerCase();

        if (type.includes('timestamp') || type.includes('date')) {
            return 'TIMESTAMP';
        } else if (type.includes('decimal') || type.includes('numeric') || type.includes('float') || type.includes('double')) {
            return 'DECIMAL';
        } else if (type.includes('int') || type.includes('integer')) {
            return 'INTEGER';
        } else {
            return 'STRING';
        }
    }

    async exportByChangeId(changeId: number): Promise<JsonExportResponseDto> {
        this.logger.log(`Экспорт данных по change_id: ${changeId}`);

        try {
            // Проверяем существование change_id
            const change = await this.changeRepository.findOne({
                where: { change_id: changeId }
            });

            if (!change) {
                throw new NotFoundException(`Change с ID ${changeId} не найден`);
            }

            // Получаем сущности на момент указанного change_id
            const entitiesWithDetails = await this.getEntitiesWithDetails(changeId);

            // Получаем маппинги на момент указанного change_id
            const mappingsWithDetails = await this.getMappingsWithDetails(changeId);

            // Преобразуем данные в структуру JSON
            const entities = this.transformEntities(entitiesWithDetails, mappingsWithDetails);
            const mappings = this.transformMappings(mappingsWithDetails);

            const result: JsonExportResponseDto = {
                desc: {
                    change_date: change.change_date.toISOString(),
                },
                entities,
                mappings,
            };

            this.logger.log(`Экспорт по change_id ${changeId} завершен: ${entities.length} сущностей, ${mappings.length} маппингов`);
            return result;
        } catch (error) {
            this.logger.error(`Ошибка экспорта по change_id ${changeId}: ${error.message}`, error.stack);
            throw error;
        }
    }
}