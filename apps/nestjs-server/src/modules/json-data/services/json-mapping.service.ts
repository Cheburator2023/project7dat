import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
	Logger,
	Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In, QueryRunner } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { ChangeEntity } from "../entities/change.entity";
import { ProcessEntity } from "../entities/process.entity";
import { EntityEntity } from "../entities/entity.entity";
import { AttributeEntity } from "../entities/attribute.entity";
import { EntityMapEntity } from "../entities/entity-map.entity";
import { AttributeMapEntity } from "../entities/attribute-map.entity";
import { AttributeMapSourceEntity } from "../entities/attribute-map-source.entity";
import { EntityAttributeMapEntity } from "../entities/entity-attribute-map.entity";
import { JsonImportRequestDto } from "../dto/requests/json-import-request.dto";
import { EntityTypeService } from "./entity-type.service";
import { AttributeTypeService } from "./attribute-type.service";
import { EntityContainerService } from "./entity-container.service";
import { DependencyCheckService } from "./dependency-check.service";
import { VersioningService } from "./versioning.service";
import { JsonValidationService } from "./json-validation.service";

@Injectable()
export class JsonMappingService {
	private readonly logger = new Logger(JsonMappingService.name);

	constructor(
		@Optional()
		@InjectRepository(ChangeEntity)
		readonly _changeRepository: Repository<ChangeEntity>,
		@Optional()
		@InjectRepository(ProcessEntity)
		private readonly processRepository: Repository<ProcessEntity>,
		@Optional()
		@InjectRepository(EntityEntity)
		private readonly entityRepository: Repository<EntityEntity>,
		@Optional()
		@InjectRepository(AttributeEntity)
		private readonly attributeRepository: Repository<AttributeEntity>,
		@Optional()
		@InjectRepository(EntityMapEntity)
		private readonly entityMapRepository: Repository<EntityMapEntity>,
		@Optional()
		@InjectRepository(AttributeMapEntity)
		private readonly attributeMapRepository: Repository<AttributeMapEntity>,
		@Optional()
		@InjectRepository(AttributeMapSourceEntity)
		readonly _attributeMapSourceRepository: Repository<AttributeMapSourceEntity>,
		@Optional()
		@InjectRepository(EntityAttributeMapEntity)
		readonly _entityAttributeMapRepository: Repository<EntityAttributeMapEntity>,
		@Optional()
		private readonly dataSource: DataSource,
		private readonly entityTypeService: EntityTypeService,
		private readonly attributeTypeService: AttributeTypeService,
		private readonly entityContainerService: EntityContainerService,
		public readonly dependencyCheckService: DependencyCheckService,
		private readonly versioningService: VersioningService,
		private readonly jsonValidationService: JsonValidationService,
		readonly _configService: ConfigService,
	) {}

	/**
	 * Основной метод импорта JSON данных в БД DL
	 */
	async importJsonData(importRequest: JsonImportRequestDto): Promise<{
		success: boolean;
		changeId: number;
		message: string;
		warnings: string[];
		stats: {
			entitiesProcessed: number;
			attributesProcessed: number;
			mappingsProcessed: number;
		};
	}> {
		const { data, user, changeName, validated = true } = importRequest;

		this.logger.log(`Начало импорта JSON данных пользователем: ${user}`);

		// Проверка подтверждения пользователем
		if (!validated) {
			throw new ConflictException(
				"JSON должен быть проверен и подтвержден пользователем перед импортом",
			);
		}

		// Комплексная валидация JSON
		const validationReport =
			this.jsonValidationService.generateValidationReport(data);
		if (!validationReport.summary.isValid) {
			throw new BadRequestException({
				message: "Валидация JSON не пройдена",
				details: validationReport,
			});
		}

		// Проверка версии схемы
		const versionCompatibility =
			this.versioningService.validateVersionCompatibility(
				validationReport.summary.schemaVersion,
			);
		if (!versionCompatibility.compatible) {
			throw new BadRequestException({
				message: "Несовместимая версия схемы",
				details: versionCompatibility,
			});
		}

		// Обработка обратной совместимости
		let processedData = data;
		if (versionCompatibility.migrationRequired) {
			processedData = this.versioningService.migrateDataToCurrentVersion(
				data,
				validationReport.summary.schemaVersion,
			);
			this.logger.log(
				`Данные мигрированы с версии ${validationReport.summary.schemaVersion}`,
			);
		}

		// Нормализация данных
		processedData = this.jsonValidationService.normalizeJsonData(processedData);

		// Проверка на рекурсию
		const recursionCheck = this.checkForRecursion(
			processedData.entities || [],
			processedData.mappings || [],
		);
		if (recursionCheck.hasRecursion) {
			throw new BadRequestException(
				`Обнаружены рекурсивные зависимости: ${JSON.stringify(recursionCheck.cycles)}`,
			);
		}

		// Проверка на дублирование
		const duplicateCheck = this.checkForDuplicates(processedData);
		if (duplicateCheck.hasDuplicates) {
			throw new BadRequestException(
				`Обнаружены дубликаты: ${duplicateCheck.duplicates.join(", ")}`,
			);
		}

		// Проверка зависимостей для модифицированных витрин
		const modifiedEntities = (processedData.entities || []).filter(
			(entity: any) => entity.modified,
		);
		if (modifiedEntities.length > 0) {
			const safetyCheck = await this.dependencyCheckService.isSafeToUpdate(
				modifiedEntities.map((e: any) => e.id),
				await this.getProcessIdFromData(processedData),
			);

			if (!safetyCheck.safe) {
				throw new ConflictException(
					`Обнаружены потенциальные конфликты: ${safetyCheck.warnings.join("; ")}`,
				);
			}
		}

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			// Шаг 1: Создание записи в таблице изменений
			const changeId = await this.createChangeRecord(
				processedData,
				user,
				changeName,
				queryRunner,
			);
			this.logger.log(`Создана запись изменения с ID: ${changeId}`);

			// Шаг 2: Обработка процесса
			const process = await this.handleProcess(
				processedData.desc,
				changeId,
				queryRunner,
			);
			this.logger.log(
				`Обработан процесс: ${process.name} (ID: ${process.process_id})`,
			);

			// Шаг 3: Обработка сущностей
			const entitiesStats = await this.handleEntities(
				processedData.entities,
				changeId,
				queryRunner,
			);
			this.logger.log(
				`Обработано сущностей: ${entitiesStats.count}, атрибутов: ${entitiesStats.attributesCount}`,
			);

			// Шаг 4: Обработка маппингов
			const mappingsStats = await this.handleMappings(
				processedData.mappings,
				process.process_id,
				changeId,
				queryRunner,
			);
			this.logger.log(`Обработано маппингов: ${mappingsStats.count}`);

			await queryRunner.commitTransaction();

			this.logger.log(`Импорт успешно завершен. Change ID: ${changeId}`);

			return {
				success: true,
				changeId,
				message: "JSON данные успешно импортированы в БД DL",
				warnings: [],
				stats: {
					entitiesProcessed: entitiesStats.count,
					attributesProcessed: entitiesStats.attributesCount,
					mappingsProcessed: mappingsStats.count,
				},
			};
		} catch (error) {
			await queryRunner.rollbackTransaction();
			this.logger.error(`Ошибка импорта: ${error.message}`, error.stack);
			throw error;
		} finally {
			await queryRunner.release();
			this.entityContainerService.clearCache();
		}
	}

	/**
	 * Шаг 1: Создание записи в таблице изменений
	 */
	private async createChangeRecord(
		data: any,
		user: string,
		changeName: string,
		queryRunner: QueryRunner,
	): Promise<number> {
		const change = new ChangeEntity();
		change.change_date = new Date();
		change.change_user = user;
		change.change_name = changeName;
		change.app_id = data.desc?.appId;
		change.raw_json = JSON.stringify(data);
		change.user_id = user;
		change.schema_version = data.desc?.schemaVersion || "1.0";
		change.deprecation = false;

		const savedChange = await queryRunner.manager.save(ChangeEntity, change);
		return savedChange.change_id;
	}

	/**
	 * Шаг 2: Обработка процесса
	 */
	private async handleProcess(
		desc: any,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<ProcessEntity> {
		if (!desc || !desc.appName) {
			throw new Error("Неверная структура desc: отсутствует appName");
		}

		const processName = desc.appName.split(".")[0];

		// Поиск существующего процесса
		let process = await this.processRepository.findOne({
			where: { name: processName },
		});

		if (process) {
			this.logger.log(
				`Найден существующий процесс: ${processName} (ID: ${process.process_id})`,
			);

			// Для существующего процесса обновляем change_id
			process.change_id = changeId;
			process = await queryRunner.manager.save(ProcessEntity, process);

			// Удаляем старые связи для этого процесса
			await this.cleanupExistingMappings(process.process_id, queryRunner);
		} else {
			this.logger.log(`Создание нового процесса: ${processName}`);

			// Создание нового процесса
			process = new ProcessEntity();
			process.name = processName;
			process.change_id = changeId;
			process.process_type = 1; // DEFAULT_PROCESS_TYPE

			process = await queryRunner.manager.save(ProcessEntity, process);
		}

		return process;
	}

	/**
	 * Шаг 3: Обработка сущностей
	 */
	private async handleEntities(
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

	/**
	 * Обработка одной сущности
	 */
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

	/**
	 * Обработка атрибута
	 */
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
			// Атрибуты только добавляем, не обновляем существующие
		}
	}

	/**
	 * Шаг 4: Обработка маппингов
	 */
	private async handleMappings(
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

	/**
	 * Обработка одного маппинга
	 */
	private async handleSingleMapping(
		mapping: any,
		processId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Шаг 5.1: Поиск таргет сущности
		const targetEntity = await this.entityRepository.findOne({
			where: { full_name: mapping.entityId },
		});

		if (!targetEntity) {
			throw new NotFoundException(
				`Таргет сущность не найдена: ${mapping.entityId}`,
			);
		}

		// Шаг 5.2: Создание entity_map
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

	/**
	 * Обработка зависимости
	 */
	private async handleDependency(
		dep: any,
		entityMapId: number,
		targetEntityId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Шаг 5.3: Поиск source сущности
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

	/**
	 * Обработка attrMap
	 */
	private async handleAttrMap(
		attrMap: any,
		entityMapId: number,
		sourceEntityId: number,
		targetEntityId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Шаг 5.4: Поиск source атрибута
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

		// Шаг 5.5: Поиск target атрибута и создание attribute_map
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

	/**
	 * Обработка attrDep
	 */
	private async handleAttrDep(
		attrDep: any,
		entityMapId: number,
		sourceEntityId: number,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Шаг 5.6: Поиск source атрибута
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

		// Шаг 5.7: Создание entity_attribute_map для каждого linkType
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

	/**
	 * Очистка существующих маппингов для процесса
	 */
	private async cleanupExistingMappings(
		processId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		// Находим все entity_map для процесса
		const entityMaps = await this.entityMapRepository.find({
			where: { process_id: processId },
		});

		if (entityMaps.length > 0) {
			const entityMapIds = entityMaps.map((em) => em.entity_map_id);

			// Удаляем связанные записи
			await queryRunner.manager.delete(EntityAttributeMapEntity, {
				entity_map_id: In(entityMapIds),
			});

			await queryRunner.manager.delete(AttributeMapSourceEntity, {
				attribute_map_id: In(
					await this.attributeMapRepository
						.find({
							where: { entity_map_id: In(entityMapIds) },
						})
						.then((maps) => maps.map((am) => am.attribute_map_id)),
				),
			});

			await queryRunner.manager.delete(AttributeMapEntity, {
				entity_map_id: In(entityMapIds),
			});

			await queryRunner.manager.delete(EntityMapEntity, {
				process_id: processId,
			});
		}
	}

	/**
	 * Получение ID процесса из данных
	 */
	public async getProcessIdFromData(data: any): Promise<number> {
		if (!data.desc?.appName) {
			return 0;
		}

		const processName = data.desc.appName.split(".")[0];
		const process = await this.processRepository.findOne({
			where: { name: processName },
		});

		return process ? process.process_id : 0;
	}

	/**
	 * Проверка на удаление/обновление витрин, задействованных в других процессах
	 */
	async checkAffectedMarts(
		entities: any[],
	): Promise<{ hasConflicts: boolean; conflicts: string[] }> {
		const conflicts: string[] = [];
		const modifiedEntities = entities.filter((entity) => entity.modified);

		if (modifiedEntities.length === 0) {
			return { hasConflicts: false, conflicts: [] };
		}

		for (const entity of modifiedEntities) {
			const usageCheck = await this.dependencyCheckService.checkMartUsage([
				entity.id,
			]);
			if (usageCheck.hasConflicts) {
				usageCheck.conflicts.forEach((conflict) => {
					conflicts.push(
						`Сущность ${conflict.entityName} используется в процессах: ${conflict.processes.join(", ")}`,
					);
				});
			}
		}

		return {
			hasConflicts: conflicts.length > 0,
			conflicts,
		};
	}

	/**
	 * Валидация JSON структуры
	 */
	validateJsonStructure(data: any): { isValid: boolean; errors: string[] } {
		return this.jsonValidationService.validateJsonForImport(data);
	}

	/**
	 * Проверка на рекурсивные зависимости
	 */
	checkForRecursion(
		entities: any[],
		mappings: any[],
	): { hasRecursion: boolean; cycles: string[][] } {
		return this.jsonValidationService.checkForRecursion(entities, mappings);
	}

	/**
	 * Проверка на дублирование сущностей и атрибутов
	 */
	checkForDuplicates(data: any): {
		hasDuplicates: boolean;
		duplicates: string[];
	} {
		return this.jsonValidationService.checkForDuplicates(data);
	}
}
