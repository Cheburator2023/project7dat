import {
	Controller,
	Post,
	Get,
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
} from "@nestjs/swagger";
import { SnapshotService } from "../services/snapshot.service";
import {
	CreateSnapshotInput,
	GetSnapshotListSchema,
} from "../schemas/snapshot.schema";

@ApiTags("Снепшоты")
@Controller("api/snapshots")
export class SnapshotController {
	constructor(private readonly snapshotService: SnapshotService) {}

	@Post("create")
	@ApiOperation({
		summary: "Создать снимок текущих JSON данных",
		description: "Создает снимок текущего состояния JSON данных",
	})
	@ApiBody({
		description: "Параметры для создания снимка",
		schema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Название снимка (опционально)",
					example: "Снимок от 2024-01-15",
				},
				description: {
					type: "string",
					description: "Описание снимка (опционально)",
					example: "Снимок перед важными изменениями",
				},
			},
		},
	})
	@ApiResponse({
		status: 201,
		description: "Снимок успешно создан",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Снимок от 2024-01-15" },
				data: { type: "object", example: { key: "value" } },
				description: { type: "string", example: "Описание снимка" },
				sourceDataId: { type: "string", example: "source-uuid" },
				createdAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Нет доступных данных для создания снимка",
	})
	async create(@Body() createSnapshotDto: CreateSnapshotInput) {
		return await this.snapshotService.createSnapshot(createSnapshotDto);
	}

	@Get("list")
	@ApiOperation({
		summary: "Получить список снимков",
		description:
			"Возвращает пагинированный список снимков с возможностью поиска",
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
		example: "важный снимок",
	})
	@ApiResponse({
		status: 200,
		description: "Список снимков успешно получен",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							name: { type: "string", example: "Снимок от 2024-01-15" },
							data: { type: "object", example: { key: "value" } },
							description: { type: "string", example: "Описание снимка" },
							sourceDataId: { type: "string", example: "source-uuid" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
				total: { type: "number", example: 50 },
				page: { type: "number", example: 1 },
				limit: { type: "number", example: 10 },
				totalPages: { type: "number", example: 5 },
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

			const validatedQuery = GetSnapshotListSchema.parse({
				page,
				limit,
				search: query.search,
			});

			const result =
				await this.snapshotService.getAllSnapshotsWithPagination(
					validatedQuery,
				);

			return {
				...result,
				page,
				limit,
				totalPages: Math.ceil(result.total / limit),
			};
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			throw new BadRequestException("Неверные параметры запроса");
		}
	}

	@Get(":id")
	@ApiOperation({
		summary: "Получить снимок по ID",
		description: "Возвращает конкретный снимок по его идентификатору",
	})
	@ApiParam({
		name: "id",
		description: "Идентификатор снимка",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "Снимок успешно найден",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				name: { type: "string", example: "Снимок от 2024-01-15" },
				data: { type: "object", example: { key: "value" } },
				description: { type: "string", example: "Описание снимка" },
				sourceDataId: { type: "string", example: "source-uuid" },
				createdAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Снимок не найден",
	})
	async findOne(@Param("id") id: string) {
		return await this.snapshotService.getSnapshotById(id);
	}
}
