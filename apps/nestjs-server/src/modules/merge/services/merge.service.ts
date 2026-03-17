import {
	Injectable,
	Logger,
	NotFoundException,
	BadRequestException,
	OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { S2tCommitEntity } from "../../json-data/entities/s2t-commit.entity";
import { JsonExportService } from "../../json-data/services/json-export.service";
import { JsonApplyService } from "../../json-data/services/json-apply.service";
import { SnapshotService } from "../../snapshots/services/snapshot.service";
import { DiffService } from "../../json-data/services/diff.service";
import { JsonStructureValidator } from "../../json-data/services/interfaces/validation.interfaces";
import { JsonValidationOrchestratorService } from "../../json-data/services/json-validation-orchestrator.service";
import { JsonExportResponseDto } from "../../json-data/dto";
import { ApplyMergeResponseDto, MergeDiffDto } from "../dto/merge-response.dto";
import { MergeSessionEntity } from "../entities/merge-session.entity";
import { DeduplicationService } from "src/modules/merge/services/deduplication.service";

interface MergeSessionPayload {
	mergedJson: JsonExportResponseDto;
	hadExistingCycles: boolean;
}

interface MergeSessionStatusState {
	mergeSessionId: string;
	commitId: string;
	commitName: string;
	status: "merging" | "deduplicating" | "done" | "failed";
	operation: "merge" | "deduplication";
	progress: number;
	stage: string;
	startedAt: string;
	estimatedSecondsLeft: number | null;
	snapshotId: string | null;
	errorMessage: string | null;
}

@Injectable()
export class MergeService implements OnModuleInit {
	private readonly logger = new Logger(MergeService.name);
	private readonly sessionPayloadCache = new Map<string, MergeSessionPayload>();
	private readonly sessionStatusCache = new Map<
		string,
		MergeSessionStatusState
	>();
	private readonly cancelRequestedSessions = new Set<string>();

	constructor(
		@InjectRepository(S2tCommitEntity)
		private readonly s2tCommitRepository: Repository<S2tCommitEntity>,
		@InjectRepository(MergeSessionEntity)
		private readonly mergeSessionRepository: Repository<MergeSessionEntity>,
		private readonly jsonExportService: JsonExportService,
		private readonly snapshotService: SnapshotService,
		private readonly diffService: DiffService,
		private readonly structureValidator: JsonStructureValidator,
		private readonly validationOrchestrator: JsonValidationOrchestratorService,
		private readonly jsonApplyService: JsonApplyService,
		private readonly deduplicationService: DeduplicationService,
	) {}

	async onModuleInit(): Promise<void> {
		await this.failStaleMergingCommitsOnStartup();
	}

	private inferSessionOperation(
		mergeStatus?: MergeSessionEntity["merge_status"],
		stage?: string | null,
		fallback: "merge" | "deduplication" = "merge",
	): "merge" | "deduplication" {
		if (mergeStatus === "deduplicating") {
			return "deduplication";
		}
		if (mergeStatus === "merging") {
			return "merge";
		}
		const normalizedStage = (stage || "").toLowerCase();
		if (normalizedStage.includes("дедуп")) {
			return "deduplication";
		}
		return fallback;
	}

	private toMergeSessionStatusDto(
		session: MergeSessionEntity,
	): MergeSessionStatusState {
		const status =
			session.merge_status === "pending" ? "merging" : session.merge_status;
		return {
			mergeSessionId: session.id,
			commitId: session.commit_id,
			commitName: session.commit_name,
			status,
			operation: this.inferSessionOperation(
				session.merge_status,
				session.stage,
			),
			progress: session.progress,
			stage: session.stage,
			startedAt:
				session.started_at?.toISOString() ?? session.created_at.toISOString(),
			estimatedSecondsLeft: session.estimated_seconds_left ?? null,
			snapshotId: session.snapshot_id,
			errorMessage: session.error_message,
		};
	}

	private cacheMergeSessionStatus(
		sessionId: string,
		patch: Partial<MergeSessionStatusState>,
	): void {
		const current = this.sessionStatusCache.get(sessionId);
		if (!current) {
			return;
		}
		this.sessionStatusCache.set(sessionId, {
			...current,
			...patch,
		});
	}

	private async updateMergeSession(
		sessionId: string,
		patch: Partial<MergeSessionEntity>,
		cacheOnly = false,
	): Promise<void> {
		if (!cacheOnly) {
			await this.mergeSessionRepository.update(sessionId, {
				...patch,
				updated_at: new Date(),
			});
		}
		const cached = this.sessionStatusCache.get(sessionId);
		this.cacheMergeSessionStatus(sessionId, {
			status:
				patch.merge_status === undefined || patch.merge_status === "pending"
					? undefined
					: patch.merge_status,
			operation: this.inferSessionOperation(
				patch.merge_status,
				patch.stage,
				cached?.operation,
			),
			progress: patch.progress,
			stage: patch.stage,
			startedAt: patch.started_at?.toISOString(),
			estimatedSecondsLeft: patch.estimated_seconds_left,
			snapshotId: patch.snapshot_id,
			errorMessage: patch.error_message,
		});
	}

	/**
	 * Применить коммит к текущей модели данных
	 * @param commitId - идентификатор пользовательской версии коммита
	 * @returns сессия слияния с результатом
	 */
	async applyMerge(commitId: string): Promise<ApplyMergeResponseDto> {
		this.logger.log(`Запуск слияния для коммита: ${commitId}`);

		// 1. Получаем коммит из s2t_commits
		const commit = await this.s2tCommitRepository.findOne({
			where: { id: commitId },
		});
		if (!commit) {
			throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
		}
		if (commit.state !== "processing") {
			throw new BadRequestException(
				`Коммит должен быть в статусе 'processing', текущий статус: ${commit.state}`,
			);
		}
		if (!commit.payload) {
			throw new BadRequestException("Коммит не содержит JSON данных");
		}

		// 2. Получаем текущую модель данных из РБД
		const currentModel = await this.jsonExportService.exportToJson();

		// 3. Проверяем рекурсию в текущей модели
		const recursionCurrent = this.structureValidator.checkForRecursion(
			currentModel.entities,
			currentModel.mappings,
		);
		const hadExistingCycles = recursionCurrent.hasRecursion; // ЗАПОМИНАЕМ

		if (hadExistingCycles) {
			this.logger.warn(
				`Текущая модель уже содержит ${recursionCurrent.cycles.length} циклических зависимостей. ` +
					`Слияние будет выполнено, но после него циклы могут остаться.`,
			);
		}

		// 4. Определяем тип коммита
		const commitPayload = commit.payload as any;
		const commitType = commitPayload.desc?.commit_type || commit.type;

		// 5. Выполняем слияние
		const mergedModel = this.performMerge(
			currentModel,
			commitPayload,
			commitType,
		);

		// 6. Проверяем дубликаты в смерженной модели относительно исходной (не блокируем — информируем)
		const duplicateCheckResult = this.checkDuplicatesAfterMerge(
			currentModel,
			mergedModel,
		);
		if (!duplicateCheckResult.allowed) {
			this.logger.warn(
				`Коммит создаёт новые дубликаты сущностей: ${duplicateCheckResult.newDuplicates.join(", ")}. Потребуется дедупликация.`,
			);
		}
		if (duplicateCheckResult.existingDuplicates.length > 0) {
			this.logger.warn(
				`В исходной модели уже есть дубликаты (${duplicateCheckResult.existingDuplicates.length}), они будут сохранены.`,
			);
		}

		// 7. Комплексная валидация merged JSON — обёрнута в try-catch, чтобы НИКОГДА не блокировать apply
		const validationWarnings: string[] = [];
		try {
			const mergedJsonForValidation = {
				...mergedModel,
				desc: { ...mergedModel.desc, schemaVersion: "2.0" },
				failedMappings: (mergedModel as any).failedMappings || [],
			};
			const validationResult = await this.validationOrchestrator.validate(
				mergedJsonForValidation,
			);

			this.logger.log("Результат валидации merged JSON", {
				structureErrors: validationResult.validation.errors.length,
				integrityIssues: validationResult.integrity.issues.length,
				recursion: validationResult.recursionCheck.hasRecursion,
				duplicates: validationResult.duplicateCheck.duplicates.length,
			});

			if (!validationResult.schemaVersion.supported) {
				validationWarnings.push(
					`Неподдерживаемая версия схемы: ${validationResult.schemaVersion.version}`,
				);
			}
			if (validationResult.validation.errors.length > 0) {
				validationWarnings.push(
					`Структурные ошибки: ${validationResult.validation.errors.length}`,
				);
			}
			if (validationResult.recursionCheck.hasRecursion && !hadExistingCycles) {
				validationWarnings.push(
					`Новые рекурсивные зависимости: ${validationResult.recursionCheck.cycles.length}`,
				);
			}
			console.log(
				"🐸 Pepe said >> MergeService >> applyMerge >> validationResult:",
				validationResult,
			);

			if (validationResult.duplicateCheck.hasDuplicates) {
				validationWarnings.push(
					`Дубликаты сущностей в JSON: ${validationResult.duplicateCheck.duplicates.length}`,
				);
			}
		} catch (validationError) {
			const msg =
				validationError instanceof Error
					? validationError.message
					: String(validationError);
			this.logger.error(
				`Ошибка при валидации merged JSON (не блокирует apply): ${msg}`,
			);
			validationWarnings.push(`Валидация не завершена: ${msg}`);
		}

		// 9. Вычисляем diff и фильтруем ложные "removed"
		// DiffService сравнивает массивы позиционно (по индексам), поэтому
		// при merge (который только добавляет/изменяет) появляются ложные removed.
		const rawDiff = this.diffService.computeDiff(currentModel, mergedModel);
		const diff = rawDiff.filter((d) => d.type !== "removed");

		// 10. Создаём сессию (лёгкие метаданные — в БД, тяжёлые JSON — в памяти)
		const mergeSessionId = uuidv4();
		const mergeSession = this.mergeSessionRepository.create({
			id: mergeSessionId,
			commit_id: commitId,
			commit_name: commit.commit_name || commitId.slice(0, 8),
			had_existing_cycles: hadExistingCycles,
			merge_status: "pending",
			progress: 0,
			stage: "Ожидание подтверждения",
			started_at: null,
			snapshot_id: null,
			error_message: null,
			estimated_seconds_left: null,
			cancel_requested: false,
		});
		await this.mergeSessionRepository.save(mergeSession);
		this.sessionStatusCache.set(
			mergeSessionId,
			this.toMergeSessionStatusDto(mergeSession),
		);

		this.sessionPayloadCache.set(mergeSessionId, {
			mergedJson: mergedModel,
			hadExistingCycles,
		});

		// 11. Подсчёт статистики
		const stats = this.calculateChangeStats(diff);

		this.logger.log(`Слияние применено, сессия: ${mergeSessionId}`);

		// 12. Проверяем дубликаты в БД (full_name + system_code)
		const dbDuplicates = await this.deduplicationService.checkDuplicatesInDb();
		if (dbDuplicates.hasDuplicates) {
			this.logger.warn(
				`Обнаружены дубликаты в БД: ${dbDuplicates.count} дубликатов в ${dbDuplicates.groups.length} группах. Требуется дедупликация.`,
			);
		}

		return {
			mergeSessionId,
			mergedJson: mergedModel,
			diff,
			changedEntitiesCount: stats.entities,
			changedAttributesCount: stats.attributes,
			changedMappingsCount: stats.mappings,
			hasDuplicates: dbDuplicates.hasDuplicates,
			duplicatesCount: dbDuplicates.count,
			validationWarnings,
		};
	}

	/**
	 * Основная логика слияния.
	 * Вместо JSON.parse(JSON.stringify) используем shallow copy:
	 * - массивы entities/mappings копируются поверхностно
	 * - элементы клонируются только при мутации (copy-on-write)
	 */
	private performMerge(
		currentModel: JsonExportResponseDto,
		commitJson: any,
		commitType: string,
	): JsonExportResponseDto {
		const merged: JsonExportResponseDto = {
			desc: { ...currentModel.desc },
			entities: currentModel.entities.map((e) => ({
				...e,
				attrSeq: [...e.attrSeq],
			})),
			mappings: currentModel.mappings.map((m) => ({
				...m,
				deps: m.deps.map((d) => ({ ...d })),
			})),
		};

		// --- Копируем информацию о процессе и типе коммита из коммита ---
		if (commitJson.desc) {
			// process  имя процесса (обязательно для table/model)
			if (commitJson.desc.process) {
				merged.desc.process = commitJson.desc.process;
			}
			// description  описание процесса (опционально)
			if (commitJson.desc.description) {
				merged.desc.description = commitJson.desc.description;
			}
			// commit_type  тип коммита (table/json/model)
			if (commitJson.desc.commit_type) {
				merged.desc.commit_type = commitJson.desc.commit_type;
			}
		}

		// 1. Обработка сущностей (для всех типов коммитов)
		this.mergeEntities(merged, commitJson.entities || []);

		// 2. Обработка маппингов (только для table и model)
		if (commitType === "table" || commitType === "model") {
			this.mergeMappings(merged, commitJson.mappings || []);
		}
		// Для json-коммита маппинги игнорируются

		// 3. Обновляем дату изменения (текущее время)
		merged.desc.change_date = new Date().toISOString();

		return merged;
	}

	/**
	 * Слияние сущностей:
	 * - Для каждой сущности из коммита ищем в основе по id (включает system_code)
	 * - Если найдена: добавляем только новые атрибуты из коммита в attrSeq
	 * - Если не найдена: добавляем всю сущность из коммита
	 * Используем Map для O(1) поиска вместо findIndex O(n)
	 */
	private mergeEntities(
		merged: JsonExportResponseDto,
		commitEntities: any[],
	): void {
		const entityIndexMap = new Map<string, number>(
			merged.entities.map((e, idx) => [e.id, idx]),
		);

		for (const commitEntity of commitEntities) {
			const existingIndex = entityIndexMap.get(commitEntity.id);

			if (existingIndex !== undefined) {
				// Сущность уже есть  добавляем новые атрибуты
				const existingAttrs = new Set(
					merged.entities[existingIndex].attrSeq.map((a) =>
						a.name.toLowerCase(),
					),
				);
				const newAttrs = (commitEntity.attrSeq || []).filter(
					(a) => !existingAttrs.has(a.name.toLowerCase()),
				);

				if (newAttrs.length > 0) {
					merged.entities[existingIndex].attrSeq.push(...newAttrs);
					this.logger.debug(
						`Добавлено ${newAttrs.length} новых атрибутов к сущности ${commitEntity.id}`,
					);
				}
			} else {
				// Новой сущности нет  добавляем полностью
				merged.entities.push(commitEntity);
				entityIndexMap.set(commitEntity.id, merged.entities.length - 1);
				this.logger.debug(`Добавлена новая сущность ${commitEntity.id}`);
			}
		}
	}

	/**
	 * Слияние маппингов:
	 * - Для каждого mapping из коммита ищем в основе по entityId
	 * - Если не найден  добавляем весь mapping
	 * - Если найден:
	 *   - Для каждого deps из коммита ищем в основе deps с таким же source_entity_id и process_id
	 *   - Если найден  заменяем этот deps (attrMaps и atrDeps) новым из коммита
	 *   - Если не найден  добавляем новый deps
	 * Используем Map для O(1) поиска вместо findIndex O(n)
	 */
	private mergeMappings(
		merged: JsonExportResponseDto,
		commitMappings: any[],
	): void {
		const mappingIndexMap = new Map<string, number>(
			merged.mappings.map((m, idx) => [m.entityId, idx]),
		);

		for (const commitMapping of commitMappings) {
			const existingMappingIndex = mappingIndexMap.get(commitMapping.entityId);

			if (existingMappingIndex === undefined) {
				// Маппинг для данной цели отсутствует  добавляем целиком
				merged.mappings.push(commitMapping);
				mappingIndexMap.set(commitMapping.entityId, merged.mappings.length - 1);
				continue;
			}

			const existingMapping = merged.mappings[existingMappingIndex];

			// Map для быстрого поиска deps по ключу entityId:process_id
			const depsMap = new Map<string, number>(
				existingMapping.deps.map((d, idx) => [
					`${d.entityId}:${d.process_id}`,
					idx,
				]),
			);

			// Для каждого deps из коммита
			for (const commitDep of commitMapping.deps || []) {
				const depKey = `${commitDep.entityId}:${commitDep.process_id}`;
				const existingDepIndex = depsMap.get(depKey);

				if (existingDepIndex !== undefined) {
					// Заменяем существующий deps новым из коммита
					existingMapping.deps[existingDepIndex] = { ...commitDep };
				} else {
					// Добавляем новый deps
					existingMapping.deps.push({ ...commitDep });
					depsMap.set(depKey, existingMapping.deps.length - 1);
				}
			}
			// Сортируем deps по process_id
			existingMapping.deps.sort(
				(a, b) => (a.process_id ?? 0) - (b.process_id ?? 0),
			);
		}
	}

	private calculateChangeStats(diff: MergeDiffDto[]): {
		entities: number;
		attributes: number;
		mappings: number;
	} {
		let entities = 0;
		let attributes = 0;
		let mappings = 0;

		for (const change of diff) {
			if (change.path.startsWith("/entities")) {
				entities++;
			} else if (change.path.startsWith("/attributes")) {
				attributes++;
			} else if (change.path.startsWith("/mappings")) {
				mappings++;
			}
		}

		return { entities, attributes, mappings };
	}

	async startDeduplication(
		commitId: string,
	): Promise<{ success: boolean; mergeSessionId: string; message: string }> {
		this.logger.log(`Запуск дедупликации для коммита: ${commitId}`);

		const commit = await this.s2tCommitRepository.findOne({
			where: { id: commitId },
		});
		if (!commit) {
			throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
		}

		const latestSession = await this.mergeSessionRepository.findOne({
			where: { commit_id: commitId },
			order: { created_at: "DESC" },
		});

		if (latestSession?.merge_status === "merging") {
			throw new BadRequestException(
				"Нельзя запускать дедупликацию во время активного слияния",
			);
		}

		if (latestSession?.merge_status === "deduplicating") {
			return {
				success: true,
				mergeSessionId: latestSession.id,
				message: "Дедупликация уже выполняется",
			};
		}

		const dbDuplicates = await this.deduplicationService.checkDuplicatesInDb();
		if (!dbDuplicates.hasDuplicates) {
			return {
				success: true,
				mergeSessionId: "",
				message: "Дубликаты не найдены",
			};
		}

		const mergeSessionId = uuidv4();
		const mergeSession = this.mergeSessionRepository.create({
			id: mergeSessionId,
			commit_id: commitId,
			commit_name: commit.commit_name || commitId.slice(0, 8),
			had_existing_cycles: false,
			merge_status: "deduplicating",
			progress: 0,
			stage: "Запуск дедупликации",
			started_at: new Date(),
			snapshot_id: null,
			error_message: null,
			estimated_seconds_left: null,
			cancel_requested: false,
		});
		await this.mergeSessionRepository.save(mergeSession);
		this.sessionStatusCache.set(
			mergeSessionId,
			this.toMergeSessionStatusDto(mergeSession),
		);

		await this.updateCommitStateById(commitId, "deduplicating");

		this.runDeduplicationAsync(mergeSessionId, commitId).catch((err) => {
			this.logger.error(
				`Фоновая дедупликация провалилась: ${err.message}`,
				err.stack,
			);
		});

		return {
			success: true,
			mergeSessionId,
			message: "Дедупликация запущена в фоновом режиме",
		};
	}

	private async runDeduplicationAsync(
		sessionId: string,
		commitId: string,
	): Promise<void> {
		const session = await this.mergeSessionRepository.findOne({
			where: { id: sessionId },
		});
		if (!session) return;

		const startMs = Date.now();

		const updateProgress = async (progress: number, stage: string) => {
			const normalizedProgress = Math.min(progress, 99);
			const elapsed = Date.now() - startMs;
			let estimatedSecondsLeft: number | null = session.estimated_seconds_left;
			if (progress > 0) {
				const totalEstimated = (elapsed / progress) * 100;
				estimatedSecondsLeft = Math.max(
					0,
					Math.round((totalEstimated - elapsed) / 1000),
				);
			}
			await this.updateMergeSession(
				sessionId,
				{
					progress: normalizedProgress,
					stage,
					estimated_seconds_left: estimatedSecondsLeft,
				},
				true,
			);
		};

		const throwIfCancelled = () => {
			if (!this.cancelRequestedSessions.has(sessionId)) {
				return;
			}

			const error = new Error("Дедупликация отменена пользователем");
			(error as Error & { code?: string }).code = "DEDUPLICATION_CANCELLED";
			throw error;
		};

		try {
			await updateProgress(5, "Поиск дубликатов");
			throwIfCancelled();

			const result = await this.deduplicationService.deduplicateEntities({
				checkCancelled: throwIfCancelled,
				onProgress: async ({ progress, stage }) => {
					throwIfCancelled();
					await updateProgress(progress, stage);
				},
			});

			throwIfCancelled();

			if (!result.success) {
				throw new Error(
					result.errorMessage || "Дедупликация завершилась с ошибкой",
				);
			}

			await this.updateCommitState(commitId, {
				state: "processing",
				error: null,
			});

			await this.updateMergeSession(sessionId, {
				merge_status: "done",
				progress: 100,
				stage: `Дедупликация завершена: удалено ${result.removedCount}`,
				snapshot_id: null,
				error_message: null,
				estimated_seconds_left: 0,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Неизвестная ошибка";
			const cancelled = errorMessage === "Дедупликация отменена пользователем";

			await this.updateMergeSession(sessionId, {
				merge_status: "failed",
				progress: 0,
				stage: cancelled ? "Дедупликация отменена" : "Ошибка дедупликации",
				error_message: errorMessage,
				estimated_seconds_left: null,
			});

			await this.updateCommitState(commitId, {
				state: "processing",
				error: cancelled ? null : errorMessage,
			});

			this.logger.error(
				`Ошибка при фоновой дедупликации: ${errorMessage}`,
				error instanceof Error ? error.stack : undefined,
			);
		} finally {
			this.cancelRequestedSessions.delete(sessionId);
		}
	}

	async confirmMerge(
		commitId: string,
		user?: string,
	): Promise<{ success: boolean; mergeSessionId: string; message: string }> {
		this.logger.log(`Подтверждение слияния для коммита: ${commitId}`);

		const session = await this.mergeSessionRepository.findOne({
			where: { commit_id: commitId },
			order: { created_at: "DESC" },
		});

		if (!session) {
			this.logger.warn(`Сессия слияния для коммита ${commitId} не найдена`);
			return {
				success: false,
				mergeSessionId: "",
				message: `Сессия слияния для коммита ${commitId} не найдена. Повторите apply.`,
			};
		}

		if (session.merge_status === "merging") {
			return {
				success: true,
				mergeSessionId: session.id,
				message: "Слияние уже выполняется",
			};
		}

		if (session.merge_status === "deduplicating") {
			throw new BadRequestException(
				"Дождитесь завершения дедупликации перед подтверждением слияния",
			);
		}

		const dbDuplicates = await this.deduplicationService.checkDuplicatesInDb();
		if (dbDuplicates.hasDuplicates) {
			throw new BadRequestException(
				"Обнаружены дубликаты сущностей. Сначала выполните дедупликацию и затем повторите предпросмотр.",
			);
		}

		await this.updateMergeSession(session.id, {
			merge_status: "merging",
			progress: 0,
			stage: "Запуск слияния",
			started_at: new Date(),
			cancel_requested: false,
			error_message: null,
			estimated_seconds_left: null,
		});

		await this.updateCommitStateById(commitId, "merging");

		this.runMergeAsync(session.id, commitId, user).catch((err) => {
			this.logger.error(
				`Фоновое слияние провалилось: ${err.message}`,
				err.stack,
			);
		});

		return {
			success: true,
			mergeSessionId: session.id,
			message: "Слияние запущено в фоновом режиме",
		};
	}

	/**
	 * Фоновая задача слияния — выполняется после немедленного ответа клиенту
	 */
	private async runMergeAsync(
		sessionId: string,
		commitId: string,
		user?: string,
	): Promise<void> {
		const session = await this.mergeSessionRepository.findOne({
			where: { id: sessionId },
		});
		if (!session) return;

		const payload = this.sessionPayloadCache.get(sessionId);
		if (!payload) {
			this.logger.error(
				`In-memory payload для сессии ${sessionId} не найден (возможно, сервер был перезапущен)`,
			);
			await this.updateMergeSession(sessionId, {
				merge_status: "failed",
				progress: 0,
				stage: "Ошибка",
				error_message:
					"Данные сессии утеряны из-за перезапуска сервера. Повторите apply.",
			});
			await this.updateCommitState(commitId, {
				state: "failed",
				error:
					"Данные сессии утеряны из-за перезапуска сервера. Повторите apply.",
			});
			return;
		}

		// Извлекаем тяжёлые данные из кэша и сразу освобождаем кэш, чтобы GC мог собрать память во время импорта
		const mergedJson = payload.mergedJson;
		const hadExistingCycles = payload.hadExistingCycles;
		this.sessionPayloadCache.delete(sessionId);

		const startMs = Date.now();

		const updateProgress = async (progress: number, stage: string) => {
			const normalizedProgress = Math.min(progress, 99);
			const elapsed = Date.now() - startMs;
			let estimatedSecondsLeft: number | null = session.estimated_seconds_left;
			if (progress > 0) {
				const totalEstimated = (elapsed / progress) * 100;
				estimatedSecondsLeft = Math.max(
					0,
					Math.round((totalEstimated - elapsed) / 1000),
				);
			}
			await this.updateMergeSession(
				sessionId,
				{
					progress: normalizedProgress,
					stage,
					estimated_seconds_left: estimatedSecondsLeft,
				},
				true,
			);
		};

		const throwIfCancelled = () => {
			if (!this.cancelRequestedSessions.has(sessionId)) {
				return;
			}

			const error = new Error("Слияние отменено пользователем");
			(error as Error & { code?: string }).code = "MERGE_CANCELLED";
			throw error;
		};

		try {
			await updateProgress(5, "Получение данных коммита");
			throwIfCancelled();
			const commit = await this.s2tCommitRepository.findOne({
				where: { id: commitId },
			});
			if (!commit) {
				throw new NotFoundException(`Коммит ${commitId} не найден`);
			}
			const finalUser = user || commit.user || "system";

			throwIfCancelled();
			await updateProgress(15, "Применение изменений коммита в БД");
			// INCREMENTAL MERGE: применяем только commit payload напрямую в БД
			// без полного export/import merged JSON — это ускоряет merge в разы
			if (mergedJson.desc) {
				(mergedJson.desc as any).schemaVersion = "2.0";
			}
			await this.jsonApplyService.applyDataInTransaction({
				data: mergedJson,
				user: finalUser,
				changeName: `Merge commit ${commit.commit_name || commitId}`,
				operationId: `merge-${sessionId}`,
				checkCancelled: () => {
					throwIfCancelled();
				},
				onStepProgress: async (step) => {
					if (step === "createChangeRecord") {
						await updateProgress(25, "Создание change record");
						return;
					}
					if (step === "handleProcess") {
						await updateProgress(35, "Обработка процесса");
						return;
					}
					if (step === "handleEntities") {
						await updateProgress(50, "Обработка сущностей");
						return;
					}
					if (step === "handleMappings") {
						await updateProgress(60, "Обработка маппингов");
						return;
					}
					if (step === "handleFailedMappings") {
						await updateProgress(68, "Обработка ошибок маппингов");
					}
				},
			});

			throwIfCancelled();

			await updateProgress(70, "Создание снепшота");
			throwIfCancelled();
			// Снапшот создаём из свежего экспорта БД (после импорта), а не из in-memory payload,
			// чтобы не держать ~200MB JSON одновременно с операциями TypeORM
			const freshModel = await this.jsonExportService.exportToJson();
			const snapshot = await this.snapshotService.createSnapshot(
				finalUser,
				freshModel,
			);

			await updateProgress(85, "Обновление статуса коммита");
			throwIfCancelled();
			await this.updateCommitState(commitId, {
				state: "done",
				error: null,
			});

			await updateProgress(95, "Фиксация транзакции");

			await this.updateMergeSession(sessionId, {
				merge_status: "done",
				progress: 100,
				stage: "Завершено",
				snapshot_id: snapshot.snapshot_id,
				estimated_seconds_left: 0,
			});

			this.logger.log(
				`Фоновое слияние завершено, снепшот: ${snapshot.snapshot_id}`,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Неизвестная ошибка";
			const errorResponse =
				error instanceof Error && "getResponse" in error
					? (error as { getResponse?: () => unknown }).getResponse?.()
					: undefined;
			const mergedJsonDesc =
				mergedJson && typeof mergedJson === "object"
					? mergedJson.desc
					: undefined;
			const failedMappingsCount =
				mergedJson &&
				typeof mergedJson === "object" &&
				"failedMappings" in mergedJson &&
				Array.isArray(
					(mergedJson as { failedMappings?: unknown }).failedMappings,
				)
					? (mergedJson as { failedMappings: unknown[] }).failedMappings.length
					: 0;

			this.logger.error(
				"Фоновое слияние завершилось ошибкой во время importJsonData",
				{
					sessionId,
					commitId,
					user,
					errorMessage,
					errorResponse,
					mergeContext: {
						entitiesCount: mergedJson?.entities?.length ?? 0,
						mappingsCount: mergedJson?.mappings?.length ?? 0,
						failedMappingsCount,
						schemaVersion:
							mergedJsonDesc &&
							typeof mergedJsonDesc === "object" &&
							"schemaVersion" in mergedJsonDesc
								? (mergedJsonDesc as { schemaVersion?: unknown }).schemaVersion
								: undefined,
						process:
							mergedJsonDesc &&
							typeof mergedJsonDesc === "object" &&
							"process" in mergedJsonDesc
								? (mergedJsonDesc as { process?: unknown }).process
								: undefined,
						commitType:
							mergedJsonDesc &&
							typeof mergedJsonDesc === "object" &&
							"commit_type" in mergedJsonDesc
								? (mergedJsonDesc as { commit_type?: unknown }).commit_type
								: undefined,
						hadExistingCycles,
					},
				},
			);

			await this.updateMergeSession(sessionId, {
				merge_status: "failed",
				progress: 0,
				stage:
					error instanceof Error &&
					error.message === "Слияние отменено пользователем"
						? "Отменено"
						: "Ошибка",
				error_message: errorMessage,
			});

			try {
				await this.updateCommitState(commitId, {
					state: "failed",
					error: errorMessage,
				});
			} catch (rollbackErr) {
				const rollbackMessage =
					rollbackErr instanceof Error
						? rollbackErr.message
						: String(rollbackErr);
				this.logger.error(
					`Не удалось откатить статус коммита: ${rollbackMessage}`,
				);
			}

			const runtimeErrorMessage =
				error instanceof Error ? error.message : String(error);
			const runtimeErrorStack =
				error instanceof Error ? error.stack : undefined;
			this.logger.error(
				`Ошибка при фоновом слиянии: ${runtimeErrorMessage}`,
				runtimeErrorStack,
			);
		} finally {
			this.cancelRequestedSessions.delete(sessionId);
		}
	}

	/**
	 * Обновить статус конкретного коммита по ID
	 */
	private async updateCommitStateById(
		commitId: string,
		state: "processing" | "merging" | "deduplicating" | "done" | "failed",
	): Promise<void> {
		await this.updateCommitState(commitId, { state });
	}

	private async updateCommitState(
		commitId: string,
		params: {
			state: "processing" | "merging" | "deduplicating" | "done" | "failed";
			error?: string | null;
		},
	): Promise<void> {
		await this.s2tCommitRepository.update(commitId, {
			state: params.state,
			error: params.error,
			updated_at: new Date(),
		});
	}

	/**
	 * Отмена слияния удаление временной сессии
	 */
	async cancelMerge(commitId: string): Promise<{
		success: boolean;
		message: string;
	}> {
		this.logger.log(`Отмена слияния для коммита: ${commitId}`);

		const session = await this.mergeSessionRepository.findOne({
			where: { commit_id: commitId },
			order: { created_at: "DESC" },
		});

		if (!session) {
			throw new NotFoundException(
				`Активная сессия слияния для коммита ${commitId} не найдена`,
			);
		}

		if (session.merge_status === "merging") {
			this.cancelRequestedSessions.add(session.id);
			await this.updateMergeSession(session.id, {
				cancel_requested: true,
				stage: "Отмена слияния",
				error_message: "Слияние отменено пользователем",
			});
			await this.updateCommitState(commitId, {
				state: "failed",
				error: "Слияние отменено пользователем",
			});
			return {
				success: true,
				message: "Отмена слияния запрошена",
			};
		}

		if (session.merge_status === "deduplicating") {
			this.cancelRequestedSessions.add(session.id);
			await this.updateMergeSession(session.id, {
				cancel_requested: true,
				stage: "Отмена дедупликации",
				error_message: "Дедупликация отменена пользователем",
			});
			await this.updateCommitState(commitId, {
				state: "processing",
				error: null,
			});
			return {
				success: true,
				message: "Отмена дедупликации запрошена",
			};
		}

		this.sessionPayloadCache.delete(session.id);
		await this.mergeSessionRepository.delete(session.id);
		await this.updateCommitState(commitId, {
			state: "processing",
			error: null,
		});

		return {
			success: true,
			message: "Слияние отменено, временные данные удалены",
		};
	}

	/**
	 * Получение статуса сессии слияния для polling
	 */
	async getMergeSessionStatus(
		sessionId: string,
	): Promise<MergeSessionStatusState | null> {
		const cachedSession = this.sessionStatusCache.get(sessionId);
		if (cachedSession) {
			return cachedSession;
		}
		const session = await this.mergeSessionRepository.findOne({
			where: { id: sessionId },
		});
		if (!session) {
			return null;
		}
		return this.toMergeSessionStatusDto(session);
	}

	/**
	 * Поиск активной сессии в статусе merging (для отображения в Header)
	 */
	async getActiveSession(): Promise<MergeSessionStatusState | null> {
		const activeCachedSession = [...this.sessionStatusCache.values()]
			.filter(
				(session) =>
					session.status === "merging" || session.status === "deduplicating",
			)
			.sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
		if (activeCachedSession) {
			return activeCachedSession;
		}
		const session = await this.mergeSessionRepository
			.createQueryBuilder("mergeSession")
			.where("mergeSession.merge_status IN (:...statuses)", {
				statuses: ["merging", "deduplicating"],
			})
			.orderBy("mergeSession.started_at", "DESC")
			.addOrderBy("mergeSession.created_at", "DESC")
			.getOne();
		if (!session) {
			return null;
		}
		return this.toMergeSessionStatusDto(session);
	}

	private async failStaleMergingCommitsOnStartup(): Promise<void> {
		const staleMergeCommits = await this.s2tCommitRepository.find({
			where: { state: "merging" },
		});
		const staleDedupCommits = await this.s2tCommitRepository.find({
			where: { state: "deduplicating" },
		});

		const staleMergeSessions = await this.mergeSessionRepository.find({
			where: { merge_status: "merging" },
		});
		const staleDedupSessions = await this.mergeSessionRepository.find({
			where: { merge_status: "deduplicating" },
		});

		if (
			staleMergeCommits.length === 0 &&
			staleDedupCommits.length === 0 &&
			staleMergeSessions.length === 0 &&
			staleDedupSessions.length === 0
		) {
			return;
		}

		const mergeErrorMessage =
			"Слияние было прервано из-за перезапуска сервера и помечено как ошибочное";
		const dedupErrorMessage =
			"Дедупликация была прервана из-за перезапуска сервера и остановлена";

		if (staleMergeCommits.length > 0) {
			await this.s2tCommitRepository.update(
				{ state: "merging" },
				{
					state: "failed",
					error: mergeErrorMessage,
					updated_at: new Date(),
				},
			);
		}

		if (staleDedupCommits.length > 0) {
			await this.s2tCommitRepository.update(
				{ state: "deduplicating" },
				{
					state: "processing",
					error: dedupErrorMessage,
					updated_at: new Date(),
				},
			);
		}

		if (staleMergeSessions.length > 0) {
			await this.mergeSessionRepository.update(
				{ merge_status: "merging" },
				{
					merge_status: "failed",
					progress: 0,
					stage: "Ошибка",
					error_message: mergeErrorMessage,
					estimated_seconds_left: null,
					updated_at: new Date(),
				},
			);
		}

		if (staleDedupSessions.length > 0) {
			await this.mergeSessionRepository.update(
				{ merge_status: "deduplicating" },
				{
					merge_status: "failed",
					progress: 0,
					stage: "Дедупликация прервана",
					error_message: dedupErrorMessage,
					estimated_seconds_left: null,
					updated_at: new Date(),
				},
			);
		}

		this.logger.warn(
			`Помечено зависших процессов после рестарта: merge-коммитов ${staleMergeCommits.length}, dedup-коммитов ${staleDedupCommits.length}, merge-сессий ${staleMergeSessions.length}, dedup-сессий ${staleDedupSessions.length}`,
		);
	}

	/**
	 * Проверяет, не создаёт ли слияние новых дубликатов.
	 * Возвращает структуру с полем allowed (true, если нет новых дубликатов).
	 */
	private checkDuplicatesAfterMerge(
		currentModel: JsonExportResponseDto,
		mergedModel: JsonExportResponseDto,
	): {
		allowed: boolean;
		newDuplicates: string[];
		existingDuplicates: string[];
	} {
		const countById = (entities: any[]): Map<string, number> => {
			const map = new Map<string, number>();
			for (const entity of entities) {
				const id = entity.id;
				map.set(id, (map.get(id) || 0) + 1);
			}
			return map;
		};

		const currentCounts = countById(currentModel.entities);
		const mergedCounts = countById(mergedModel.entities);

		const newDuplicates: string[] = [];
		const existingDuplicates: string[] = [];

		for (const [id, mergedCount] of mergedCounts.entries()) {
			const currentCount = currentCounts.get(id) || 0;
			if (mergedCount > 1) {
				if (currentCount <= 1) {
					newDuplicates.push(id);
				} else {
					existingDuplicates.push(id);
				}
			}
		}

		return {
			allowed: newDuplicates.length === 0,
			newDuplicates,
			existingDuplicates,
		};
	}
}
