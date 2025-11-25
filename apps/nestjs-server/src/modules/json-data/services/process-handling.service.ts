import { Injectable, Logger } from "@nestjs/common";
import { Repository, In } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner } from "typeorm";
import { ProcessEntity } from "../entities/process.entity";
import { EntityMapEntity } from "../entities/entity-map.entity";
import { AttributeMapEntity } from "../entities/attribute-map.entity";
import { AttributeMapSourceEntity } from "../entities/attribute-map-source.entity";
import { EntityAttributeMapEntity } from "../entities/entity-attribute-map.entity";

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
		readonly _attributeMapSourceRepository: Repository<AttributeMapSourceEntity>,
		@InjectRepository(EntityAttributeMapEntity)
		readonly _entityAttributeMapRepository: Repository<EntityAttributeMapEntity>,
	) {}

	async handleProcess(
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

	async getProcessIdFromData(data: any): Promise<number> {
		if (!data.desc?.appName) {
			return 0;
		}

		const processName = data.desc.appName.split(".")[0];
		const process = await this.processRepository.findOne({
			where: { name: processName },
		});

		return process ? process.process_id : 0;
	}

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

			const attributeMaps = await this.attributeMapRepository.find({
				where: { entity_map_id: In(entityMapIds) },
			});
			const attributeMapIds = attributeMaps.map((am) => am.attribute_map_id);

			await queryRunner.manager.delete(AttributeMapSourceEntity, {
				attribute_map_id: In(attributeMapIds),
			});

			await queryRunner.manager.delete(AttributeMapEntity, {
				entity_map_id: In(entityMapIds),
			});

			await queryRunner.manager.delete(EntityMapEntity, {
				process_id: processId,
			});
		}
	}
}
