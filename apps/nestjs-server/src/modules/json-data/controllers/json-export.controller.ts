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
	ApiParam,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonExportResponseDto } from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { EntityExportPaginatedResponseDto } from "../dto/responses/entity-export-paginated.dto";

const PAGINATION_LIMIT_MAX = 10000;

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
		description: "Количество сущностей на странице (1-10000, по умолчанию 50)",
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
	@ApiQuery({
		name: "types",
		required: false,
		type: String,
		description: "Список типов через запятую",
	})
	@ApiQuery({
		name: "namespaces",
		required: false,
		type: String,
		description: "Список namespace через запятую",
	})
	@ApiQuery({
		name: "modifiedOnly",
		required: false,
		type: Boolean,
		description: "Только изменённые сущности",
	})
	@ApiQuery({
		name: "hasUpstream",
		required: false,
		type: String,
		description: "Фильтр по наличию источников: any | yes | no",
	})
	@ApiQuery({
		name: "hasDownstream",
		required: false,
		type: String,
		description: "Фильтр по наличию потребителей: any | yes | no",
	})
	@ApiQuery({
		name: "attrCountMin",
		required: false,
		type: Number,
		description: "Минимальное количество атрибутов",
	})
	@ApiQuery({
		name: "attrCountMax",
		required: false,
		type: Number,
		description: "Максимальное количество атрибутов",
	})
	@ApiQuery({
		name: "hideTempTables",
		required: false,
		type: Boolean,
		description: "Скрыть temp/tmp таблицы",
	})
	@ApiQuery({
		name: "sortBy",
		required: false,
		type: String,
		description:
			"Поле для сортировки (name, namespace, type, entity_change, system_code)",
	})
	@ApiQuery({
		name: "sortOrder",
		required: false,
		type: String,
		description: "Направление сортировки (asc | desc)",
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
		@Query("types") typesRaw?: string,
		@Query("namespaces") namespacesRaw?: string,
		@Query("modifiedOnly") modifiedOnlyRaw?: string,
		@Query("hasUpstream") hasUpstream?: string,
		@Query("hasDownstream") hasDownstream?: string,
		@Query("attrCountMin") attrCountMinRaw?: string,
		@Query("attrCountMax") attrCountMaxRaw?: string,
		@Query("hideTempTables") hideTempTablesRaw?: string,
		@Query("sortBy") sortBy?: string,
		@Query("sortOrder") sortOrder?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > PAGINATION_LIMIT_MAX) {
			throw new BadRequestException(
				`limit должен быть от 1 до ${PAGINATION_LIMIT_MAX}`,
			);
		}

		const types = typesRaw
			?.split(",")
			.map((value) => value.trim())
			.filter(Boolean);
		const namespaces = namespacesRaw
			?.split(",")
			.map((value) => value.trim())
			.filter(Boolean);
		const modifiedOnly =
			modifiedOnlyRaw === "true"
				? true
				: modifiedOnlyRaw === "false"
					? false
					: undefined;
		const attrCountMin = attrCountMinRaw
			? Number.parseInt(attrCountMinRaw, 10)
			: undefined;
		const attrCountMax = attrCountMaxRaw
			? Number.parseInt(attrCountMaxRaw, 10)
			: undefined;
		const hideTempTables =
			hideTempTablesRaw === "true"
				? true
				: hideTempTablesRaw === "false"
					? false
					: undefined;

		return await this.jsonExportService.exportPaginated({
			page,
			limit,
			search,
			type,
			types,
			namespaces,
			modifiedOnly,
			hasUpstream:
				hasUpstream === "yes" || hasUpstream === "no" ? hasUpstream : undefined,
			hasDownstream:
				hasDownstream === "yes" || hasDownstream === "no"
					? hasDownstream
					: undefined,
			attrCountMin:
				attrCountMin !== undefined && !Number.isNaN(attrCountMin)
					? attrCountMin
					: undefined,
			attrCountMax:
				attrCountMax !== undefined && !Number.isNaN(attrCountMax)
					? attrCountMax
					: undefined,
			hideTempTables,
			sortBy,
			sortOrder:
				sortOrder === "desc" ? "desc" : sortOrder === "asc" ? "asc" : undefined,
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
		if (Number.isNaN(limit) || limit < 1 || limit > PAGINATION_LIMIT_MAX) {
			throw new BadRequestException(
				`limit должен быть от 1 до ${PAGINATION_LIMIT_MAX}`,
			);
		}

		return await this.jsonExportService.exportPaginatedMappings({
			page,
			limit,
			search,
		});
	}

	@Get("dl/entity-relations/*")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Полный граф связей сущности из кэша",
		description:
			"Возвращает все маппинги и связанные сущности для данной сущности. " +
			"Фильтрация по глубине выполняется на фронтенде.",
	})
	@ApiQuery({ name: "page", required: false, type: Number })
	@ApiQuery({ name: "limit", required: false, type: Number })
	@ApiQuery({
		name: "hideTempTables",
		required: false,
		type: Boolean,
		description: "Скрывать TMP/TEMP сущности (по умолчанию true)",
	})
	async exportCachedEntityRelations(
		@Param("*") entityId: string,
		@Query("page") pageRaw?: string,
		@Query("limit") limitRaw?: string,
		@Query("hideTempTables") hideTempTablesRaw?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
		const hideTempTables =
			hideTempTablesRaw === undefined ? true : hideTempTablesRaw !== "false";

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > PAGINATION_LIMIT_MAX) {
			throw new BadRequestException(
				`limit должен быть от 1 до ${PAGINATION_LIMIT_MAX}`,
			);
		}

		return await this.jsonExportService.exportPaginatedEntityRelations({
			entityId,
			page,
			limit,
			hideTempTables,
		});
	}

	@Get("dl/model-relations/*")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Полный граф связей модели из кэша",
		description:
			"Возвращает модель, все связанные маппинги и сущности. " +
			"Фильтрация по глубине выполняется на фронтенде.",
	})
	@ApiQuery({ name: "page", required: false, type: Number })
	@ApiQuery({ name: "limit", required: false, type: Number })
	@ApiQuery({
		name: "hideTempTables",
		required: false,
		type: Boolean,
		description: "Скрывать TMP/TEMP сущности (по умолчанию true)",
	})
	async exportModelRelationsPaginated(
		@Param("*") modelId: string,
		@Query("page") pageRaw?: string,
		@Query("limit") limitRaw?: string,
		@Query("hideTempTables") hideTempTablesRaw?: string,
	) {
		const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
		const hideTempTables =
			hideTempTablesRaw === undefined ? true : hideTempTablesRaw !== "false";

		if (Number.isNaN(page) || page < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limit) || limit < 1 || limit > PAGINATION_LIMIT_MAX) {
			throw new BadRequestException(
				`limit должен быть от 1 до ${PAGINATION_LIMIT_MAX}`,
			);
		}

		return await this.jsonExportService.exportPaginatedModelRelations({
			modelId,
			page,
			limit,
			hideTempTables,
		});
	}

	@Get("entity/:fullName")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Экспорт связей сущности с пагинацией",
		description:
			"Возвращает JSON с маппингами и зависимостями для указанной сущности с поддержкой пагинации",
	})
	@ApiParam({
		name: "fullName",
		description: 'Полное имя сущности (например "schema.table")',
		example: "prod_dm.sales_fact",
	})
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Номер страницы",
		example: 1,
	})
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Количество маппингов на странице",
		example: 20,
	})
	@ApiQuery({
		name: "sortBy",
		required: false,
		enum: ["name", "change_date"],
		description: "Поле сортировки маппингов",
		example: "name",
	})
	@ApiQuery({
		name: "sortOrder",
		required: false,
		enum: ["ASC", "DESC"],
		description: "Направление сортировки",
		example: "ASC",
	})
	@ApiResponse({
		status: 200,
		description: "Успешный экспорт",
		type: EntityExportPaginatedResponseDto,
	})
	async exportEntityRelationsPaginated(
		@Param("fullName") fullName: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
		@Query("sortBy") sortBy?: "name" | "change_date",
		@Query("sortOrder") sortOrder?: "ASC" | "DESC",
	): Promise<EntityExportPaginatedResponseDto> {
		const pageNum = page ? Number.parseInt(page, 10) : 1;
		const limitNum = limit ? Number.parseInt(limit, 10) : 20;
		const validSortBy = sortBy ?? "name";
		const validSortOrder = sortOrder ?? "ASC";

		if (Number.isNaN(pageNum) || pageNum < 1) {
			throw new BadRequestException("page должен быть положительным числом");
		}
		if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
			throw new BadRequestException("limit должен быть числом от 1 до 100");
		}

		return await this.jsonExportService.exportEntityRelationsPaginated(
			fullName,
			pageNum,
			limitNum,
			validSortBy,
			validSortOrder,
		);
	}
}
