import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner } from 'typeorm';
import { EntityEntity } from '../entities/entity.entity';
import { AttributeEntity } from '../entities/attribute.entity';
import { EntityMapEntity } from '../entities/entity-map.entity';
import { EntityTypeService } from './entity-type.service';
import { AttributeTypeService } from './attribute-type.service';
import { EntityContainerEntity } from '../entities/entity-container.entity';

@Injectable()
export class EntityProcessingService {
    private readonly logger = new Logger(EntityProcessingService.name);

    constructor(
        @InjectRepository(EntityEntity)
        private readonly entityRepository: Repository<EntityEntity>,
        @InjectRepository(AttributeEntity)
        private readonly attributeRepository: Repository<AttributeEntity>,
        @InjectRepository(EntityMapEntity)
        private readonly entityMapRepository: Repository<EntityMapEntity>,
        @InjectRepository(EntityContainerEntity)
        private readonly entityContainerRepository: Repository<EntityContainerEntity>,
        private readonly entityTypeService: EntityTypeService,
        private readonly attributeTypeService: AttributeTypeService,
    ) {}

    async handleEntities(
        entities: any[],
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<{ count: number; attributesCount: number }> {
        if (!entities || !Array.isArray(entities)) {
            return { count: 0, attributesCount: 0 };
        }

        let attributesCount = 0;

        // Обрабатываем все сущности
        for (const entityData of entities) {
            const entityAttributesCount = await this.handleSingleEntity(
                entityData,
                changeId,
                queryRunner,
            );
            attributesCount += entityAttributesCount;
        }

        // Создаем entity_map для целевых сущностей (modified = true)
        await this.handleEntityMappings(entities, processId, changeId, queryRunner);

        return {
            count: entities.length,
            attributesCount,
        };
    }

    private async handleSingleEntity(
        entityData: any,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<number> {
        try {
        // Валидация типа сущности
        const isValidType = await this.entityTypeService.validateEntityType(
            entityData.type,
        );
        if (!isValidType) {
            this.logger.warn(
                `Неизвестный тип сущности: ${entityData.type} для ${entityData.id}`,
            );
        }

            // Получаем entity_type_id
            const entityTypeId = await this.entityTypeService.mapJsonTypeToEntityType(entityData.type);

            // Обработка entity_container
            const entityContainerId = await this.resolveEntityContainer(
                entityData,
                changeId,
                queryRunner,
            );

            // Поиск существующей сущности по full_name (уникальное поле)
            let entity = await queryRunner.manager.findOne(EntityEntity, {
                where: { full_name: entityData.id },
            });

            if (!entity) {
                this.logger.log(`Создание новой сущности: ${entityData.id}`);

                // Создание новой сущности
                entity = new EntityEntity();
                entity.full_name = entityData.id;
                entity.name = entityData.name;
                entity.entity_type_id = entityTypeId;
                entity.entity_container_id = entityContainerId;
                entity.change_id = changeId;
                entity.description = entityData.description || null;

                entity = await queryRunner.manager.save(EntityEntity, entity);
            } else {
                this.logger.log(`Обновление существующей сущности: ${entityData.id}`);
                // Для существующей сущности обновляем change_id и entity_container_id
                entity.change_id = changeId;
                entity.entity_container_id = entityContainerId;
                entity.description = entityData.description || entity.description;
                entity = await queryRunner.manager.save(EntityEntity, entity);
            }

        // Обработка атрибутов
        let attributesCount = 0;
        if (entityData.attrSeq && Array.isArray(entityData.attrSeq)) {
            for (const attrData of entityData.attrSeq) {
                await this.handleAttribute(
                    attrData,
                    entity.entity_id,
                    changeId,
                    queryRunner,
                );
                attributesCount++;
            }
        }

            return attributesCount;
        } catch (error) {
            this.logger.error(`Ошибка обработки сущности ${entityData.id}: ${error.message}`);
            throw error;
        }
    }

    private async resolveEntityContainer(
        entityData: any,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<number | null> {
        if (!entityData.namespace) {
            return null;
        }

        try {
            // Поиск существующего контейнера
            let container = await queryRunner.manager.findOne(EntityContainerEntity, {
                where: { value: entityData.namespace },
            });

            if (!container) {
                this.logger.log(`Создание нового контейнера: ${entityData.namespace}`);

                // Создание нового контейнера
                container = new EntityContainerEntity();
                container.change_id = changeId;
                container.entity_container_type_id = await this.determineContainerType(entityData.type);
                container.value = entityData.namespace;
                container.description = entityData.container_description || `Контейнер для ${entityData.namespace}`;

                // Определение system_id если доступно
                if (entityData.system_id) {
                    container.system_id = entityData.system_id;
                }

                container = await queryRunner.manager.save(EntityContainerEntity, container);
            }

            return container.entity_container_id;
        } catch (error) {
            this.logger.error(`Ошибка разрешения контейнера: ${error.message}`);
            return null;
        }
    }

    private async determineContainerType(entityType: string): Promise<number> {
        const typeMapping: { [key: string]: number } = {
            'table': 1, // DB_HIVE
            'view': 1,  // DB_HIVE
            'json': 2,  // MODEL
            'input_vector': 2, // MODEL
            'unresolved': 1, // DAPP
            'rdd': 1,       // DAPP
        };
        return typeMapping[entityType] || 1;
    }

    private async handleEntityMappings(
        entities: any[],
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Находим целевые сущности (modified = true)
        const targetEntities = entities.filter(entity => entity.modified === true);

        for (const targetEntity of targetEntities) {
            await this.createEntityMap(targetEntity, processId, changeId, queryRunner);
        }
    }

    private async createEntityMap(
        entityData: any,
        processId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        try {
            const entity = await queryRunner.manager.findOne(EntityEntity, {
                where: { full_name: entityData.id },
            });

            if (!entity) {
                this.logger.warn(`Сущность не найдена для создания entity_map: ${entityData.id}`);
                return;
            }

            // Проверяем, существует ли уже entity_map для этой сущности и процесса
            const existingEntityMap = await queryRunner.manager.findOne(EntityMapEntity, {
                where: {
                    entity_id: entity.entity_id,
                    process_id: processId,
                },
            });

            if (!existingEntityMap) {
                this.logger.log(`Создание entity_map для сущности: ${entityData.id}`);

                const entityMap = new EntityMapEntity();
                entityMap.entity_id = entity.entity_id;
                entityMap.process_id = processId;
                entityMap.description = entityData.description || `Маппинг для ${entityData.id}`;
                entityMap.change_id = changeId;

                await queryRunner.manager.save(EntityMapEntity, entityMap);
            } else {
                this.logger.log(`Entity_map уже существует для сущности: ${entityData.id}`);
                // Обновляем change_id существующего entity_map
                existingEntityMap.change_id = changeId;
                existingEntityMap.description = entityData.description || existingEntityMap.description;
                await queryRunner.manager.save(EntityMapEntity, existingEntityMap);
            }
        } catch (error) {
            this.logger.error(`Ошибка создания entity_map для ${entityData.id}: ${error.message}`);
            throw error;
        }
    }

    private async handleAttribute(
        attrData: any,
        entityId: number,
        changeId: number,
        queryRunner: QueryRunner,
    ): Promise<void> {
        try {
            // Валидация типа атрибута согласно документации
            const typeId = await this.attributeTypeService.resolveAttributeTypeFromJson(
                attrData.type,
            );

            // Поиск существующего атрибута
            const existingAttribute = await queryRunner.manager.findOne(AttributeEntity, {
                where: {
                    entity_id: entityId,
                    name: attrData.name,
                },
            });

        if (!existingAttribute) {
            this.logger.log(
                `Создание нового атрибута: ${attrData.name} для сущности ${entityId}`,
            );

                // Создание нового атрибута
                const attribute = new AttributeEntity();
                attribute.entity_id = entityId;
                attribute.name = attrData.name;
                attribute.type_id = typeId;
                attribute.description = attrData.comment || attrData.description || null;
                attribute.change_id = changeId;

                await queryRunner.manager.save(AttributeEntity, attribute);
            } else {
                this.logger.log(
                    `Атрибут уже существует: ${attrData.name} для сущности ${entityId}`,
                );
                // Обновляем существующий атрибут
                existingAttribute.type_id = typeId;
                existingAttribute.description = attrData.comment || attrData.description || existingAttribute.description;
                existingAttribute.change_id = changeId;
                await queryRunner.manager.save(AttributeEntity, existingAttribute);
            }
        } catch (error) {
            this.logger.error(`Ошибка обработки атрибута ${attrData.name}: ${error.message}`);
            throw error;
        }
    }
}
