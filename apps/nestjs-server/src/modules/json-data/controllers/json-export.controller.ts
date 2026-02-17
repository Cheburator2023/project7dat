import {
	Controller,
	Get,
	Param,
	Query,
	BadRequestException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonExportResponseDto } from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON")
@Controller("json-export")
export class JsonExportController {
	constructor(private readonly jsonExportService: JsonExportService) {}

	@Get("dl")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Экспорт данных РБД в JSON DL (полный граф)",
		description:
			"Экспортирует все данные из РБД Data Lineage в формат JSON DL. " +
			"Для быстрой загрузки используйте /dl/paginated.",
	})
	@ApiResponse({
		status: 200,
		description: "Данные успешно экспортированы в JSON DL",
		type: JsonExportResponseDto,
	})
	async exportToJson(): Promise<JsonExportResponseDto> {
		return await this.jsonExportService.exportToJson();
	}

	@Get("dl/paginated")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Пагинированный экспорт сущностей из кэша",
		description:
			"Быстро отдаёт страницу сущностей из кэшированного графа. " +
			"Поддерживает поиск по name/id/namespace/description.",
	})
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Номер страницы (по умолчанию 1)",
		example: 1,
	})
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Количество сущностей на странице (1-500, по умолчанию 50)",
		example: 50,
	})
	@ApiQuery({
		name: "search",
		required: false,
		type: String,
		description: "Поисковый запрос (мин. 2 символа)",
	})
	@ApiQuery({
		name: "type",
		required: false,
		type: String,
		description: "Фильтр по типу сущности (например input_vector)",
	})
	@ApiResponse({
		status: 200,
		description: "Страница сущностей успешно получена",
		schema: {
			type: "object",
			properties: {
				entities: { type: "array", items: { type: "object" } },
				total: { type: "number", example: 1500 },
				page: { type: "number", example: 1 },
				limit: { type: "number", example: 50 },
				totalPages: { type: "number", example: 30 },
				desc: { type: "object" },
			},
		},
	})
	async exportPaginated(
		@Query("page") pageRaw?: string,
		@Query("limit") limitRaw?: string,
		@Query("search") search?: string,
		@Query("type") type?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			throw new BadRequestException("limit должен быть от 1 до 500");
		}

		return await this.jsonExportService.exportPaginated({
			page,
			limit,
			search,
			type,
		});
	}

	@Get("dl/paginated/mappings")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Пагинированный экспорт маппингов из кэша",
		description:
			"Быстро отдаёт страницу маппингов из кэшированного графа. " +
			"Поддерживает поиск по entityId, process, description.",
	})
	@ApiQuery({ name: "page", required: false, type: Number })
	@ApiQuery({ name: "limit", required: false, type: Number })
	@ApiQuery({ name: "search", required: false, type: String })
	async exportPaginatedMappings(
		@Query("page") pageRaw?: string,
		@Query("limit") limitRaw?: string,
		@Query("search") search?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			throw new BadRequestException("limit должен быть от 1 до 500");
		}

		return await this.jsonExportService.exportPaginatedMappings({
			page,
			limit,
			search,
		});
	}

	@Get("dl/entity-relations/:entityId")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Пагинированные связи сущности из кэша",
		description:
			"Возвращает маппинги, связанные с конкретной сущностью, " +
			"а также связанные сущности для текущей страницы.",
	})
	@ApiQuery({ name: "page", required: false, type: Number })
	@ApiQuery({ name: "limit", required: false, type: Number })
	async exportEntityRelationsPaginated(
		@Param("entityId") entityId: string,
		@Query("page") pageRaw?: string,
		@Query("limit") limitRaw?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			throw new BadRequestException("limit должен быть от 1 до 500");
		}

		return await this.jsonExportService.exportPaginatedEntityRelations({
			entityId: decodeURIComponent(entityId),
			page,
			limit,
		});
	}
}
