import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { CreateS2tCommitRequestDto } from "../dto/requests/create-s2t-commit-request.dto";
import { ApplyS2tCommitRequestDto } from "../dto/requests/apply-s2t-commit-request.dto";
import {
	S2tCommitStoreService,
	type S2tCreateResult,
} from "../services/s2t-commit-store.service";

@ApiBearerAuth("JWT-auth")
@ApiTags("Импорт S2T")
@Controller("s2t-import/commits")
export class S2tCommitStoreController {
	constructor(private readonly service: S2tCommitStoreService) {}

	@Post()
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Создать S2T коммит",
		description:
			"Принимает либо xlsxBase64 (конвертация + валидация на беке), либо готовый payload. " +
			"При ошибках валидации возвращает 422 с детальным списком ошибок.",
	})
	@ApiResponse({
		status: 201,
		description:
			"Коммит создан. Поле warnings содержит некритические предупреждения.",
	})
	@ApiResponse({
		status: 422,
		description: "Ошибки валидации S2T данных (errors + statistics)",
	})
	async createOrUpdate(
		@Body() body: CreateS2tCommitRequestDto,
	): Promise<S2tCreateResult> {
		return await this.service.createOrUpdate(body);
	}

	@Get()
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({ summary: "Список S2T коммитов" })
	@ApiQuery({ name: "state", required: false })
	@ApiQuery({ name: "type", required: false })
	@ApiQuery({ name: "page", required: false, type: Number })
	@ApiQuery({ name: "limit", required: false, type: Number })
	@ApiQuery({ name: "sortBy", required: false, type: String })
	@ApiQuery({
		name: "sortOrder",
		required: false,
		enum: ["asc", "desc"],
	})
	@ApiResponse({ status: 200 })
	async list(
		@Query("state") state?: string,
		@Query("type") type?: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
		@Query("sortBy") sortBy?: string,
		@Query("sortOrder") sortOrder?: "asc" | "desc",
	) {
		return await this.service.list({
			state,
			type,
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
			sortBy,
			sortOrder,
		});
	}

	@Get(":id")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({ summary: "Получить S2T коммит по id" })
	@ApiParam({ name: "id", type: String })
	@ApiResponse({ status: 200 })
	async getById(@Param("id") id: string) {
		return await this.service.findById(id);
	}

	@Post(":id/apply")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({ summary: "Применить (merge) S2T коммит" })
	@ApiParam({ name: "id", type: String })
	@ApiResponse({ status: 200 })
	async apply(@Param("id") id: string, @Body() body: ApplyS2tCommitRequestDto) {
		return await this.service.applyCommit({
			id,
			user: body.user,
			sourceType: body.sourceType,
		});
	}

	@Delete(":id")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({ summary: "Удалить S2T коммит (только неприменённые)" })
	@ApiParam({ name: "id", type: String })
	@ApiResponse({ status: 200 })
	async remove(@Param("id") id: string) {
		await this.service.deleteCommit(id);
		return { deleted: true };
	}
}
