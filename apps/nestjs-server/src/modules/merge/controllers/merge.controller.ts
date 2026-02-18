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
} from "../dto/merge-request.dto";
import {
	ApplyMergeResponseDto,
	ConfirmMergeResponseDto,
	CancelMergeResponseDto,
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
			snapshotId: result.snapshotId,
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

	@Get("session/:sessionId")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить информацию о сессии слияния",
		description:
			"Возвращает данные активной сессии слияния по её идентификатору",
	})
	@ApiParam({ name: "sessionId", description: "UUID сессии слияния" })
	@ApiResponse({ status: 200, description: "Сессия найдена" })
	@ApiResponse({ status: 404, description: "Сессия не найдена" })
	async getSession(@Param("sessionId") sessionId: string) {
		const session = this.mergeService.getMergeSession(sessionId);
		if (!session) {
			throw new NotFoundException(`Сессия ${sessionId} не найдена`);
		}
		return session;
	}
}
