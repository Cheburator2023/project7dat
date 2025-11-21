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

        for (const mapping of mappings) {
            await this.handleSingleMapping(mapping, processId, changeId, queryRunner);
        }

        return { count: mappings.length };
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

    private async handleSingleMapping(
        mapping: any,
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Поиск таргет сущности
        const targetEntity = await this.entityRepository.findOne({
            where: { full_name: mapping.entityId },
        });

        if (!targetEntity) {
            throw new NotFoundException(
                `Таргет сущность не найдена: ${mapping.entityId}`,
            );
        }

        // Создание entity_map
        const entityMap = new EntityMapEntity();
        entityMap.entity_id = targetEntity.entity_id;
        entityMap.process_id = processId;
        entityMap.description = mapping.entityId;
        entityMap.change_id = changeId;

        const savedEntityMap = await queryRunner.manager.save(
            EntityMapEntity,
            entityMap,
        );

        // Обработка зависимостей
        if (mapping.deps && Array.isArray(mapping.deps)) {
            for (const dep of mapping.deps) {
                await this.handleDependency(
                    dep,
                    savedEntityMap.entity_map_id,
                    targetEntity.entity_id,
                    changeId,
                    queryRunner,
                );
            }
        }
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

    private async handleDependency(
        dep: any,
        entityMapId: number,
        targetEntityId: number,
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
                    targetEntityId,
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
        targetEntityId: number,
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

        // Поиск target атрибута и создание attribute_map
        const targetAttribute = await this.attributeRepository.findOne({
            where: {
                entity_id: targetEntityId,
                name: attrMap.dst,
            },
        });

        if (!targetAttribute) {
            throw new NotFoundException(
                `Target атрибут не найден: ${attrMap.dst} в сущности ${targetEntityId}`,
            );
        }

        // Создание attribute_map
        const attributeMap = new AttributeMapEntity();
        attributeMap.entity_map_id = entityMapId;
        attributeMap.attribute_id = targetAttribute.attribute_id;
        attributeMap.change_id = changeId;

        const savedAttributeMap = await queryRunner.manager.save(
            AttributeMapEntity,
            attributeMap,
        );

        // Создание attribute_map_source
        const attributeMapSource = new AttributeMapSourceEntity();
        attributeMapSource.attribute_map_id = savedAttributeMap.attribute_map_id;
        attributeMapSource.source_attribute_id = sourceAttribute.attribute_id;
        attributeMapSource.change_id = changeId;

        await queryRunner.manager.save(
            AttributeMapSourceEntity,
            attributeMapSource,
        );
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
                const entityAttributeMap = new EntityAttributeMapEntity();
                entityAttributeMap.entity_map_id = entityMapId;
                entityAttributeMap.source_attribute_id = sourceAttribute.attribute_id;
                entityAttributeMap.deptype_id = linkType;
                entityAttributeMap.change_id = changeId;

                await queryRunner.manager.save(
                    EntityAttributeMapEntity,
                    entityAttributeMap,
                );
            }
        }
    }
}