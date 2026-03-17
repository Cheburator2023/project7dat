import {
	Injectable,
	Logger,
	BadRequestException,
	ConflictException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { JsonImportRequestDto } from "../dto";
import { JsonValidationOrchestratorService } from "./json-validation-orchestrator.service";
import { JsonConflictService } from "./json-conflict.service";
import { JsonMigrationService } from "./json-migration.service";
import { JsonApplyService } from "./json-apply.service";

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
		private readonly validationOrchestrator: JsonValidationOrchestratorService,
		private readonly conflictService: JsonConflictService,
		private readonly migrationService: JsonMigrationService,
		private readonly jsonApplyService: JsonApplyService,
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
			skipStructureValidation,
			skipValidation,
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

		let processedData: any;

		if (skipValidation) {
			// Merge flow: валидация уже выполнена в applyMerge, пропускаем
			this.logger.log("Валидация пропущена (skipValidation)");
			processedData = data;
		} else {
			// Валидация и предобработка данных с учётом флагов
			processedData = await this.validateAndPreprocessData(data, validated, {
				allowExistingCycles: effectiveAllowExistingCycles,
				skipDuplicateCheck: effectiveSkipDuplicateCheck,
				skipStructureValidation,
			});
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
		}
		checkCancelled?.();

		// Выполнение импорта в транзакции через JsonApplyService
		const result = await this.jsonApplyService.applyDataInTransaction({
			data: processedData,
			user,
			changeName,
			operationId: importId,
			checkCancelled,
			onStepProgress,
		});

		return {
			success: true,
			changeId: result.changeId,
			message: "JSON данные успешно импортированы в БД DL",
			warnings: result.warnings,
			stats: result.stats,
		};
	}

	private async validateAndPreprocessData(
		data: any,
		validated: boolean,
		options?: {
			allowExistingCycles?: boolean;
			skipDuplicateCheck?: boolean;
			skipStructureValidation?: boolean;
		},
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
		options?: {
			allowExistingCycles?: boolean;
			skipDuplicateCheck?: boolean;
			skipStructureValidation?: boolean;
		},
	): boolean {
		// Критические ошибки структуры
		if (
			!options?.skipStructureValidation &&
			validationResult.validation.errors.length > 0
		) {
			this.logger.warn(
				`Критические ошибки структуры: ${validationResult.validation.errors.length}`,
				{ errors: validationResult.validation.errors.slice(0, 20) },
			);
			return true;
		}

		if (
			options?.skipStructureValidation &&
			validationResult.validation.errors.length > 0
		) {
			this.logger.warn(
				`Пропущены ошибки структуры (skipStructureValidation): ${validationResult.validation.errors.length}`,
				{ errors: validationResult.validation.errors.slice(0, 10) },
			);
		}

		// Проблемы целостности, связанные с отсутствием source/target entities и атрибутов, не являются критическими
		const criticalIntegrityIssues = validationResult.integrity.issues.filter(
			(issue) =>
				!issue.includes("source entity не найдена") &&
				!issue.includes("target entity не найдена") &&
				!issue.includes("target атрибут не найден") &&
				!issue.includes("source атрибут не найден"),
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
		// Проверка зависимостей для модифицированных витрин перенесена в JsonApplyService
	}
}
