import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { S2tConversionService } from "./s2t-conversion.service";
import { S2tToCommitJsonService } from "./s2t-to-commit-json.service";
import { JsonValidationOrchestratorService } from "./json-validation-orchestrator.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
	S2tCommitEntity,
	type S2tCommitState,
} from "../entities/s2t-commit.entity";
import { CreateS2tCommitRequestDto } from "../dto/requests/create-s2t-commit-request.dto";
import { JsonImportService } from "./json-import.service";
import {
	JsonSourceType,
	JsonImportRequestDto,
} from "../dto/requests/json-import-request.dto";

export interface S2tValidationError {
	code: string;
	message: string;
	path?: string;
	details?: string;
}

export interface S2tCreateResult {
	commit: S2tCommitEntity;
	warnings: S2tValidationError[];
	reusedExisting?: boolean;
}

@Injectable()
export class S2tCommitStoreService {
	private readonly logger = new Logger(S2tCommitStoreService.name);
	private readonly maxStoredErrorLength = 4000;
	private readonly sortableFields = new Set<keyof S2tCommitEntity>([
		"id",
		"commit_name",
		"commit_description",
		"type",
		"state",
		"user",
		"change_id",
		"created_at",
		"updated_at",
	]);

	constructor(
		@InjectRepository(S2tCommitEntity)
		private readonly repo: Repository<S2tCommitEntity>,
		private readonly jsonImportService: JsonImportService,
		private readonly s2tConversionService: S2tConversionService,
		private readonly s2tToCommitJsonService: S2tToCommitJsonService,
		private readonly validationOrchestrator: JsonValidationOrchestratorService,
	) {}

	private detectCommitType(fileName?: string): "table" | "json" | "model" {
		const name = (fileName ?? "").toLowerCase();
		if (name.includes("json_")) return "json";
		if (name.includes("model_")) return "model";
		return "table";
	}

	private formatValidationErrors(errors: string[]): S2tValidationError[] {
		return errors.map((msg) => {
			const code = msg.includes("рекурс")
				? "RECURSION"
				: msg.includes("дублир")
					? "DUPLICATE"
					: msg.includes("тип") || msg.includes("type")
						? "TYPE_MISMATCH"
						: msg.includes("атрибут")
							? "ATTRIBUTE_ERROR"
							: msg.includes("маппинг") || msg.includes("mapping")
								? "MAPPING_ERROR"
								: msg.includes("entity") || msg.includes("сущност")
									? "ENTITY_ERROR"
									: "VALIDATION_ERROR";
			return { code, message: msg };
		});
	}

	private sanitizeCommitError(error: unknown): string {
		const rawMessage =
			typeof error === "string"
				? error
				: error instanceof Error
					? error.message
					: String(error ?? "Unknown error");
		const compactMessage = rawMessage.replace(/\s+/g, " ").trim();
		return compactMessage.slice(0, this.maxStoredErrorLength);
	}

	async convertAndValidateXlsx(dto: CreateS2tCommitRequestDto): Promise<{
		payload: Record<string, any>;
		commitType: "table" | "json" | "model";
		warnings: S2tValidationError[];
	}> {
		const {
			xlsxBase64,
			fileName,
			commit_name,
			processName,
			processDescription,
		} = dto;

		let workbook: any;
		try {
			const result =
				await this.s2tConversionService.convertXlsxBase64ToWorkbookJson({
					xlsxBase64: xlsxBase64!,
					fileName,
				});
			workbook = result.workbook;
		} catch (e: any) {
			throw new BadRequestException({
				message: "Не удалось прочитать xlsx файл",
				code: "XLSX_PARSE_ERROR",
				details: e?.message,
			});
		}

		const commitType = this.detectCommitType(fileName);
		const needsProcess = commitType === "table" || commitType === "model";

		let payload: Record<string, any>;
		try {
			payload = this.s2tToCommitJsonService.convertWorkbookToCommitJson({
				workbook,
				fileName,
				commitName: commit_name,
				processName: needsProcess ? processName : undefined,
				processDescription: needsProcess ? processDescription : undefined,
			});
		} catch (e: any) {
			throw new BadRequestException({
				message: "Не удалось конвертировать S2T в commit JSON",
				code: "S2T_CONVERSION_ERROR",
				details: e?.message,
			});
		}

		// Валидация сконвертированного payload
		const validationResult =
			await this.validationOrchestrator.validate(payload);

		const errors: S2tValidationError[] = [];
		const warnings: S2tValidationError[] = [];

		// Критические ошибки структуры
		if (validationResult.validation?.errors?.length) {
			errors.push(
				...this.formatValidationErrors(validationResult.validation.errors),
			);
		}

		// Рекурсии — критические
		if (validationResult.recursionCheck?.hasRecursion) {
			const cycles = validationResult.recursionCheck.cycles ?? [];
			for (const cycle of cycles) {
				errors.push({
					code: "RECURSION",
					message: `Обнаружена рекурсивная зависимость: ${cycle.join(" → ")}`,
					details:
						"Проверьте маппинги на наличие циклических ссылок между сущностями",
				});
			}
		}

		// Дубликаты — критические
		if (validationResult.duplicateCheck?.hasDuplicates) {
			for (const dup of validationResult.duplicateCheck.duplicates ?? []) {
				errors.push({ code: "DUPLICATE", message: dup });
			}
		}

		// Предупреждения структуры
		if (validationResult.validation?.warnings?.length) {
			warnings.push(
				...this.formatValidationErrors(validationResult.validation.warnings),
			);
		}

		// Проблемы целостности — предупреждения (не критические)
		if (validationResult.integrity?.issues?.length) {
			for (const issue of validationResult.integrity.issues) {
				warnings.push({ code: "INTEGRITY_WARNING", message: issue });
			}
		}

		if (errors.length > 0) {
			this.logger.warn(
				`S2T валидация не пройдена для "${fileName}": ${errors.length} ошибок`,
			);
			throw new UnprocessableEntityException({
				message: "Данные S2T не прошли валидацию",
				code: "S2T_VALIDATION_FAILED",
				errors,
				warnings,
				statistics: validationResult.statistics,
			});
		}

		this.logger.log(
			`S2T конвертация и валидация прошли успешно: "${fileName}", тип=${commitType}, ` +
				`entities=${(payload as any).entities?.length ?? 0}, предупреждений=${warnings.length}`,
		);

		return { payload, commitType, warnings };
	}

	async createOrUpdate(
		dto: CreateS2tCommitRequestDto,
	): Promise<S2tCreateResult> {
		let payload: Record<string, any>;
		let commitType: "table" | "json" | "model";
		let warnings: S2tValidationError[] = [];

		if (dto.xlsxBase64) {
			// Режим xlsx: конвертация + валидация на беке
			const result = await this.convertAndValidateXlsx(dto);
			payload = result.payload;
			commitType = result.commitType;
			warnings = result.warnings;
		} else {
			// Режим прямой передачи payload
			if (!dto.payload) {
				throw new BadRequestException({
					message: "Необходимо передать xlsxBase64 или payload",
					code: "MISSING_PAYLOAD",
				});
			}
			payload = dto.payload;
			commitType = dto.type ?? "table";
		}

		if (dto.id) {
			const existing = await this.repo.findOne({ where: { id: dto.id } });
			if (!existing) {
				throw new NotFoundException(`S2T commit ${dto.id} not found`);
			}

			const previousPayloadSnapshot =
				existing.original_payload ?? structuredClone(existing.payload);

			existing.parent_id = dto.parent_id ?? existing.parent_id;
			existing.commit_name = dto.commit_name;
			existing.commit_description = dto.commit_description ?? null;
			existing.payload = payload;
			existing.original_payload = previousPayloadSnapshot;
			existing.user = dto.user ?? existing.user;
			existing.state = "processing";
			existing.error = null;
			existing.change_id = null;

			const commit = await this.repo.save(existing);
			return { commit, warnings };
		}

		const existingByPayload = await this.findExistingCommitByPayload(
			payload,
			commitType,
		);
		if (existingByPayload) {
			return {
				commit: existingByPayload,
				reusedExisting: true,
				warnings: [
					...warnings,
					{
						code: "DUPLICATE_COMMIT_SKIPPED",
						message:
							"Коммит с идентичным содержимым уже существует. Использована существующая запись.",
						details: existingByPayload.id,
					},
				],
			};
		}

		const entity = this.repo.create({
			parent_id: dto.parent_id ?? null,
			commit_name: dto.commit_name,
			commit_description: dto.commit_description ?? null,
			type: commitType,
			state: "processing",
			user: dto.user ?? null,
			payload,
			original_payload: structuredClone(payload),
			change_id: null,
			error: null,
		});

		const commit = await this.repo.save(entity);
		return { commit, warnings };
	}

	private async findExistingCommitByPayload(
		payload: Record<string, any>,
		type: "table" | "json" | "model",
	): Promise<S2tCommitEntity | null> {
		const payloadJson = JSON.stringify(payload);
		const existing = await this.repo
			.createQueryBuilder("commit")
			.where("commit.type = :type", { type })
			.andWhere("commit.payload = CAST(:payload AS jsonb)", {
				payload: payloadJson,
			})
			.orderBy("commit.updated_at", "DESC")
			.addOrderBy("commit.created_at", "DESC")
			.getOne();

		return existing ?? null;
	}

	async findById(id: string): Promise<S2tCommitEntity> {
		const commit = await this.repo.findOne({
			select: [
				"id",
				"parent_id",
				"commit_name",
				"commit_description",
				"type",
				"state",
				"user",
				"change_id",
				"error",
				"created_at",
				"updated_at",
				"payload",
			],
			where: { id },
		});
		if (!commit) throw new NotFoundException(`S2T commit ${id} not found`);
		return commit;
	}

	async list(params?: {
		state?: string;
		type?: string;
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
	}): Promise<{
		items: S2tCommitEntity[];
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	}> {
		const where: any = {};
		if (params?.state) where.state = params.state;
		if (params?.type) where.type = params.type;

		const page = Math.max(1, params?.page ?? 1);
		const limit = Math.min(200, Math.max(1, params?.limit ?? 20));
		const requestedSortBy =
			typeof params?.sortBy === "string" ? params.sortBy.trim() : "";
		const sortBy =
			requestedSortBy &&
			requestedSortBy !== "undefined" &&
			this.sortableFields.has(requestedSortBy as keyof S2tCommitEntity)
				? (requestedSortBy as keyof S2tCommitEntity)
				: "created_at";
		const sortOrder = params?.sortOrder === "asc" ? "ASC" : "DESC";

		const [items, total] = await this.repo.findAndCount({
			select: [
				"id",
				"parent_id",
				"commit_name",
				"commit_description",
				"type",
				"state",
				"user",
				"change_id",
				"error",
				"created_at",
				"updated_at",
			],
			where,
			order: {
				[sortBy]: sortOrder,
			},
			skip: (page - 1) * limit,
			take: limit,
		});

		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit) || 1,
		};
	}

	async applyCommit(params: {
		id: string;
		user?: string;
		sourceType?: JsonSourceType;
	}): Promise<{ changeId: number; commit: S2tCommitEntity }> {
		const commit = await this.findById(params.id);

		if (commit.state === "done") {
			throw new BadRequestException("Commit already applied");
		}

		await this.setState(commit.id, "processing");

		try {
			const importReq: JsonImportRequestDto = {
				data: commit.payload,
				user: params.user ?? commit.user ?? "system",
				changeName: commit.commit_name,
				validated: true,
				sourceType: params.sourceType ?? JsonSourceType.DAPP,
			};

			const result = await this.jsonImportService.importJsonData(importReq);

			commit.state = "done";
			commit.change_id = result.changeId;
			commit.error = null;
			const saved = await this.repo.save(commit);

			return { changeId: result.changeId, commit: saved };
		} catch (e: any) {
			const errMsg = e?.response?.message || e?.message || "Apply failed";
			commit.state = "failed";
			commit.error = this.sanitizeCommitError(errMsg);
			commit.change_id = null;
			await this.repo.save(commit);
			this.logger.error(
				`Apply failed for commit ${commit.id}: ${errMsg}`,
				e?.stack,
			);
			throw e;
		}
	}

	async deleteCommit(id: string): Promise<void> {
		const commit = await this.findById(id);

		if (commit.state === "done") {
			throw new BadRequestException("Нельзя удалить уже применённый коммит");
		}

		await this.repo.remove(commit);
	}

	private async setState(id: string, state: S2tCommitState): Promise<void> {
		await this.repo.update(id, { state, updated_at: new Date() });
	}
}
