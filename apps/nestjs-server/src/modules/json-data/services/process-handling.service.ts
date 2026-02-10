import { Injectable, Logger } from "@nestjs/common";
import { Repository, In } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner } from "typeorm";
import { ProcessEntity } from "../entities/process.entity";
import { ProcessTypeEntity } from "../entities/process-type.entity";
import { EntityMapEntity } from "../entities/entity-map.entity";
import { AttributeMapEntity } from "../entities/attribute-map.entity";
import { AttributeMapSourceEntity } from "../entities/attribute-map-source.entity";
import { EntityAttributeMapEntity } from "../entities/entity-attribute-map.entity";
import { EntityMapSourceEntity } from "../entities/entity-map-source.entity";
import { EntityEntity } from "../entities/entity.entity";
import { AttributeEntity } from "../entities/attribute.entity";

@Injectable()
export class ProcessHandlingService {
	private readonly logger = new Logger(ProcessHandlingService.name);

	constructor(
		@InjectRepository(ProcessEntity)
		private readonly processRepository: Repository<ProcessEntity>,
		@InjectRepository(EntityMapEntity)
		private readonly entityMapRepository: Repository<EntityMapEntity>,
		@InjectRepository(AttributeMapEntity)
		private readonly attributeMapRepository: Repository<AttributeMapEntity>,
		@InjectRepository(AttributeMapSourceEntity)
		private readonly attributeMapSourceRepository: Repository<AttributeMapSourceEntity>,
		@InjectRepository(EntityEntity)
		private readonly entityRepository: Repository<EntityEntity>,
	) {}

	async handleProcess(
		desc: any,
		_entities: any[],
		mappings: any[],
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<ProcessEntity> {
		if (!desc || !desc.appName) {
			throw new Error("Неверная структура desc: отсутствует appName");
		}

		const processName = this.extractProcessName(desc.appName);

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
			process.description = desc.appName;
			process = await queryRunner.manager.save(ProcessEntity, process);

			// Удаляем только связи для совпадающих источников и витрин
			await this.cleanupMatchingMappings(
				process.process_id,
				mappings,
				queryRunner,
			);
		} else {
			this.logger.log(`Создание нового процесса: ${processName}`);

			// Создание нового процесса
			process = new ProcessEntity();
			process.name = processName;
			process.change_id = changeId;
			process.process_type = await this.resolveProcessTypeId(
				desc.appName,
				changeId,
				queryRunner,
			);
			process.description = desc.appName;
			process.group_id = null;

			process = await queryRunner.manager.save(ProcessEntity, process);
		}

		return process;
	}

	private extractProcessName(appName: string): string {
		return appName.split(".")[0];
	}

	private getProcessTypeName(appName: string): string {
		if (appName.includes("DAG")) {
			return "DAG_AIRFLOW";
		}
		if (appName.includes("Spark")) {
			return "SPARK_JOB";
		}
		return "AUTO_MAPPER";
	}

	private async resolveProcessTypeId(
		appName: string,
		changeId: number,
		queryRunner: QueryRunner,
	): Promise<number> {
		const typeName = this.getProcessTypeName(appName);

		const existing = await queryRunner.manager.findOne(ProcessTypeEntity, {
			where: { name: typeName },
		});
		if (existing) return existing.process_type_id;

		this.logger.warn(
			`Тип процесса '${typeName}' не найден в таблице process_type. Создаю запись автоматически.`,
		);

		const created = new ProcessTypeEntity();
		created.name = typeName;
		created.description = typeName;
		created.change_id = changeId;

		const saved = await queryRunner.manager.save(ProcessTypeEntity, created);
		return saved.process_type_id;
	}

	/**
	 * Удаляет связи только для совпадающих источников и витрин текущего процесса
	 */
	private async cleanupMatchingMappings(
		processId: number,
		newMappings: any[],
		queryRunner: QueryRunner,
	): Promise<void> {
		this.logger.log(
			`Очистка связей для совпадающих источников и витрин процесса: ${processId}`,
		);

		try {
			// Получаем список target entities из новых маппингов
			const targetEntityIds = this.extractTargetEntityIds(newMappings);

			if (targetEntityIds.length === 0) {
				this.logger.log("Нет target entities для очистки связей");
				return;
			}

			// Находим entity_id для target entities
			const targetEntities = await this.entityRepository.find({
				where: { full_name: In(targetEntityIds) },
			});

			if (targetEntities.length === 0) {
				this.logger.log("Не найдены entity записи для target entities");
				return;
			}

			const targetEntityIdsNum = targetEntities.map((e) => e.entity_id);

			// Находим entity_map для target entities и текущего процесса
			const entityMaps = await this.entityMapRepository.find({
				where: {
					entity_id: In(targetEntityIdsNum),
					process_id: processId,
				},
			});

			if (entityMaps.length === 0) {
				this.logger.log("Не найдены entity_map записи для очистки");
				return;
			}

			const entityMapIds = entityMaps.map((em) => em.entity_map_id);

			// Получаем source entities из новых маппингов
			const sourceEntityIds = this.extractSourceEntityIds(newMappings);
			const sourceEntities = await this.entityRepository.find({
				where: { full_name: In(sourceEntityIds) },
			});

			const sourceEntityIdsNum = sourceEntities.map((e) => e.entity_id);

			// Удаляем связи только для совпадающих источников и витрин
			await this.cleanupMatchingAttributeMappings(
				entityMapIds,
				sourceEntityIdsNum,
				queryRunner,
			);
			await this.cleanupMatchingEntityMappings(
				entityMapIds,
				sourceEntityIdsNum,
				queryRunner,
			);

			this.logger.log(
				`Очищены связи для ${entityMaps.length} entity_map записей`,
			);
		} catch (error) {
			this.logger.error(
				`Ошибка при очистке совпадающих маппингов: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	/**
	 * Извлекает target entity IDs из маппингов
	 */
	private extractTargetEntityIds(mappings: any[]): string[] {
		if (!mappings || !Array.isArray(mappings)) {
			return [];
		}

		const targetIds = new Set<string>();
		mappings.forEach((mapping) => {
			if (mapping.entityId) {
				targetIds.add(mapping.entityId);
			}
		});

		return Array.from(targetIds);
	}

	/**
	 * Извлекает source entity IDs из маппингов
	 */
	private extractSourceEntityIds(mappings: any[]): string[] {
		if (!mappings || !Array.isArray(mappings)) {
			return [];
		}

		const sourceIds = new Set<string>();
		mappings.forEach((mapping) => {
			if (mapping.deps && Array.isArray(mapping.deps)) {
				mapping.deps.forEach((dep: any) => {
					if (dep.entityId) {
						sourceIds.add(dep.entityId);
					}
				});
			}
		});

		return Array.from(sourceIds);
	}

	/**
	 * Удаляет attribute mappings только для совпадающих источников
	 */
	private async cleanupMatchingAttributeMappings(
		entityMapIds: number[],
		sourceEntityIds: number[],
		queryRunner: QueryRunner,
	): Promise<void> {
		if (entityMapIds.length === 0 || sourceEntityIds.length === 0) {
			return;
		}

		// Находим attribute_map для entity_map
		const attributeMaps = await this.attributeMapRepository.find({
			where: { entity_map_id: In(entityMapIds) },
		});

		if (attributeMaps.length === 0) {
			return;
		}

		const attributeMapIds = attributeMaps.map((am) => am.attribute_map_id);

		// Находим attribute_map_source только для совпадающих source entities
		const attributeMapSources = await this.attributeMapSourceRepository
			.createQueryBuilder("ams")
			.innerJoin("ams.source_attribute", "attribute")
			.where("ams.attribute_map_id IN (:...attributeMapIds)", {
				attributeMapIds,
			})
			.andWhere("attribute.entity_id IN (:...sourceEntityIds)", {
				sourceEntityIds,
			})
			.getMany();

		const attributeMapSourceIds = attributeMapSources.map(
			(ams) => ams.attribute_map_id,
		);

		if (attributeMapSourceIds.length > 0) {
			// Удаляем entity_attribute_map для совпадающих attribute_map_source
			await queryRunner.manager.delete(EntityAttributeMapEntity, {
				entity_map_id: In(entityMapIds),
				source_attribute_id: In(
					attributeMapSources.map((ams) => ams.source_attribute_id),
				),
			});

			// Удаляем attribute_map_source для совпадающих источников
			await queryRunner.manager.delete(AttributeMapSourceEntity, {
				attribute_map_id: In(attributeMapSourceIds),
				source_attribute_id: In(
					attributeMapSources.map((ams) => ams.source_attribute_id),
				),
			});
		}

		// Удаляем attribute_map для entity_map (они будут пересозданы)
		await queryRunner.manager.delete(AttributeMapEntity, {
			entity_map_id: In(entityMapIds),
		});
	}

	/**
	 * Удаляет entity mappings только для совпадающих источников
	 */
	private async cleanupMatchingEntityMappings(
		entityMapIds: number[],
		sourceEntityIds: number[],
		queryRunner: QueryRunner,
	): Promise<void> {
		if (entityMapIds.length === 0 || sourceEntityIds.length === 0) {
			return;
		}

		// Удаляем entity_attribute_map для совпадающих источников
		await queryRunner.manager.delete(EntityAttributeMapEntity, {
			entity_map_id: In(entityMapIds),
			source_attribute_id: In(
				await this.getSourceAttributeIds(sourceEntityIds),
			),
		});

		// Удаляем entity_map_source для совпадающих источников
		await queryRunner.manager.delete(EntityMapSourceEntity, {
			entity_map_id: In(entityMapIds),
			source_entity_id: In(sourceEntityIds),
		});
	}

	/**
	 * Получает attribute_ids для source entities
	 */
	private async getSourceAttributeIds(
		sourceEntityIds: number[],
	): Promise<number[]> {
		if (sourceEntityIds.length === 0) {
			return [];
		}

		const attributes = await this.attributeMapSourceRepository
			.createQueryBuilder("ams")
			.select("DISTINCT ams.source_attribute_id", "source_attribute_id")
			.innerJoin("ams.source_attribute", "attribute")
			.where("attribute.entity_id IN (:...sourceEntityIds)", {
				sourceEntityIds,
			})
			.getRawMany();

		return attributes.map((attr) => attr.source_attribute_id);
	}

	async getProcessIdFromData(data: any): Promise<number> {
		if (!data.desc?.appName) {
			return 0;
		}

		const processName = this.extractProcessName(data.desc.appName);
		const process = await this.processRepository.findOne({
			where: { name: processName },
		});

		return process ? process.process_id : 0;
	}

	/**
	 * Заполняет process в entity_map_source
	 */
	async populateEntityMapSource(
		processId: number,
		queryRunner: QueryRunner,
	): Promise<void> {
		this.logger.log(`Заполнение entity_map_source для процесса: ${processId}`);

		try {
			// Получаем все entity_map для процесса
			const entityMaps = await queryRunner.manager.find(EntityMapEntity, {
				where: { process_id: processId },
			});

			for (const entityMap of entityMaps) {
				// Ищем источники через attribute_map_source
				const attributeMaps = await queryRunner.manager.find(
					AttributeMapEntity,
					{
						where: { entity_map_id: entityMap.entity_map_id },
					},
				);

				for (const attributeMap of attributeMaps) {
					const attributeMapSources = await queryRunner.manager.find(
						AttributeMapSourceEntity,
						{
							where: { attribute_map_id: attributeMap.attribute_map_id },
						},
					);

					for (const attributeMapSource of attributeMapSources) {
						// Получаем атрибут источника
						const sourceAttribute = await queryRunner.manager.findOne(
							AttributeEntity,
							{
								where: { attribute_id: attributeMapSource.source_attribute_id },
							},
						);

						if (sourceAttribute) {
							// Создаем запись в entity_map_source
							const existingSource = await queryRunner.manager.findOne(
								EntityMapSourceEntity,
								{
									where: {
										entity_map_id: entityMap.entity_map_id,
										source_entity_id: sourceAttribute.entity_id,
									},
								},
							);

							if (!existingSource) {
								const entityMapSource = new EntityMapSourceEntity();
								entityMapSource.entity_map_id = entityMap.entity_map_id;
								entityMapSource.source_entity_id = sourceAttribute.entity_id;
								entityMapSource.change_id = entityMap.change_id;

								await queryRunner.manager.save(
									EntityMapSourceEntity,
									entityMapSource,
								);
							}
						}
					}
				}

				// Ищем источники через entity_attribute_map
				const entityAttributeMaps = await queryRunner.manager.find(
					EntityAttributeMapEntity,
					{
						where: { entity_map_id: entityMap.entity_map_id },
					},
				);

				for (const entityAttributeMap of entityAttributeMaps) {
					const sourceAttribute = await queryRunner.manager.findOne(
						AttributeEntity,
						{
							where: { attribute_id: entityAttributeMap.source_attribute_id },
						},
					);

					if (sourceAttribute) {
						// Создаем запись в entity_map_source
						const existingSource = await queryRunner.manager.findOne(
							EntityMapSourceEntity,
							{
								where: {
									entity_map_id: entityMap.entity_map_id,
									source_entity_id: sourceAttribute.entity_id,
								},
							},
						);

						if (!existingSource) {
							const entityMapSource = new EntityMapSourceEntity();
							entityMapSource.entity_map_id = entityMap.entity_map_id;
							entityMapSource.source_entity_id = sourceAttribute.entity_id;
							entityMapSource.change_id = entityMap.change_id;

							await queryRunner.manager.save(
								EntityMapSourceEntity,
								entityMapSource,
							);
						}
					}
				}
			}

			this.logger.log(
				`Заполнение entity_map_source завершено для процесса: ${processId}`,
			);
		} catch (error) {
			this.logger.error(
				`Ошибка заполнения entity_map_source: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
