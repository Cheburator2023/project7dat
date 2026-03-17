import { Injectable, Logger } from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { ChangeRecordService } from "./change-record.service";
import { ProcessHandlingService } from "./process-handling.service";
import { EntityProcessingService } from "./entity-processing.service";
import { MappingProcessingService } from "./mapping-processing.service";
import { CacheService } from "./cache.service";
import { GraphIndexService } from "./graph-index.service";

export interface ApplyDataOptions {
	data: any;
	user: string;
	changeName: string;
	operationId: string;
	checkCancelled?: () => void;
	onStepProgress?: (step: string) => void;
}

export interface ApplyDataResult {
	changeId: number;
	warnings: string[];
	stats: {
		entitiesProcessed: number;
		attributesProcessed: number;
		mappingsProcessed: number;
		failedMappingsProcessed: number;
	};
}

@Injectable()
export class JsonApplyService {
	private readonly logger = new Logger(JsonApplyService.name);

	constructor(
		private readonly dataSource: DataSource,
		private readonly changeRecordService: ChangeRecordService,
		private readonly processHandlingService: ProcessHandlingService,
		private readonly entityProcessingService: EntityProcessingService,
		private readonly mappingProcessingService: MappingProcessingService,
		private readonly cacheService: CacheService,
		private readonly graphIndexService: GraphIndexService,
	) {}

	async applyDataInTransaction(
		options: ApplyDataOptions,
	): Promise<ApplyDataResult> {
		const {
			data,
			user,
			changeName,
			operationId,
			checkCancelled,
			onStepProgress,
		} = options;

		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();

		const startTime = Date.now();

		try {
			await queryRunner.startTransaction();

			this.logger.debug("Начало транзакции apply", {
				user,
				changeName,
				operationId,
				transactionStart: new Date().toISOString(),
			});

			const result = await this.processApplyData(
				data,
				user,
				changeName,
				queryRunner,
				operationId,
				checkCancelled,
				onStepProgress,
			);

			await queryRunner.commitTransaction();

			const transactionDuration = Date.now() - startTime;

			this.logger.debug("Транзакция apply успешно завершена", {
				duration: transactionDuration,
				changeId: result.changeId,
				operationId,
			});

			// Очищаем кэши после успешного apply
			const cacheStartTime = Date.now();
			this.logger.debug("Начало очистки кэшей после apply");

			await this.cacheService.invalidateAllCaches();
			this.graphIndexService.invalidate();

			const cacheDuration = Date.now() - cacheStartTime;
			this.logger.debug("Кэши успешно очищены", {
				cacheDuration,
				operation: "invalidate_all_caches",
			});

			const totalDuration = Date.now() - startTime;

			this.logger.log(
				`[operationId=${operationId}] Apply успешно завершен за ${totalDuration}ms`,
				{
					changeId: result.changeId,
					user,
					changeName,
					operationId,
					totalDuration,
					transactionDuration,
					cacheDuration,
					stats: result.stats,
					warningsCount: result.warnings.length,
					timestamp: new Date().toISOString(),
				},
			);

			return result;
		} catch (error) {
			await queryRunner.rollbackTransaction();
			const context = this.getApplyErrorContext(error);
			const totalDuration = Date.now() - startTime;

			this.logger.error(
				`[operationId=${operationId}] Ошибка apply${context ? ` (step=${context})` : ""}: ${error?.message}`,
				{
					error: error?.message,
					stack: error?.stack,
					user,
					changeName,
					operationId,
					duration: totalDuration,
					timestamp: new Date().toISOString(),
				},
			);

			throw error;
		} finally {
			await queryRunner.release();
			this.logger.debug("Транзакция apply завершена, queryRunner освобожден");
		}
	}

	private async processApplyData(
		data: any,
		user: string,
		changeName: string,
		queryRunner: QueryRunner,
		operationId: string,
		checkCancelled?: () => void,
		onStepProgress?: (step: string) => void,
	): Promise<ApplyDataResult> {
		const warnings: string[] = [];

		// Добавляем предупреждения из валидации (если есть)
		if (data.validation?.warnings?.length > 0) {
			warnings.push(...data.validation.warnings);
		}

		// Добавляем предупреждения о отсутствующих source entities
		if (data.integrity?.issues?.length > 0) {
			const missingSourceWarnings = data.integrity.issues.filter(
				(issue) =>
					issue.includes("source entity не найдена") ||
					issue.includes("target entity не найдена"),
			);
			warnings.push(...missingSourceWarnings);
		}

		// Шаг 1: Создание записи в таблице changes
		const changeId = await this.withApplyStep(
			operationId,
			"createChangeRecord",
			async () => {
				return await this.changeRecordService.createChangeRecord(
					data,
					user,
					changeName,
					queryRunner,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		this.logger.log(
			`[operationId=${operationId}] Создана запись изменения с ID: ${changeId}`,
		);

		// Шаг 2: Обработка процесса
		this.logger.debug(`Desc перед handleProcess: ${JSON.stringify(data.desc)}`);
		const process = await this.withApplyStep(
			operationId,
			"handleProcess",
			async () => {
				return await this.processHandlingService.handleProcess(
					data.desc,
					data.entities || [],
					data.mappings || [],
					changeId,
					queryRunner,
				);
			},
			checkCancelled,
			onStepProgress,
		);
		this.logger.log(
			`[operationId=${operationId}] Обработан процесс: ${process.name} (ID: ${process.process_id})`,
		);

		// Шаг 3: Обработка сущностей
		const entitiesStats = await this.withApplyStep(
			operationId,
			"handleEntities",
			async () => {
				return await this.entityProcessingService.handleEntities(
					data.entities,
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
			`[operationId=${operationId}] Обработано сущностей: ${entitiesStats.count}, атрибутов: ${entitiesStats.attributesCount}`,
		);

		// Шаг 4: Обработка маппингов
		const mappingsResult = await this.withApplyStep(
			operationId,
			"handleMappings",
			async () => {
				return await this.mappingProcessingService.handleMappings(
					data.mappings,
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

		// Шаг 5: Обработка неудачных маппингов
		const failedMappingsStats = await this.withApplyStep(
			operationId,
			"handleFailedMappings",
			async () => {
				return await this.mappingProcessingService.handleFailedMappings(
					data.failedMappings || [],
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
				`[operationId=${operationId}] Обработано неудачных маппингов: ${failedMappingsStats.count}`,
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

	private async withApplyStep<T>(
		operationId: string,
		step: string,
		fn: () => Promise<T>,
		checkCancelled?: () => void,
		onStepProgress?: (step: string) => void,
	): Promise<T> {
		try {
			checkCancelled?.();
			onStepProgress?.(step);
			this.logger.log(`[operationId=${operationId}] step:start ${step}`);
			const res = await fn();
			checkCancelled?.();
			this.logger.log(`[operationId=${operationId}] step:done ${step}`);
			return res;
		} catch (error) {
			(error as any).__applyStep = step;
			this.logger.error(
				`[operationId=${operationId}] step:fail ${step}: ${error?.message}`,
				error?.stack,
			);
			throw error;
		}
	}

	private getApplyErrorContext(error: any): string | null {
		return (
			error?.__applyStep ||
			error?.__importStep ||
			error?.driverError?.__applyStep ||
			null
		);
	}
}
