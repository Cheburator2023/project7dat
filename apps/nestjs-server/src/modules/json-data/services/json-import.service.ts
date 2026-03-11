import {
	Injectable,
	Logger,
	BadRequestException,
	ConflictException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { DataSource, QueryRunner } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JsonImportRequestDto } from "../dto";
import { JsonValidationOrchestratorService } from "./json-validation-orchestrator.service";
import { JsonConflictService } from "./json-conflict.service";
import { JsonMigrationService } from "./json-migration.service";
import { ChangeRecordService } from "./change-record.service";
import { ProcessHandlingService } from "./process-handling.service";
import { EntityProcessingService } from "./entity-processing.service";
import { MappingProcessingService } from "./mapping-processing.service";
import { CacheService } from "./cache.service";
import { GraphIndexService } from "./graph-index.service";

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
export class JsonImportService {
	private readonly logger = new Logger(JsonImportService.name);

	constructor(
		private readonly dataSource: DataSource,
		private readonly validationOrchestrator: JsonValidationOrchestratorService,
		private readonly conflictService: JsonConflictService,
		private readonly migrationService: JsonMigrationService,
		private readonly changeRecordService: ChangeRecordService,
		private readonly processHandlingService: ProcessHandlingService,
		private readonly entityProcessingService: EntityProcessingService,
		private readonly mappingProcessingService: MappingProcessingService,
		private readonly cacheService: CacheService,
		private readonly graphIndexService: GraphIndexService,
		private readonly configService: ConfigService,
	) {}

	async importJsonData(
		importRequest: JsonImportRequestDto,
	): Promise<ImportResult> {
		const {
			data,
			user,
			changeName,
			validated = true,
			allowExistingCycles,
			skipDuplicateCheck,
			checkCancelled,
			onStepProgress,
		} = importRequest;

		checkCancelled?.();

		// Определяем значения по умолчанию из .env, если не переданы в запросе
		const effectiveAllowExistingCycles =
			allowExistingCycles !== undefined
				? allowExistingCycles
				: this.configService.get<boolean>(
						"ALLOW_EXISTING_CYCLES_DEFAULT",
						false,
					);

		const effectiveSkipDuplicateCheck =
			skipDuplicateCheck !== undefined
				? skipDuplicateCheck
				: this.configService.get<boolean>(
						"SKIP_DUPLICATE_CHECK_DEFAULT",
						false,
					);

		const importId = randomUUID();

		const estimatedSize =
			(data?.entities?.length ?? 0) + (data?.mappings?.length ?? 0);
		this.logger.log(`Импорт JSON данных пользователем: ${user}`, {
			user,
			changeName,
			validated,
			entitiesCount: data?.entities?.length ?? 0,
			mappingsCount: data?.mappings?.length ?? 0,
			estimatedItems: estimatedSize,
			importId,
			allowExistingCycles: effectiveAllowExistingCycles,
			skipDuplicateCheck: effectiveSkipDuplicateCheck,
		});

		// Валидация и предобработка данных с учётом флагов
		const processedData = await this.validateAndPreprocessData(
			data,
			validated,
			{
				allowExistingCycles: effectiveAllowExistingCycles,
				skipDuplicateCheck: effectiveSkipDuplicateCheck,
			},
		);
		checkCancelled?.();

		// Проверка конфликтов с учётом флагов
		// Пропускаем повторную валидацию, если и циклы, и дубликаты уже разрешены (merge flow)
		if (!effectiveAllowExistingCycles || !effectiveSkipDuplicateCheck) {
			await this.checkForConflicts(
				processedData,
				effectiveAllowExistingCycles,
				effectiveSkipDuplicateCheck,
			);
		}
		checkCancelled?.();

		// Выполнение импорта в транзакции
		return await this.executeImportTransaction(
			processedData,
			user,
			changeName,
			importId,
			checkCancelled,
			onStepProgress,
		);
	}

	private async validateAndPreprocessData(
		data: any,
		validated: boolean,
		options?: { allowExistingCycles?: boolean; skipDuplicateCheck?: boolean },
	): Promise<any> {
		if (!validated) {
			throw new ConflictException(
				"JSON должен быть проверен и подтвержден пользователем перед импортом",
			);
		}

		// Комплексная валидация JSON
		const validationResult = await this.validationOrchestrator.validate(data);

		this.logger.log("Результат комплексной валидации JSON", {
			entitiesCount: data?.entities?.length ?? 0,
			mappingsCount: data?.mappings?.length ?? 0,
			failedMappingsCount: data?.failedMappings?.length ?? 0,
			schemaVersion: validationResult.schemaVersion.version,
			schemaSupported: validationResult.schemaVersion.supported,
			migrationRequired: validationResult.schemaVersion.migrationRequired,
			structureErrorsCount: validationResult.validation.errors.length,
			structureWarningsCount: validationResult.validation.warnings.length,
			integrityIssuesCount: validationResult.integrity.issues.length,
			recursionDetected: validationResult.recursionCheck.hasRecursion,
			recursionCyclesCount: validationResult.recursionCheck.cycles.length,
			duplicatesDetected: validationResult.duplicateCheck.hasDuplicates,
			duplicatesCount: validationResult.duplicateCheck.duplicates.length,
			options,
		});

		// Разрешаем импорт если есть только предупреждения (но нет критических ошибок)
		if (this.hasCriticalErrors(validationResult, options)) {
			this.logger.error("Импорт остановлен из-за ошибок валидации JSON", {
				entitiesCount: data?.entities?.length ?? 0,
				mappingsCount: data?.mappings?.length ?? 0,
				failedMappingsCount: data?.failedMappings?.length ?? 0,
				schemaVersion: validationResult.schemaVersion.version,
				schemaSupported: validationResult.schemaVersion.supported,
				migrationRequired: validationResult.schemaVersion.migrationRequired,
				structureErrors: validationResult.validation.errors.slice(0, 50),
				structureWarnings: validationResult.validation.warnings.slice(0, 20),
				integrityIssues: validationResult.integrity.issues.slice(0, 50),
				recursionCycles: validationResult.recursionCheck.cycles.slice(0, 10),
				duplicates: validationResult.duplicateCheck.duplicates.slice(0, 50),
				recommendations: validationResult.recommendations.slice(0, 20),
				statistics: validationResult.statistics,
				options,
			});
			throw new BadRequestException({
				message: "Валидация JSON не пройдена",
				details: validationResult,
			});
		}

		// Обработка обратной совместимости - ВСЕГДА выполняем миграцию если требуется
		let processedData = validationResult.normalizedData;
		if (validationResult.schemaVersion.migrationRequired) {
			processedData = this.migrationService.migrateDataToCurrentVersion(
				processedData,
				validationResult.schemaVersion.incomingVersion,
			);
			this.logger.log(
				`Данные мигрированы с версии ${validationResult.schemaVersion.incomingVersion} на ${validationResult.schemaVersion.currentVersion}`,
			);
		}

		return processedData;
	}

	/**
	 * Определяет наличие КРИТИЧЕСКИХ ошибок, которые блокируют импорт
	 */
	private hasCriticalErrors(
		validationResult: any,
		options?: { allowExistingCycles?: boolean; skipDuplicateCheck?: boolean },
	): boolean {
		// Критические ошибки структуры
		if (validationResult.validation.errors.length > 0) {
			this.logger.warn(
				`Критические ошибки структуры: ${validationResult.validation.errors.length}`,
				{ errors: validationResult.validation.errors.slice(0, 20) },
			);
			return true;
		}

		// Проблемы целостности, связанные с отсутствием source entities, не являются критическими
		const criticalIntegrityIssues = validationResult.integrity.issues.filter(
			(issue) =>
				!issue.includes("source entity не найдена") &&
				!issue.includes("target entity не найдена"),
		);

		if (criticalIntegrityIssues.length > 0) {
			this.logger.warn(
				`Критические ошибки целостности: ${criticalIntegrityIssues.length}`,
				{ issues: criticalIntegrityIssues.slice(0, 20) },
			);
			return true;
		}

		// Неподдерживаемая версия схемы критическая ошибка
		if (!validationResult.schemaVersion.supported) {
			this.logger.warn(
				`Неподдерживаемая версия схемы: ${validationResult.schemaVersion.version}`,
			);
			return true;
		}

		// Рекурсия критическая, если не разрешена явно
		if (
			!options?.allowExistingCycles &&
			validationResult.recursionCheck.hasRecursion
		) {
			this.logger.warn("Обнаружена рекурсия в зависимостях", {
				cycles: validationResult.recursionCheck.cycles.slice(0, 20),
				cyclesCount: validationResult.recursionCheck.cycles.length,
			});
			return true;
		}

		// Дубликаты критическая, если не пропущены явно
		if (
			!options?.skipDuplicateCheck &&
			validationResult.duplicateCheck.hasDuplicates
		) {
			this.logger.warn(
				`Обнаружены дубликаты: ${validationResult.duplicateCheck.duplicates.slice(0, 20).join(", ")}`,
			);
			return true;
		}

		this.logger.log(
			"Критических ошибок не обнаружено, импорт может быть продолжен",
		);
		return false;
	}

	private async checkForConflicts(
		processedData: any,
		allowExistingCycles?: boolean,
		skipDuplicateCheck?: boolean,
	): Promise<void> {
		this.logger.debug(
			`Проверка конфликтов: allowExistingCycles=${allowExistingCycles}, skipDuplicateCheck=${skipDuplicateCheck}`,
		);

		const validationResult =
			await this.validationOrchestrator.validate(processedData);

		// Проверка рекурсии
		if (!allowExistingCycles && validationResult.recursionCheck.hasRecursion) {
			this.logger.warn(
				`Рекурсия обнаружена и не разрешена, циклы: ${JSON.stringify(validationResult.recursionCheck.cycles)}`,
			);
			throw new BadRequestException(
				`Обнаружены рекурсивные зависимости: ${JSON.stringify(validationResult.recursionCheck.cycles)}`,
			);
		}
		if (allowExistingCycles && validationResult.recursionCheck.hasRecursion) {
			this.logger.warn(
				`Рекурсия обнаружена, но разрешена флагом allowExistingCycles. Циклы: ${JSON.stringify(validationResult.recursionCheck.cycles)}`,
			);
		}

		// Проверка дубликатов
		if (!skipDuplicateCheck && validationResult.duplicateCheck.hasDuplicates) {
			this.logger.warn(
				`Дубликаты обнаружены и не пропущены: ${validationResult.duplicateCheck.duplicates.join(", ")}`,
			);
			throw new BadRequestException(
				`Обнаружены дубликаты: ${validationResult.duplicateCheck.duplicates.join(", ")}`,
			);
		}
		if (skipDuplicateCheck && validationResult.duplicateCheck.hasDuplicates) {
			this.logger.warn(
				`Дубликаты обнаружены, но пропущены по флагу skipDuplicateCheck: ${validationResult.duplicateCheck.duplicates.join(", ")}`,
			);
		}

		// Проверка зависимостей для модифицированных витрин
		const modifiedEntities = (processedData.entities || []).filter(
			(entity: any) => entity.modified === true,
		);

		if (modifiedEntities.length > 0) {
			const processId =
				await this.processHandlingService.getProcessIdFromData(processedData);
			const safetyCheck = await this.conflictService.isSafeToUpdate(
				modifiedEntities.map((e: any) => e.id),
				processId,
			);

			if (!safetyCheck.safe) {
				this.logger.warn(
					`Обнаружены потенциальные конфликты: ${safetyCheck.warnings.join("; ")}`,
				);
				// Конфликты не блокируют импорт, только предупреждаем
			}
		}
	}

	private async executeImportTransaction(
		processedData: any,
		user: string,
		changeName: string,
		importId: string,
		checkCancelled?: () => void,
		onStepProgress?: (step: string) => void,
	): Promise<ImportResult> {
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();

		const importStartTime = Date.now();

		try {
			await queryRunner.startTransaction();

			this.logger.debug("Начало транзакции импорта", {
				user,
				changeName,
				importId,
				transactionStart: new Date().toISOString(),
			});

			const importStats = await this.processImportData(
				processedData,
				user,
				changeName,
				queryRunner,
				importId,
				checkCancelled,
				onStepProgress,
			);
			await queryRunner.commitTransaction();

			const transactionDuration = Date.now() - importStartTime;

			this.logger.debug("Транзакция импорта успешно завершена", {
				duration: transactionDuration,
				changeId: importStats.changeId,
				importId,
			});

			// Очищаем кэши после успешного импорта
			const cacheStartTime = Date.now();
			this.logger.debug("Начало очистки кэшей после импорта");

			await this.cacheService.invalidateAllCaches();
			this.graphIndexService.invalidate();

			const cacheDuration = Date.now() - cacheStartTime;
			this.logger.debug("Кэши успешно очищены", {
				cacheDuration,
				operation: "invalidate_all_caches",
			});

			const totalDuration = Date.now() - importStartTime;

			this.logger.log(
				`[importId=${importId}] Импорт успешно завершен за ${totalDuration}ms`,
				{
					success: true,
					changeId: importStats.changeId,
					user,
					changeName,
					importId,
					totalDuration,
					transactionDuration,
					cacheDuration,
					stats: importStats.stats,
					warningsCount: importStats.warnings.length,
					timestamp: new Date().toISOString(),
				},
			);

			return {
				success: true,
				changeId: importStats.changeId,
				message: "JSON данные успешно импортированы в БД DL",
				warnings: importStats.warnings,
				stats: importStats.stats,
			};
		} catch (error) {
			await queryRunner.rollbackTransaction();
			const context = this.getImportErrorContext(error);
			const pg = this.getPostgresErrorInfo(error);
			const totalDuration = Date.now() - importStartTime;

			this.logger.error(
				`[importId=${importId}] Ошибка импорта${context ? ` (step=${context})` : ""}: ${error?.message}`,
				{
					error: error?.message,
					stack: error?.stack,
					user,
					changeName,
					importId,
					duration: totalDuration,
					timestamp: new Date().toISOString(),
				},
			);

			if (pg) {
				this.logger.error(
					`[importId=${importId}] DB error details: ${JSON.stringify(pg)}`,
				);
			}
			throw error;
		} finally {
			await queryRunner.release();
			this.logger.debug("Транзакция импорта завершена, queryRunner освобожден");
		}
	}

	private async processImportData(
		processedData: any,
		user: string,
		changeName: string,
		queryRunner: QueryRunner,
		importId: string,
		checkCancelled?: () => void,
		onStepProgress?: (step: string) => void,
	): Promise<{
		changeId: number;
		warnings: string[];
		stats: ImportResult["stats"];
	}> {
		const warnings: string[] = [];

		// Добавляем предупреждения из валидации
		if (processedData.validation?.warnings?.length > 0) {
			warnings.push(...processedData.validation.warnings);
		}

		// Добавляем предупреждения о отсутствующих source entities
		if (processedData.integrity?.issues?.length > 0) {
			const missingSourceWarnings = processedData.integrity.issues.filter(
				(issue) =>
					issue.includes("source entity не найдена") ||
					issue.includes("target entity не найдена"),
			);
			warnings.push(...missingSourceWarnings);
		}

		// Шаг 1: Создание записи в таблице changes
		const changeId = await this.withImportStep(
			importId,
			"createChangeRecord",
			async () => {
				return await this.changeRecordService.createChangeRecord(
					processedData,
					user,
					changeName,
					queryRunner,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		this.logger.log(
			`[importId=${importId}] Создана запись изменения с ID: ${changeId}`,
		);

		// Шаг 2: Обработка процесса с передачей entities и mappings для точной очистки связей
		this.logger.debug(
			`Desc перед handleProcess: ${JSON.stringify(processedData.desc)}`,
		);
		const process = await this.withImportStep(
			importId,
			"handleProcess",
			async () => {
				return await this.processHandlingService.handleProcess(
					processedData.desc,
					processedData.entities || [],
					processedData.mappings || [],
					changeId,
					queryRunner,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		this.logger.log(
			`[importId=${importId}] Обработан процесс: ${process.name} (ID: ${process.process_id})`,
		);

		// Шаг 3: Обработка сущностей и создание entity_map для целевых сущностей
		const entitiesStats = await this.withImportStep(
			importId,
			"handleEntities",
			async () => {
				return await this.entityProcessingService.handleEntities(
					processedData.entities,
					process.process_id,
					changeId,
					queryRunner,
					checkCancelled,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		this.logger.log(
			`[importId=${importId}] Обработано сущностей: ${entitiesStats.count}, атрибутов: ${entitiesStats.attributesCount}`,
		);

		// Шаг 4: Обработка маппингов
		const mappingsResult = await this.withImportStep(
			importId,
			"handleMappings",
			async () => {
				return await this.mappingProcessingService.handleMappings(
					processedData.mappings,
					process.process_id,
					changeId,
					queryRunner,
					checkCancelled,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		const mappingsStats = { count: mappingsResult.count };
		warnings.push(...mappingsResult.warnings);

		// Шаг 5: Обработка неудачных маппингов (для DAPP JSON)
		const failedMappingsStats = await this.withImportStep(
			importId,
			"handleFailedMappings",
			async () => {
				return await this.mappingProcessingService.handleFailedMappings(
					processedData.failedMappings || [],
					changeId,
					queryRunner,
					checkCancelled,
				);
			},
			checkCancelled,
			onStepProgress,
		);

		if (failedMappingsStats.count > 0) {
			this.logger.log(
				`[importId=${importId}] Обработано неудачных маппингов: ${failedMappingsStats.count}`,
			);
			warnings.push(
				`Обнаружено ${failedMappingsStats.count} неудачных маппингов`,
			);
		}

		return {
			changeId,
			warnings,
			stats: {
				entitiesProcessed: entitiesStats.count,
				attributesProcessed: entitiesStats.attributesCount,
				mappingsProcessed: mappingsStats.count,
				failedMappingsProcessed: failedMappingsStats.count,
			},
		};
	}

	private async withImportStep<T>(
		importId: string,
		step: string,
		fn: () => Promise<T>,
		checkCancelled?: () => void,
		onStepProgress?: (step: string) => void,
	): Promise<T> {
		try {
			checkCancelled?.();
			onStepProgress?.(step);
			this.logger.log(`[importId=${importId}] step:start ${step}`);
			const res = await fn();
			checkCancelled?.();
			this.logger.log(`[importId=${importId}] step:done ${step}`);
			return res;
		} catch (error) {
			(error as any).__importStep = step;
			this.logger.error(
				`[importId=${importId}] step:fail ${step}: ${error?.message}`,
				error?.stack,
			);
			throw error;
		}
	}

	private getImportErrorContext(error: any): string | null {
		return error?.__importStep || error?.driverError?.__importStep || null;
	}

	private getPostgresErrorInfo(error: any): {
		code?: string;
		constraint?: string;
		table?: string;
		schema?: string;
		detail?: string;
		message?: string;
	} | null {
		const driverError = error?.driverError || error;
		const code = driverError?.code;

		if (!code) return null;

		return {
			code,
			constraint: driverError?.constraint,
			table: driverError?.table,
			schema: driverError?.schema,
			detail: driverError?.detail,
			message: driverError?.message,
		};
	}
}
