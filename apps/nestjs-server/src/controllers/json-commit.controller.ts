import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	ValidationPipe,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
	ApiBody,
} from "@nestjs/swagger";
import { JsonCommitService } from "../services/json-commit.service";
import { JsonDataService } from "../services/json-data.service";
import {
	CommitJsonDataInput,
	GetCommitListInput,
} from "../schemas/json-commit.schema";

@ApiTags("JSON Коммиты")
@Controller("api/json-data")
export class JsonCommitController {
	constructor(
		private readonly jsonCommitService: JsonCommitService,
		private readonly jsonDataService: JsonDataService,
	) {}

	@Post("commit")
	@ApiOperation({
		summary: "Коммит текущего графика",
		description: "Создает коммит для текущего активного JSON документа",
	})
	@ApiBody({
		description: "Данные для коммита",
		schema: {
			type: "object",
			properties: {
				message: {
					type: "string",
					example: "Обновлены узлы графа",
					description: "Сообщение коммита",
				},
				data: {
					type: "object",
					example: { entities: [], mappings: [] },
					description: "Данные для коммита",
				},
			},
			required: ["message", "data"],
		},
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно создан",
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
	async commitCurrent(
		@Body()
		body: CommitJsonDataInput,
	) {
		return await this.jsonDataService.createCommitForCurrentGraph(body);
	}

	@Post("commit/:id")
	@ApiOperation({
		summary: "Обновить JSON с коммитом",
		description: "Обновляет JSON документ с сохранением истории изменений",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор JSON документа",
		example: "uuid-string",
	})
	@ApiBody({
		description: "Данные для коммита",
		schema: {
			type: "object",
			properties: {
				message: {
					type: "string",
					example: "Обновлены узлы графа",
					description: "Сообщение коммита",
				},
				data: {
					type: "object",
					example: { entities: [], mappings: [] },
					description: "Данные для коммита",
				},
			},
			required: ["message", "data"],
		},
	})
	@ApiResponse({
		status: 200,
		description: "JSON документ успешно обновлен",
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
	async updateWithCommit(
		@Param("id") id: string,
		@Body()
		body: CommitJsonDataInput,
	) {
		return await this.jsonDataService.updateGraphWithCommit(id, body);
	}

	@Get("commits")
	@ApiOperation({
		summary: "Получить список коммитов",
		description: "Возвращает пагинированный список коммитов",
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
		description:
			"Количество элементов на странице (по умолчанию 10, максимум 100)",
		example: 10,
	})
	@ApiQuery({
		name: "graphId",
		required: false,
		type: String,
		description: "ID графика для фильтрации коммитов",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "Список коммитов успешно получен",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							hash: { type: "string", example: "a1b2c3d4" },
							message: { type: "string", example: "Обновлены узлы графа" },
							diff: { type: "object", example: {} },
							fullData: { type: "object", example: {} },
							graphId: { type: "string", example: "uuid-string" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
				total: { type: "number", example: 100 },
				page: { type: "number", example: 1 },
				limit: { type: "number", example: 10 },
			},
		},
	})
	async getCommitList(
		@Query(new ValidationPipe({ transform: true }))
		query: GetCommitListInput,
	) {
		console.log(
			`[JsonCommitController] getCommitList вызван с параметрами:`,
			query,
		);
		const result = await this.jsonCommitService.getCommitsWithPagination(query);
		console.log(`[JsonCommitController] Результат:`, result);
		return {
			...result,
			page: query.page,
			limit: query.limit,
		};
	}

	@Get("commits/:id")
	@ApiOperation({
		summary: "Получить коммит по ID",
		description: "Возвращает конкретный коммит по его идентификатору",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор коммита",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно найден",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				hash: { type: "string", example: "a1b2c3d4" },
				message: { type: "string", example: "Обновлены узлы графа" },
				diff: { type: "object", example: {} },
				fullData: { type: "object", example: {} },
				graphId: { type: "string", example: "uuid-string" },
				createdAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Коммит не найден",
	})
	async getCommit(@Param("id") id: string) {
		return await this.jsonCommitService.findCommitById(id);
	}
}
