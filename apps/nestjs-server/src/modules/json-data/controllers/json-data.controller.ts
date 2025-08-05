import {
	Controller,
	Post,
	Get,
	Put,
	Delete,
	Body,
	Param,
	Query,
	BadRequestException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
	ApiBody,
    ApiBearerAuth,
} from "@nestjs/swagger";
import { JsonDataService } from "../services/json-data.service";
import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListSchema,
} from "../schemas/json-data.schema";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Данные")
@Controller("api/json-data")
export class JsonDataController {
	constructor(private readonly jsonDataService: JsonDataService) {}

	@Post("create")
	@RealmRole(Permission.DL_CREATE_JSON_DATA)
	@ApiOperation({
		summary: "Создать новый JSON документ",
		description: "Создает новый JSON документ в системе",
	})
	@ApiBody({
		description: "Данные для создания JSON документа",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "object",
					description: "JSON данные документа",
					example: { key: "value", number: 123 },
				},
				name: {
					type: "string",
					description: "Название документа (опционально)",
					example: "Мой документ",
				},
				description: {
					type: "string",
					description: "Описание документа (опционально)",
					example: "Описание моего документа",
				},
			},
			required: ["data"],
		},
	})
	@ApiResponse({
		status: 201,
		description: "JSON документ успешно создан",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Мой документ" },
				data: { type: "object", example: { key: "value" } },
				description: { type: "string", example: "Описание" },
				createdAt: { type: "string", format: "date-time" },
				updatedAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: "Неверные данные запроса",
	})
	async create(@Body() createJsonDataDto: CreateJsonDataInput) {
		return await this.jsonDataService.createGraphData(createJsonDataDto);
	}

	@Get("list")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить список JSON документов",
		description:
			"Возвращает пагинированный список JSON документов с возможностью поиска",
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
		description: "Количество элементов на странице (1-100, по умолчанию 10)",
		example: 10,
	})
	@ApiQuery({
		name: "search",
		required: false,
		type: String,
		description: "Поисковый запрос по названию или описанию",
		example: "мой документ",
	})
	@ApiResponse({
		status: 200,
		description: "Список JSON документов успешно получен",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							name: { type: "string", example: "Мой документ" },
							data: { type: "object", example: { key: "value" } },
							description: { type: "string", example: "Описание" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
				total: { type: "number", example: 100 },
				page: { type: "number", example: 1 },
				limit: { type: "number", example: 10 },
				totalPages: { type: "number", example: 10 },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: "Неверные параметры запроса",
	})
	async findAll(@Query() query: any) {
		try {
			const page = query.page ? Number.parseInt(query.page) : 1;
			const limit = query.limit ? Number.parseInt(query.limit) : 10;

			if (Number.isNaN(page) || page < 1) {
				throw new BadRequestException(
					"Параметр 'page' должен быть положительным числом",
				);
			}

			if (Number.isNaN(limit) || limit < 1 || limit > 100) {
				throw new BadRequestException(
					"Параметр 'limit' должен быть числом от 1 до 100",
				);
			}

			const validatedQuery = GetJsonDataListSchema.parse({
				page,
				limit,
				search: query.search,
			});

			return await this.jsonDataService.getAllGraphsWithPagination(
				validatedQuery,
			);
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			throw new BadRequestException("Неверные параметры запроса");
		}
	}

	@Get("current")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить последний JSON документ",
		description: "Возвращает самый последний созданный JSON документ",
	})
	@ApiResponse({
		status: 200,
		description: "Последний JSON документ успешно найден",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Мой документ" },
				data: { type: "object", example: { key: "value" } },
				description: { type: "string", example: "Описание" },
				createdAt: { type: "string", format: "date-time" },
				updatedAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "JSON документы не найдены",
	})
	async findLatest() {
		return await this.jsonDataService.getLatestGraphData();
	}

	@Get(":id")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить JSON документ по ID",
		description: "Возвращает конкретный JSON документ по его идентификатору",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "JSON документ успешно найден",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Мой документ" },
				data: { type: "object", example: { key: "value" } },
				description: { type: "string", example: "Описание" },
				createdAt: { type: "string", format: "date-time" },
				updatedAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "JSON документ не найден",
	})
	async findOne(@Param("id") id: string) {
		return await this.jsonDataService.getGraphDataById(id);
	}

	@Put("update/:id")
	@RealmRole(Permission.DL_UPDATE_JSON_DATA)
	@ApiOperation({
		summary: "Обновить JSON документ",
		description: "Обновляет существующий JSON документ по его идентификатору",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
		example: "uuid-string",
	})
	@ApiBody({
		description: "Данные для обновления JSON документа",
		schema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Новое название документа",
					example: "Обновленный документ",
				},
				data: {
					type: "object",
					description: "Новые JSON данные документа",
					example: { updatedKey: "newValue", number: 456 },
				},
				description: {
					type: "string",
					description: "Новое описание документа",
					example: "Обновленное описание",
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: "JSON документ успешно обновлен",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Обновленный документ" },
				data: { type: "object", example: { updatedKey: "newValue" } },
				description: { type: "string", example: "Обновленное описание" },
				createdAt: { type: "string", format: "date-time" },
				updatedAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: "Неверные данные запроса",
	})
	@ApiResponse({
		status: 404,
		description: "JSON документ не найден",
	})
	async update(
		@Param("id") id: string,
		@Body() updateJsonDataDto: UpdateJsonDataInput,
	) {
		return await this.jsonDataService.updateGraphData(id, updateJsonDataDto);
	}

	@Delete("delete/:id")
	@RealmRole(Permission.DL_DELETE_JSON_DATA)
	@ApiOperation({
		summary: "Удалить JSON документ",
		description: "Удаляет JSON документ по его идентификатору",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 204,
		description: "JSON документ успешно удален",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "JSON документ не найден",
	})
	async remove(@Param("id") id: string) {
		await this.jsonDataService.deleteGraphData(id);
		return { success: true };
	}
}
