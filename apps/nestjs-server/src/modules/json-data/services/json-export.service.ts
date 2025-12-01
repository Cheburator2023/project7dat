import { Injectable, Logger } from "@nestjs/common";
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

            // Преобразуем данные в структуру JSON
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

    private async getEntitiesWithDetails(): Promise<EntityWithDetails[]> {
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
            ORDER BY e.full_name
        `;

        const entities = await this.dataSource.query(query);

        // Загружаем атрибуты для каждой сущности
        for (const entity of entities) {
            entity.attributes = await this.getAttributesForEntity(entity.entity_id);
        }

        return entities;
    }

    private async getAttributesForEntity(entityId: number): Promise<any[]> {
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

    private async getMappingsWithDetails(): Promise<MappingWithDetails[]> {
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
            ORDER BY e_target.full_name
        `;

        const entityMaps = await this.dataSource.query(entityMapsQuery);

        // Для каждого entity_map получаем зависимости
        for (const entityMap of entityMaps) {
            entityMap.dependencies = await this.getDependenciesForEntityMap(entityMap.entity_map_id);
        }

        return entityMaps;
    }

    private async getDependenciesForEntityMap(entityMapId: number): Promise<MappingWithDetails['dependencies']> {
        // Получаем source entities через entity_map_source
        const sourceEntitiesQuery = `
            SELECT DISTINCT
                ems.source_entity_id,
                e_source.name as source_entity_name,
                e_source.full_name as source_full_name
            FROM entity_map_source ems
                     INNER JOIN entity e_source ON ems.source_entity_id = e_source.entity_id
            WHERE ems.entity_map_id = $1
        `;

        const sourceEntities = await this.dataSource.query(sourceEntitiesQuery, [entityMapId]);

        // Для каждого source entity получаем attrMaps и attrDeps
        for (const sourceEntity of sourceEntities) {
            sourceEntity.attr_maps = await this.getAttributeMapsForDependency(entityMapId, sourceEntity.source_entity_id);
            sourceEntity.attr_deps = await this.getAttributeDepsForDependency(entityMapId, sourceEntity.source_entity_id);
        }

        return sourceEntities;
    }

    private async getAttributeMapsForDependency(entityMapId: number, sourceEntityId: number): Promise<any[]> {
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
            )
        `;

        return await this.dataSource.query(query, [entityMapId, sourceEntityId]);
    }

    private async getAttributeDepsForDependency(entityMapId: number, sourceEntityId: number): Promise<AttributeDepGrouped[]> {
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
              AND a.entity_id = $2
        `;

        const attrDeps: AttributeDepRaw[] = await this.dataSource.query(query, [entityMapId, sourceEntityId]);

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
                    type: attr.type_name.toUpperCase(),
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
            }))
        }));
    }

    private mapEntityTypeToJson(entityTypeName: string): string {
        const typeMapping: { [key: string]: string } = {
            'TABLE_HIVE': 'table',
            'VIEW_HIVE': 'view',
            'JSON': 'json',
            'INPUT_VECTOR': 'input_vector'
        };

        return typeMapping[entityTypeName] || 'table';
    }

    async exportByChangeId(changeId: number): Promise<JsonExportResponseDto> {
        this.logger.log(`Экспорт данных по change_id: ${changeId}`);

        // TO.DO. Реализовать логику экспорта данных на определенный момент времени на основе change_id

        throw new Error("Метод exportByChangeId еще не реализован");
    }
}