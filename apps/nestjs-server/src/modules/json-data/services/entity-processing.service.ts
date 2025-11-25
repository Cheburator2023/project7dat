import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner } from "typeorm";
import { EntityEntity } from "../entities/entity.entity";
import { AttributeEntity } from "../entities/attribute.entity";
import { EntityTypeService } from "./entity-type.service";
import { EntityContainerService } from "./entity-container.service";
import { AttributeTypeService } from "./attribute-type.service";

@Injectable()
export class EntityProcessingService {
	private readonly logger = new Logger(EntityProcessingService.name);

	constructor(
		@InjectRepository(EntityEntity)
		private readonly entityRepository: Repository<EntityEntity>,
		@InjectRepository(AttributeEntity)
		private readonly attributeRepository: Repository<AttributeEntity>,
		private readonly entityTypeService: EntityTypeService,
		private readonly entityContainerService: EntityContainerService,
		private readonly attributeTypeService: AttributeTypeService,
	) {}

	async handleEntities(
		entities: any[],
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<{ count: number; attributesCount: number }> {
		if (!entities || !Array.isArray(entities)) {
			return { count: 0, attributesCount: 0 };
		}

		let attributesCount = 0;

		for (const entityData of entities) {
			const entityAttributesCount = await this.handleSingleEntity(
				entityData,
				changeId,
				queryRunner,
			);
			attributesCount += entityAttributesCount;
		}

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
		// Валидация типа сущности
		const isValidType = await this.entityTypeService.validateEntityType(
			entityData.type,
		);
		if (!isValidType) {
			this.logger.warn(
				`Неизвестный тип сущности: ${entityData.type} для ${entityData.id}`,
			);
		}

		// Поиск существующей сущности
		let entity = await this.entityRepository.findOne({
			where: { full_name: entityData.id },
		});

		if (!entity) {
			this.logger.log(`Создание новой сущности: ${entityData.id}`);

			// Создание новой сущности
			entity = new EntityEntity();
			entity.full_name = entityData.id;
			entity.name = entityData.name;
			entity.entity_type_id =
				await this.entityTypeService.mapJsonTypeToEntityType(entityData.type);
			entity.entity_container_id =
				await this.entityContainerService.resolveEntityContainer(
					entityData.namespace,
					changeId,
					queryRunner,
				);
			entity.change_id = changeId;
			entity.description = entityData.description;

			entity = await queryRunner.manager.save(EntityEntity, entity);
		} else {
			this.logger.log(`Обновление существующей сущности: ${entityData.id}`);
			// Для существующей сущности только обновляем change_id
			entity.change_id = changeId;
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
	}

	private async handleAttribute(
		attrData: any,
		entityId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Валидация типа атрибута
		const typeId = await this.attributeTypeService.resolveAttributeTypeFromJson(
			attrData.type,
		);

		// Поиск существующего атрибута
		const existingAttribute = await this.attributeRepository.findOne({
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
			attribute.description = attrData.comment;
			attribute.change_id = changeId;

			await queryRunner.manager.save(AttributeEntity, attribute);
		} else {
			this.logger.log(
				`Атрибут уже существует: ${attrData.name} для сущности ${entityId}`,
			);
		}
	}
}
