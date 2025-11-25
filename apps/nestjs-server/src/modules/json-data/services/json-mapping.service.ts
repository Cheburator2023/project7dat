import {
	Injectable,
	Logger,
	BadRequestException,
	ConflictException,
} from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { JsonImportRequestDto } from "../dto/requests/json-import-request.dto";
import { JsonValidationService } from "./json-validation.service";
import { DependencyCheckService } from "./dependency-check.service";
import { VersioningService } from "./versioning.service";
import { ChangeRecordService } from "./change-record.service";
import { ProcessHandlingService } from "./process-handling.service";
import { EntityProcessingService } from "./entity-processing.service";
import { MappingProcessingService } from "./mapping-processing.service";
import {
	ValidationResult,
	RecursionCheckResult,
	DuplicateCheckResult,
} from "../types/validation.types";

interface ImportResult {
	success: boolean;
	changeId: number;
	message: string;
	warnings: string[];
	stats: {
		entitiesProcessed: number;
		attributesProcessed: number;
		mappingsProcessed: number;
		failedMappingsProcessed: number;
	};
}

@Injectable()
export class JsonMappingService {
	private readonly logger = new Logger(JsonMappingService.name);

	constructor(
		private readonly dataSource: DataSource,
		private readonly jsonValidationService: JsonValidationService,
		private readonly dependencyCheckService: DependencyCheckService,
		private readonly versioningService: VersioningService,
		private readonly changeRecordService: ChangeRecordService,
		private readonly processHandlingService: ProcessHandlingService,
		private readonly entityProcessingService: EntityProcessingService,
		private readonly mappingProcessingService: MappingProcessingService,
	) {}

	/**
	 * Основной метод импорта JSON данных в БД DL
	 */
	async importJsonData(
		importRequest: JsonImportRequestDto,
	): Promise<ImportResult> {
		const { data, user, changeName, validated = true } = importRequest;

		this.logger.log(`Импорт JSON данных пользователем: ${user}`);

		// Валидация и предобработка данных
		const processedData = await this.validateAndPreprocessData(data, validated);

		// Проверка конфликтов
		await this.checkForConflicts(processedData);

		// Выполнение импорта в транзакции
		return await this.executeImportTransaction(processedData, user, changeName);
	}

	/**
	 * Валидация и предобработка данных
	 */
	private async validateAndPreprocessData(
		data: any,
		validated: boolean,
	): Promise<any> {
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

		// Проверка на рекурсию и дублирование
		this.validateDataConsistency(processedData);

		return processedData;
	}

	/**
	 * Проверка конфликтов и зависимостей
	 */
	private async checkForConflicts(processedData: any): Promise<void> {
		// Проверка на рекурсию
		const recursionCheck = this.jsonValidationService.checkForRecursion(
			processedData.entities || [],
			processedData.mappings || [],
		);
		if (recursionCheck.hasRecursion) {
			throw new BadRequestException(
				`Обнаружены рекурсивные зависимости: ${JSON.stringify(recursionCheck.cycles)}`,
			);
		}

		// Проверка на дублирование
		const duplicateCheck =
			this.jsonValidationService.checkForDuplicates(processedData);
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
			const processId =
				await this.processHandlingService.getProcessIdFromData(processedData);
			const safetyCheck = await this.dependencyCheckService.isSafeToUpdate(
				modifiedEntities.map((e: any) => e.id),
				processId,
			);

			if (!safetyCheck.safe) {
				throw new ConflictException(
					`Обнаружены потенциальные конфликты: ${safetyCheck.warnings.join("; ")}`,
				);
			}
		}
	}

	/**
	 * Проверка консистентности данных
	 */
	private validateDataConsistency(data: any): void {
		const integrityCheck =
			this.jsonValidationService.validateDataIntegrity(data);
		if (!integrityCheck.isValid) {
			throw new BadRequestException(
				`Проблемы целостности данных: ${integrityCheck.issues.join(", ")}`,
			);
		}
	}

	/**
	 * Выполнение импорта в транзакции
	 */
	private async executeImportTransaction(
		processedData: any,
		user: string,
		changeName: string,
	): Promise<ImportResult> {
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			const importStats = await this.processImportData(
				processedData,
				user,
				changeName,
				queryRunner,
			);
			await queryRunner.commitTransaction();

			this.logger.log(
				`Импорт успешно завершен. Change ID: ${importStats.changeId}`,
			);

			return {
				success: true,
				changeId: importStats.changeId,
				message: "JSON данные успешно импортированы в БД DL",
				warnings: [],
				stats: importStats.stats,
			};
		} catch (error) {
			await queryRunner.rollbackTransaction();
			this.logger.error(`Ошибка импорта: ${error.message}`, error.stack);
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	/**
	 * Обработка данных импорта
	 */
	private async processImportData(
		processedData: any,
		user: string,
		changeName: string,
		queryRunner: QueryRunner,
	): Promise<{ changeId: number; stats: ImportResult["stats"] }> {
		// Шаг 1: Создание записи в таблице изменений
		const changeId = await this.changeRecordService.createChangeRecord(
			processedData,
			user,
			changeName,
			queryRunner,
		);
		this.logger.log(`Создана запись изменения с ID: ${changeId}`);

		// Шаг 2: Обработка процесса
		const process = await this.processHandlingService.handleProcess(
			processedData.desc,
			changeId,
			queryRunner,
		);
		this.logger.log(
			`Обработан процесс: ${process.name} (ID: ${process.process_id})`,
		);

		// Шаг 3: Обработка сущностей
		const entitiesStats = await this.entityProcessingService.handleEntities(
			processedData.entities,
			changeId,
			queryRunner,
		);
		this.logger.log(
			`Обработано сущностей: ${entitiesStats.count}, атрибутов: ${entitiesStats.attributesCount}`,
		);

		// Шаг 4: Обработка маппингов
		const mappingsStats = await this.mappingProcessingService.handleMappings(
			processedData.mappings,
			process.process_id,
			changeId,
			queryRunner,
		);
		this.logger.log(`Обработано маппингов: ${mappingsStats.count}`);

		// Шаг 5: Обработка неудачных маппингов (для DAPP JSON)
		const failedMappingsStats =
			await this.mappingProcessingService.handleFailedMappings(
				processedData.failedMappings,
				changeId,
				queryRunner,
			);
		this.logger.log(
			`Обработано неудачных маппингов: ${failedMappingsStats.count}`,
		);

		this.logger.log(`Импорт успешно завершен. Change ID: ${changeId}`);

		return {
			changeId,
			stats: {
				entitiesProcessed: entitiesStats.count,
				attributesProcessed: entitiesStats.attributesCount,
				mappingsProcessed: mappingsStats.count,
				failedMappingsProcessed: failedMappingsStats.count,
			},
		};
	}

	/**
	 * Проверка на удаление/обновление витрин, задействованных в других процессах
	 */
	async checkAffectedMarts(entities: any[]): Promise<{
		hasConflicts: boolean;
		conflicts: string[];
	}> {
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
	validateJsonStructure(data: any): ValidationResult {
		return this.jsonValidationService.validateJsonForImport(data);
	}

	/**
	 * Проверка на рекурсивные зависимости
	 */
	checkForRecursion(entities: any[], mappings: any[]): RecursionCheckResult {
		return this.jsonValidationService.checkForRecursion(entities, mappings);
	}

	/**
	 * Проверка на дублирование сущностей и атрибутов
	 */
	checkForDuplicates(data: any): DuplicateCheckResult {
		return this.jsonValidationService.checkForDuplicates(data);
	}

	/**
	 * Получение ID процесса из данных JSON
	 */
	async getProcessIdFromData(data: any): Promise<number> {
		return this.processHandlingService.getProcessIdFromData(data);
	}
}
