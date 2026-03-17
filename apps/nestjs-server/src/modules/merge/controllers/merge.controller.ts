import {
	Controller,
	Post,
	Body,
	Get,
	Param,
	BadRequestException,
	NotFoundException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from "@nestjs/swagger";
import { MergeService } from "../services/merge.service";
import {
	ApplyMergeRequestDto,
	ConfirmMergeRequestDto,
	CancelMergeRequestDto,
	DeduplicateMergeRequestDto,
} from "../dto/merge-request.dto";
import {
	ApplyMergeResponseDto,
	ConfirmMergeResponseDto,
	CancelMergeResponseDto,
	DeduplicateMergeResponseDto,
	MergeSessionStatusDto,
} from "../dto/merge-response.dto";
import { RealmRole } from "../../../core/auth/decorators/realm-role.decorator";
import { Permission } from "../../../core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Слияние коммитов (Merge)")
@Controller("merge")
export class MergeController {
	constructor(private readonly mergeService: MergeService) {}

	@Post("apply")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Применить коммит",
		description:
			"Выполняет слияние коммита с текущей моделью данных и возвращает смерженный JSON и diff",
	})
	@ApiResponse({
		status: 200,
		description: "Слияние выполнено успешно",
		type: ApplyMergeResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Коммит не в статусе processing или отсутствует JSON",
	})
	@ApiResponse({ status: 404, description: "Коммит не найден" })
	async applyMerge(
		@Body() dto: ApplyMergeRequestDto,
	): Promise<ApplyMergeResponseDto> {
		if (!dto.commitId) {
			throw new BadRequestException("commitId обязателен");
		}
		return await this.mergeService.applyMerge(dto.commitId);
	}

	@Post("confirm")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Подтвердить слияние",
		description:
			"Сохраняет смерженную модель в РБД, создает снепшот и меняет статус коммита",
	})
	@ApiResponse({
		status: 200,
		description: "Слияние подтверждено",
		type: ConfirmMergeResponseDto,
	})
	@ApiResponse({
		status: 404,
		description: "Активная сессия слияния не найдена",
	})
	async confirmMerge(
		@Body() dto: ConfirmMergeRequestDto,
	): Promise<ConfirmMergeResponseDto> {
		const result = await this.mergeService.confirmMerge(dto.commitId, dto.user);
		return {
			success: result.success,
			mergeSessionId: result.mergeSessionId,
			message: result.message,
		};
	}

	@Post("cancel")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Отменить слияние",
		description: "Отменяет текущее слияние и удаляет временные данные",
	})
	@ApiResponse({
		status: 200,
		description: "Слияние отменено",
		type: CancelMergeResponseDto,
	})
	@ApiResponse({
		status: 404,
		description: "Активная сессия слияния не найдена",
	})
	async cancelMerge(
		@Body() dto: CancelMergeRequestDto,
	): Promise<CancelMergeResponseDto> {
		return await this.mergeService.cancelMerge(dto.commitId);
	}

	@Post("deduplicate")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Запустить дедупликацию сущностей",
		description:
			"Запускает дедупликацию сущностей в фоне. " +
			"Уникальность определяется по связке full_name + system_code.",
	})
	@ApiResponse({
		status: 200,
		description: "Дедупликация запущена",
		type: DeduplicateMergeResponseDto,
	})
	async deduplicateEntities(
		@Body() dto: DeduplicateMergeRequestDto,
	): Promise<DeduplicateMergeResponseDto> {
		return await this.mergeService.startDeduplication(dto.commitId);
	}

	@Get("active-session")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить активную фоновую сессию",
		description:
			"Возвращает активную merge или deduplication сессию, если она есть",
	})
	@ApiResponse({
		status: 200,
		description: "Активная сессия найдена",
		type: MergeSessionStatusDto,
	})
	async getActiveSession(): Promise<MergeSessionStatusDto | null> {
		return await this.mergeService.getActiveSession();
	}

	@Get("session/:sessionId")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить статус сессии слияния",
		description:
			"Возвращает статус и прогресс сессии слияния по её идентификатору",
	})
	@ApiParam({ name: "sessionId", description: "UUID сессии слияния" })
	@ApiResponse({
		status: 200,
		description: "Сессия найдена",
		type: MergeSessionStatusDto,
	})
	@ApiResponse({ status: 404, description: "Сессия не найдена" })
	async getSession(
		@Param("sessionId") sessionId: string,
	): Promise<MergeSessionStatusDto> {
		const session = await this.mergeService.getMergeSessionStatus(sessionId);
		if (!session) {
			throw new NotFoundException(`Сессия ${sessionId} не найдена`);
		}
		return session;
	}
}
