import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, In } from "typeorm";
import { EntityEntity } from "../entities/entity.entity";
import { AttributeEntity } from "../entities/attribute.entity";
import { EntityMapEntity } from "../entities/entity-map.entity";
import { EntityTypeService } from "./entity-type.service";
import { AttributeTypeService } from "./attribute-type.service";
import { EntityContainerEntity } from "../entities/entity-container.entity";
import { SystemsEntity } from "../entities/systems.entity";

@Injectable()
export class EntityProcessingService {
	private readonly logger = new Logger(EntityProcessingService.name);

	private containerCache = new Map<string, number>();

	constructor(
		@InjectRepository(EntityEntity)
		readonly _entityRepository: Repository<EntityEntity>,
		@InjectRepository(AttributeEntity)
		readonly _attributeRepository: Repository<AttributeEntity>,
		@InjectRepository(EntityMapEntity)
		readonly _entityMapRepository: Repository<EntityMapEntity>,
		@InjectRepository(EntityContainerEntity)
		readonly _entityContainerRepository: Repository<EntityContainerEntity>,
		@InjectRepository(SystemsEntity)
		readonly _systemsRepository: Repository<SystemsEntity>,
		private readonly entityTypeService: EntityTypeService,
		private readonly attributeTypeService: AttributeTypeService,
	) {}

	async handleEntities(
		entities: any[],
		processId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<{ count: number; attributesCount: number }> {
		// сброс кэша перед обработкой новой порции данных
		this.containerCache.clear();

		if (!entities || !Array.isArray(entities)) {
			return { count: 0, attributesCount: 0 };
		}

		// Предзагрузка всех существующих сущностей и атрибутов для коммита
		const { entityCache, attributeCacheByEntity } = await this.preloadEntitiesAndAttributes(entities, queryRunner);

		let attributesCount = 0;

		// Обрабатываем все сущности
		for (const entityData of entities) {
			const entityAttributesCount = await this.handleSingleEntity(
				entityData,
				changeId,
				queryRunner,
				entityCache,
				attributeCacheByEntity,
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

	/**
	 * Предзагружает все сущности и атрибуты, упомянутые в коммите, для быстрого доступа.
	 */
	private async preloadEntitiesAndAttributes(
		entities: any[],
		queryRunner: QueryRunner,
	): Promise<{
		entityCache: Map<string, EntityEntity>;
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>;
	}> {
		const fullNames = entities.map(e => e.id).filter(Boolean);
		const entityCache = new Map<string, EntityEntity>();
		const attributeCacheByEntity = new Map<number, Map<string, AttributeEntity>>();

		if (fullNames.length === 0) {
			return { entityCache, attributeCacheByEntity };
		}

		// Загружаем все сущности по full_name
		const existingEntities = await queryRunner.manager.find(EntityEntity, {
			where: { full_name: In(fullNames) },
		});
		for (const ent of existingEntities) {
			entityCache.set(ent.full_name, ent);
		}

		// Загружаем все атрибуты для найденных сущностей
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

	private async handleSingleEntity(
		entityData: any,
		changeId: number,
		queryRunner: QueryRunner,
		entityCache: Map<string, EntityEntity>,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
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
			const entityTypeId = await this.entityTypeService.mapJsonTypeToEntityType(
				entityData.type,
			);

			// Обработка entity_container
			const entityContainerId = await this.resolveEntityContainer(
				entityData,
				changeId,
				queryRunner,
			);

			// Поиск существующей сущности по full_name в кэше
			let entity = entityCache.get(entityData.id);

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
				// Добавляем в кэш
				entityCache.set(entityData.id, entity);
				attributeCacheByEntity.set(entity.entity_id, new Map());
				this.logger.log(`Создана новая сущность: ${entityData.id}`);
			} else {
				// Сущность существует – проверяем, изменилась ли она
				if (this.isEntityUnchanged(entity, entityData, entityContainerId)) {
					this.logger.log(`Сущность ${entityData.id} не изменилась, пропускаем обновление`);
				} else {
					entity.change_id = changeId;
					entity.entity_container_id = entityContainerId;
					entity.description = entityData.description || entity.description;
					entity = await queryRunner.manager.save(EntityEntity, entity);
					// Обновляем кэш
					entityCache.set(entityData.id, entity);
					this.logger.log(`Сущность ${entityData.id} обновлена`);
				}
			}

			// Обработка атрибутов
			let attributesCount = 0;
			if (entityData.attrSeq && Array.isArray(entityData.attrSeq)) {
				for (const attrData of entityData.attrSeq) {
					const processed = await this.handleAttribute(
						attrData,
						entity.entity_id,
						changeId,
						queryRunner,
						attributeCacheByEntity,
					);
					if (processed) attributesCount++;
				}
			}

			return attributesCount;
		} catch (error) {
			this.logger.error(`Ошибка обработки сущности ${entityData.id}: ${error.message}`);
			throw error;
		}
	}

	private async handleAttribute(
		attrData: any,
		entityId: number,
		changeId: number,
		queryRunner: QueryRunner,
		attributeCacheByEntity: Map<number, Map<string, AttributeEntity>>,
	): Promise<boolean> {
		try {
			const typeId = await this.attributeTypeService.resolveAttributeTypeFromJson(
				attrData.type,
			);

			const entityAttrCache = attributeCacheByEntity.get(entityId);
			const existing = entityAttrCache?.get(attrData.name);

			if (!existing) {
				const attribute = new AttributeEntity();
				attribute.entity_id = entityId;
				attribute.name = attrData.name;
				attribute.type_id = typeId;
				attribute.description = attrData.comment || attrData.description || null;
				attribute.change_id = changeId;

				await queryRunner.manager.save(AttributeEntity, attribute);
				// Добавляем в кэш
				if (!attributeCacheByEntity.has(entityId)) {
					attributeCacheByEntity.set(entityId, new Map());
				}
				attributeCacheByEntity.get(entityId)!.set(attrData.name, attribute);
				this.logger.log(`Создан новый атрибут: ${attrData.name} для сущности ${entityId}`);
				return true;
			}

			if (this.isAttributeUnchanged(existing, attrData, typeId)) {
				this.logger.log(`Атрибут ${attrData.name} для сущности ${entityId} не изменился, пропускаем`);
				return false;
			}

			existing.type_id = typeId;
			existing.description = attrData.comment || attrData.description || existing.description;
			existing.change_id = changeId;
			await queryRunner.manager.save(AttributeEntity, existing);
			// Обновляем кэш
			attributeCacheByEntity.get(entityId)!.set(attrData.name, existing);
			this.logger.log(`Атрибут ${attrData.name} для сущности ${entityId} обновлён`);
			return true;
		} catch (error) {
			this.logger.error(`Ошибка обработки атрибута ${attrData.name}: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Метод для обработки entity_container.
	 * Использует единый UPSERT-запрос для создания/обновления системы и контейнера.
	 * Работает атомарно и минимизирует число обращений к БД.
	 */
	private async resolveEntityContainer(
		entityData: any,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<number | null> {
		const namespace = entityData.namespace;
		if (!namespace) return null;

		// Проверка кэша
		if (this.containerCache.has(namespace)) {
			return this.containerCache.get(namespace)!;
		}

		// Получаем или создаем систему на основе system_code
		const systemCode = entityData.system_code || "1642";
		const systemName = `Система ${systemCode}`;
		const containerDescription =
			entityData.container_description ||
			`Контейнер для ${namespace} (система: ${systemCode})`;
		const containerTypeId = await this.determineContainerType(entityData.type);

		// 1. Ищем существующий контейнер по значению
		let container = await queryRunner.manager.findOne(EntityContainerEntity, {
			where: { value: namespace },
		});
		if (container) {
			this.containerCache.set(namespace, container.entity_container_id);
			return container.entity_container_id;
		}

		// 2. Получаем или создаём систему
		let system = await queryRunner.manager.findOne(SystemsEntity, {
			where: { code: systemCode },
		});

		if (!system) {
			this.logger.log(`Создание новой системы: ${systemCode}`);
			system = new SystemsEntity();
			system.code = systemCode;
			system.name = systemName;
			system = await queryRunner.manager.save(SystemsEntity, system);
		}

		// 3. Создаём новый контейнер
		try {
			const newContainer = new EntityContainerEntity();
			newContainer.change_id = changeId;
			newContainer.entity_container_type_id = containerTypeId;
			newContainer.value = namespace;
			newContainer.description = containerDescription;
			newContainer.system_id = system.system_id;

			const saved = await queryRunner.manager.save(EntityContainerEntity, newContainer);
			this.containerCache.set(namespace, saved.entity_container_id);
			return saved.entity_container_id;
		} catch (error) {
			// Если ошибка уникальности (код 23505) – значит, параллельная транзакция уже создала контейнер
			if (error.code === '23505') {
				this.logger.warn(`Контейнер ${namespace} создан параллельно, выполняем повторный поиск`);
				container = await queryRunner.manager.findOne(EntityContainerEntity, {
					where: { value: namespace },
				});
				if (container) {
					this.containerCache.set(namespace, container.entity_container_id);
					return container.entity_container_id;
				}
			}
			this.logger.error(`Ошибка разрешения контейнера: ${error.message}`);
			throw error;
		}
	}

	private async determineContainerType(entityType: string): Promise<number> {
		const typeMapping: { [key: string]: number } = {
			table: 2, // DB_HIVE
			view: 2, // DB_HIVE
			json: 4, // MOD_PIM
			input_vector: 4, // MOD_PIM
			unresolved: 2, // DB_HIVE (fallback)
			rdd: 2, // DB_HIVE (fallback)
		};
		return typeMapping[entityType] || 2;
	}

	private async handleEntityMappings(
		entities: any[],
		processId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Находим целевые сущности (modified = true)
		const targetEntities = entities.filter(
			(entity) => entity.modified === true,
		);

		for (const targetEntity of targetEntities) {
			await this.createEntityMap(
				targetEntity,
				processId,
				changeId,
				queryRunner,
			);
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
				this.logger.warn(
					`Сущность не найдена для создания entity_map: ${entityData.id}`,
				);
				return;
			}

			// Проверяем, существует ли уже entity_map для этой сущности и процесса
			const existingEntityMap = await queryRunner.manager.findOne(
				EntityMapEntity,
				{
					where: {
						entity_id: entity.entity_id,
						process_id: processId,
					},
				},
			);

			if (!existingEntityMap) {
				this.logger.log(`Создание entity_map для сущности: ${entityData.id}`);

				const entityMap = new EntityMapEntity();
				entityMap.entity_id = entity.entity_id;
				entityMap.process_id = processId;
				entityMap.description =
					entityData.description || `Маппинг для ${entityData.id}`;
				entityMap.change_id = changeId;

				await queryRunner.manager.save(EntityMapEntity, entityMap);
			} else {
				this.logger.log(
					`Entity_map уже существует для сущности: ${entityData.id}`,
				);
				// Обновляем change_id существующего entity_map
				existingEntityMap.change_id = changeId;
				existingEntityMap.description =
					entityData.description || existingEntityMap.description;
				await queryRunner.manager.save(EntityMapEntity, existingEntityMap);
			}
		} catch (error) {
			this.logger.error(
				`Ошибка создания entity_map для ${entityData.id}: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * Сравнивает существующую сущность с новыми данными.
	 * Возвращает true, если сущность не изменилась.
	 */
	private isEntityUnchanged(
		existing: EntityEntity,
		newData: any,
		containerId: number | null,
	): boolean {
		return (
			existing.description === (newData.description || null) &&
			existing.entity_container_id === containerId
		);
	}

	/**
	 * Сравнивает существующий атрибут с новыми данными.
	 * Возвращает true, если атрибут не изменился.
	 */
	private isAttributeUnchanged(
		existing: AttributeEntity,
		newData: any,
		typeId: number,
	): boolean {
		return (
			existing.type_id === typeId &&
			existing.description === (newData.comment || newData.description || null)
		);
	}
}
