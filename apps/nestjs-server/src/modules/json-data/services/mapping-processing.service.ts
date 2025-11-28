import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner } from 'typeorm';
import { EntityMapEntity } from '../entities/entity-map.entity';
import { AttributeMapEntity } from '../entities/attribute-map.entity';
import { AttributeMapSourceEntity } from '../entities/attribute-map-source.entity';
import { EntityAttributeMapEntity } from '../entities/entity-attribute-map.entity';
import { FailedMappingsEntity } from '../entities/failed-mappings.entity';
import { EntityEntity } from '../entities/entity.entity';
import { AttributeEntity } from '../entities/attribute.entity';
import { EntityMapSourceEntity } from '../entities/entity-map-source.entity';

@Injectable()
export class MappingProcessingService {
    private readonly logger = new Logger(MappingProcessingService.name);

    constructor(
        @InjectRepository(EntityMapEntity)
        private readonly entityMapRepository: Repository<EntityMapEntity>,
        @InjectRepository(AttributeMapEntity)
        private readonly attributeMapRepository: Repository<AttributeMapEntity>,
        @InjectRepository(AttributeMapSourceEntity)
        private readonly attributeMapSourceRepository: Repository<AttributeMapSourceEntity>,
        @InjectRepository(EntityAttributeMapEntity)
        private readonly entityAttributeMapRepository: Repository<EntityAttributeMapEntity>,
        @InjectRepository(FailedMappingsEntity)
        private readonly failedMappingsRepository: Repository<FailedMappingsEntity>,
        @InjectRepository(EntityEntity)
        private readonly entityRepository: Repository<EntityEntity>,
        @InjectRepository(AttributeEntity)
        private readonly attributeRepository: Repository<AttributeEntity>,
        @InjectRepository(EntityMapSourceEntity)
        private readonly entityMapSourceRepository: Repository<EntityMapSourceEntity>,
    ) {}

    async handleMappings(
        mappings: any[],
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<{ count: number }> {
        if (!mappings || !Array.isArray(mappings)) {
            return { count: 0 };
        }

        let processedCount = 0;

        for (const mapping of mappings) {
            try {
                await this.handleSingleMapping(mapping, processId, changeId, queryRunner);
                processedCount++;
            } catch (error) {
                this.logger.error(`Ошибка обработки маппинга: ${error.message}`, error.stack);
                // Сохраняем информацию о неудачном маппинге согласно документации
                await this.handleFailedMapping(mapping, error.message, changeId, queryRunner);
            }
        }

        return { count: processedCount };
    }

    private async handleSingleMapping(
        mapping: any,
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Находим entity_map для целевой сущности и процесса
        const entityMap = await this.findOrCreateEntityMap(mapping.entityId, processId, changeId, queryRunner);

        if (!entityMap) {
            throw new NotFoundException(
                `Entity_map не найден/создан для сущности: ${mapping.entityId} и процесса: ${processId}`,
            );
        }

        // Обработка зависимостей
        if (mapping.deps && Array.isArray(mapping.deps)) {
            for (const dep of mapping.deps) {
                await this.handleDependency(
                    dep,
                    entityMap.entity_map_id,
                    changeId,
                    queryRunner,
                );
            }
        }

        // Обработка entity_map_source для связи с источниками
        await this.handleEntityMapSources(mapping, entityMap.entity_map_id, changeId, queryRunner);
    }

    private async findOrCreateEntityMap(
        entityId: string,
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<EntityMapEntity | null> {
        // Находим сущность по full_name
        const entity = await this.entityRepository.findOne({
            where: { full_name: entityId },
        });

        if (!entity) {
            return null;
        }

        // Находим или создаем entity_map для этой сущности и процесса
        let entityMap = await this.entityMapRepository.findOne({
            where: {
                entity_id: entity.entity_id,
                process_id: processId,
            },
        });

        if (!entityMap) {
            this.logger.log(`Создание entity_map для ${entityId} и процесса ${processId}`);

            entityMap = new EntityMapEntity();
            entityMap.entity_id = entity.entity_id;
            entityMap.process_id = processId;
            entityMap.description = `Маппинг для ${entityId}`;
            entityMap.change_id = changeId;

            entityMap = await queryRunner.manager.save(EntityMapEntity, entityMap);
        } else {
            // Обновляем change_id существующего entity_map
            entityMap.change_id = changeId;
            entityMap = await queryRunner.manager.save(EntityMapEntity, entityMap);
        }

        return entityMap;
    }

    private async handleEntityMapSources(
        mapping: any,
        entityMapId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (!mapping.deps || !Array.isArray(mapping.deps)) {
            return;
        }

        for (const dep of mapping.deps) {
            const sourceEntity = await this.entityRepository.findOne({
                where: { full_name: dep.entityId },
            });

            if (sourceEntity) {
                await this.createEntityMapSource(
                    entityMapId,
                    sourceEntity.entity_id,
                    changeId,
                    queryRunner,
                );
            }
        }
    }

    private async createEntityMapSource(
        entityMapId: number,
        sourceEntityId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        const existingSource = await this.entityMapSourceRepository.findOne({
            where: {
                entity_map_id: entityMapId,
                source_entity_id: sourceEntityId,
            },
        });

        if (!existingSource) {
            const entityMapSource = new EntityMapSourceEntity();
            entityMapSource.entity_map_id = entityMapId;
            entityMapSource.source_entity_id = sourceEntityId;
            entityMapSource.change_id = changeId;

            await queryRunner.manager.save(EntityMapSourceEntity, entityMapSource);
        }
    }

    private async handleDependency(
        dep: any,
        entityMapId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Поиск source сущности
        const sourceEntity = await this.entityRepository.findOne({
            where: { full_name: dep.entityId },
        });

        if (!sourceEntity) {
            throw new NotFoundException(
                `Source сущность не найдена: ${dep.entityId}`,
            );
        }

        // Обработка attrMaps
        if (dep.attrMaps && Array.isArray(dep.attrMaps)) {
            for (const attrMap of dep.attrMaps) {
                await this.handleAttrMap(
                    attrMap,
                    entityMapId,
                    sourceEntity.entity_id,
                    changeId,
                    queryRunner,
                );
            }
        }

        // Обработка attrDeps
        if (dep.atrDeps && Array.isArray(dep.atrDeps)) {
            for (const attrDep of dep.atrDeps) {
                await this.handleAttrDep(
                    attrDep,
                    entityMapId,
                    sourceEntity.entity_id,
                    changeId,
                    queryRunner,
                );
            }
        }
    }

    private async handleAttrMap(
        attrMap: any,
        entityMapId: number,
        sourceEntityId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Поиск source атрибута
        const sourceAttribute = await this.attributeRepository.findOne({
            where: {
                entity_id: sourceEntityId,
                name: attrMap.src,
            },
        });

        if (!sourceAttribute) {
            throw new NotFoundException(
                `Source атрибут не найден: ${attrMap.src} в сущности ${sourceEntityId}`,
            );
        }

        // Находим target entity из entity_map
        const entityMap = await this.entityMapRepository.findOne({
            where: { entity_map_id: entityMapId },
        });

        if (!entityMap) {
            throw new NotFoundException(`Entity_map не найден: ${entityMapId}`);
        }

        // Поиск target атрибута
        const targetAttribute = await this.attributeRepository.findOne({
            where: {
                entity_id: entityMap.entity_id,
                name: attrMap.dst,
            },
        });

        if (!targetAttribute) {
            throw new NotFoundException(
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
        let attributeMap = await this.attributeMapRepository.findOne({
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

            attributeMap = await queryRunner.manager.save(AttributeMapEntity, attributeMap);
        } else {
            attributeMap.change_id = changeId;
            attributeMap = await queryRunner.manager.save(AttributeMapEntity, attributeMap);
        }

        return attributeMap;
    }

    private async createOrUpdateAttributeMapSource(
        attributeMapId: number,
        sourceAttributeId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<AttributeMapSourceEntity> {
        const existingSource = await this.attributeMapSourceRepository.findOne({
            where: {
                attribute_map_id: attributeMapId,
                source_attribute_id: sourceAttributeId,
            },
        });

        if (!existingSource) {
            const attributeMapSource = new AttributeMapSourceEntity();
            attributeMapSource.attribute_map_id = attributeMapId;
            attributeMapSource.source_attribute_id = sourceAttributeId;
            attributeMapSource.change_id = changeId;

            return await queryRunner.manager.save(AttributeMapSourceEntity, attributeMapSource);
        } else {
            existingSource.change_id = changeId;
            return await queryRunner.manager.save(AttributeMapSourceEntity, existingSource);
        }
    }

    private async handleAttrDep(
        attrDep: any,
        entityMapId: number,
        sourceEntityId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Поиск source атрибута
        const sourceAttribute = await this.attributeRepository.findOne({
            where: {
                entity_id: sourceEntityId,
                name: attrDep.attr,
            },
        });

        if (!sourceAttribute) {
            throw new NotFoundException(
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
        const existingMap = await this.entityAttributeMapRepository.findOne({
            where: {
                entity_map_id: entityMapId,
                source_attribute_id: sourceAttributeId,
                deptype_id: deptypeId,
            },
        });

        if (!existingMap) {
            const entityAttributeMap = new EntityAttributeMapEntity();
            entityAttributeMap.entity_map_id = entityMapId;
            entityAttributeMap.source_attribute_id = sourceAttributeId;
            entityAttributeMap.deptype_id = deptypeId;
            entityAttributeMap.change_id = changeId;

            return await queryRunner.manager.save(EntityAttributeMapEntity, entityAttributeMap);
        } else {
            existingMap.change_id = changeId;
            return await queryRunner.manager.save(EntityAttributeMapEntity, existingMap);
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
        failedMapping.entity_name = mapping.entityId || 'Unknown';
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
            await this.handleSingleFailedMapping(failedMapping, changeId, queryRunner);
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
        failedMappingsEntity.entity_name = failedMapping.entityName || failedMapping.entityId;
        failedMappingsEntity.error_description = failedMapping.errorDescription || failedMapping.error;
        failedMappingsEntity.unmatched_entities = JSON.stringify(
            failedMapping.unmatchedEntities || failedMapping.unmatched || [],
        );

        await queryRunner.manager.save(FailedMappingsEntity, failedMappingsEntity);
    }
}