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
	GetJsonDataListSchema,
	UpdateJsonDataInput,
} from "../schemas/json-data.schema";
import { SnapshotService } from "../../snapshots/services/snapshot.service";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { VersionInfoDto } from "../dto/version-info.dto";
import { JsonDataResponseDto } from "../dto/responses/json-data-response.dto";
import { JsonCommitResponseDto } from "../dto/responses/json-commit-response.dto";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Данные")
@Controller("json-data")
export class JsonDataController {
	constructor(
		private readonly jsonDataService: JsonDataService,
		private readonly snapshotService: SnapshotService,
	) {}

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

	@Put(":id/version")
	@RealmRole(Permission.DL_UPDATE_JSON_DATA)
	@ApiOperation({
		summary: "Обновить информацию о версии JSON документа",
		description: "Обновляет версию схемы и флаг устаревания",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
	})
	@ApiBody({ type: VersionInfoDto })
	@ApiResponse({
		status: 200,
		description: "Информация о версии успешно обновлена",
		type: JsonDataResponseDto,
	})
	async updateVersionInfo(
		@Param("id") id: string,
		@Body() versionInfo: VersionInfoDto,
	) {
		return await this.jsonDataService.updateVersionInfo(id, versionInfo);
	}

	@Get(":id/history")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить историю изменений документа",
		description:
			"Возвращает список версий документа с возможностью фильтрации по дате",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
	})
	@ApiQuery({
		name: "fromDate",
		required: false,
		type: String,
		description: "Дата начала периода (формат YYYY-MM-DD)",
	})
	@ApiQuery({
		name: "toDate",
		required: false,
		type: String,
		description: "Дата окончания периода (формат YYYY-MM-DD)",
	})
	@ApiResponse({
		status: 200,
		description: "История изменений успешно получена",
		type: [JsonCommitResponseDto],
	})
	async getDocumentHistory(
		@Param("id") id: string,
		@Query("fromDate") fromDate?: string,
		@Query("toDate") toDate?: string,
	) {
		return await this.jsonDataService.getDocumentHistory(id, fromDate, toDate);
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

	@Post("set-current/:id")
	@ApiOperation({
		summary: "Установить текущий JSON документ по ID",
		description: "Устанавливает указанный JSON документ как текущий активный",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "JSON документ успешно установлен как текущий",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
				message: {
					type: "string",
					example: "JSON документ установлен как текущий",
				},
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "JSON документ не найден",
	})
	async setCurrent(@Param("id") id: string) {
		await this.jsonDataService.setCurrentById(id);
		return {
			success: true,
			message: "JSON документ установлен как текущий",
		};
	}

	@Post("set-current-from-snapshot/:snapshotId")
	@ApiOperation({
		summary: "Установить текущий JSON документ из снимка",
		description:
			"Создает новый JSON документ из данных снимка и устанавливает его как текущий",
	})
	@ApiParam({
		name: "snapshotId",
		type: String,
		description: "Уникальный идентификатор снимка",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 201,
		description:
			"JSON документ успешно создан из снимка и установлен как текущий",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
				message: {
					type: "string",
					example: "JSON документ создан из снимка и установлен как текущий",
				},
				id: { type: "string", example: "uuid-string" },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: "Неверные данные запроса",
	})
	@ApiResponse({
		status: 404,
		description: "Снимок не найден",
	})
	async setCurrentFromSnapshot(@Param("snapshotId") snapshotId: string) {
		const snapshot = await this.snapshotService.getSnapshotById(snapshotId);
		const result = await this.jsonDataService.setCurrentFromSnapshot(snapshot);
		return {
			success: true,
			message: "JSON документ создан из снимка и установлен как текущий",
			id: result.id,
		};
	}
}
