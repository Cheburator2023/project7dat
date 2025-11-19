import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	Headers,
	Put,
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
import { JsonCommitService } from "../services/json-commit.service";
import { JsonDataService } from "../services/json-data.service";
import { CommitJsonDataInput } from "../schemas/json-commit.schema";
import { CreateJsonDataInput } from "../schemas/json-data.schema";
import { JsonDataEntity } from "../entities/json-data.entity";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { CurrentUser } from "src/core/auth/decorators/current-user.decorator";
import { JsonCommitResponseDto } from "../dto/responses/json-commit-response.dto";
import { CommitStatusDto } from "../dto/commit-status.dto";
import { ApplyPartialCommitRequestDto } from "../dto/requests/apply-partial-commit-request.dto";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Коммиты")
@Controller("json-commits")
export class JsonCommitController {
	constructor(
		private readonly jsonDataService: JsonDataService,
		private readonly jsonCommitService: JsonCommitService,
	) {}

	@Post("initialize")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Инициализировать новый JSON с данными",
		description: "Создает новый JSON и создает начальный коммит с данными",
	})
	@ApiBody({
		description: "Данные для инициализации",
		schema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					example: "Мой JSON",
					description: "Название JSONа",
				},
				data: {
					type: "object",
					example: { entities: [], mappings: [] },
					description: "Начальные данные",
				},
				description: {
					type: "string",
					example: "Описание JSONа",
					description: "Описание JSONа",
				},
			},
			required: ["data"],
		},
	})
	@ApiResponse({
		status: 201,
		description: "JSON успешно инициализирован",
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
	async initializeGraph(
		@Body() body: CreateJsonDataInput,
		@CurrentUser() _user: any,
	): Promise<JsonDataEntity> {
		return await this.jsonDataService.initializeGraphWithData(body);
	}

	@Post("commit")
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Коммит текущего JSONа",
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
		status: 201,
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
		@CurrentUser() _user: any,
		@Headers() headers: Record<string, string>,
	) {
		try {
			if (!body.data || Object.keys(body.data).length === 0) {
				throw new BadRequestException("Commit data cannot be empty");
			}
			const author = this.extractUserFromHeaders(headers);
			const commitData = { ...body, author };
			return await this.jsonDataService.createCommitForCurrentGraph(commitData);
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw new BadRequestException({
					status: 400,
					message: error.message,
					error: "No Changes",
					timestamp: new Date().toISOString(),
				});
			}
			throw error;
		}
	}

	@Put(":id/status")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({
		summary: "Обновить статус коммита",
		description: "Изменяет статус коммита (например, при валидации)",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор коммита",
	})
	@ApiBody({ type: CommitStatusDto })
	@ApiResponse({
		status: 200,
		description: "Статус коммита успешно обновлен",
		type: JsonCommitResponseDto,
	})
	async updateCommitStatus(
		@Param("id") id: string,
		@Body() statusDto: CommitStatusDto,
	) {
		return await this.jsonCommitService.updateCommitStatus(
			id,
			statusDto.status,
		);
	}

	@Get("queue")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить очередь коммитов",
		description: "Возвращает текущее состояние очереди обработки коммитов",
	})
	@ApiResponse({
		status: 200,
		description: "Очередь коммитов успешно получена",
		type: [JsonCommitResponseDto],
	})
	async getCommitQueue() {
		return await this.jsonCommitService.getCommitQueue();
	}

	@Post("commit/:id")
	@RealmRole(Permission.DL_CREATE_COMMITS)
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
		@CurrentUser() _user: any,
		@Headers() headers: Record<string, string>,
	) {
		const author = this.extractUserFromHeaders(headers);
		const commitData = { ...body, author };
		return await this.jsonDataService.updateGraphWithCommit(id, commitData);
	}

	@Get("commits")
	@RealmRole(Permission.DL_VIEW_COMMITS)
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
		description: "ID JSONа для фильтрации коммитов",
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
							short_id: { type: "string", example: "a1b2c3d4" },
							message: { type: "string", example: "Обновлены узлы графа" },
							diff: {
								type: "object",
								properties: {
									left: { type: "object", description: "Original diff data" },
									right: {
										type: "object",
										description: "Full data after changes",
									},
								},
							},
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
		@Query()
		query: any,
		@CurrentUser() _user: any,
	) {
		console.log(`[JsonCommitController] METHOD CALLED!`);
		console.log(
			`[JsonCommitController] getCommitList вызван с RAW параметрами:`,
			query,
		);

		const page = query.page ? Number.parseInt(query.page, 10) : 1;
		const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;
		const graphId = query.graphId;

		console.log(`[JsonCommitController] Обработанные параметры:`, {
			page,
			limit,
			graphId,
		});

		const result = await this.jsonCommitService.getCommitsWithPagination({
			page,
			limit,
			graphId,
		});

		const transformedData = result.data.map((commit) => {
			const { left, right } = this.extractDiffSlices(
				commit.diff,
				commit.fullData,
			);
			return {
				...commit,
				diff: {
					left,
					right,
				},
			};
		});

		console.log(`[JsonCommitController] Результат:`, result);
		return {
			...result,
			data: transformedData,
			page,
			limit,
		};
	}

	@Get("commits/all")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить все коммиты из всех JSON данных",
		description:
			"Возвращает пагинированный список всех коммитов из всех JSONов с полными метаданными",
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
		name: "dateFrom",
		required: false,
		type: String,
		description: "Дата начала поиска (ISO формат)",
		example: "2024-01-01T00:00:00.000Z",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		type: String,
		description: "Дата окончания поиска (ISO формат)",
		example: "2024-12-31T23:59:59.999Z",
	})
	@ApiQuery({
		name: "user",
		required: false,
		type: String,
		description: "Поиск по пользователю (имя или email)",
		example: "john.doe",
	})
	@ApiQuery({
		name: "query",
		required: false,
		type: String,
		description: "Поисковый запрос (сообщение коммита, ID)",
		example: "обновление",
	})
	@ApiResponse({
		status: 200,
		description: "Список всех коммитов успешно получен",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							short_id: { type: "string", example: "a1b2c3d4" },
							message: { type: "string", example: "Обновлены узлы графа" },
							diff: {
								type: "object",
								properties: {
									left: { type: "object", description: "Original diff data" },
									right: {
										type: "object",
										description: "Full data after changes",
									},
								},
							},
							fullData: { type: "object", example: {} },
							graphId: { type: "string", example: "uuid-string" },
							author: {
								type: "object",
								properties: {
									id: { type: "string" },
									username: { type: "string" },
									email: { type: "string" },
								},
							},
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
	async getAllCommitsFromAllGraphs(
		@Query() query: any,
		@CurrentUser() _user: any,
	) {
		console.log(
			`[JsonCommitController] getAllCommitsFromAllGraphs вызван с параметрами:`,
			query,
		);

		const page = query.page ? Number.parseInt(query.page, 10) : 1;
		const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;

		const params = {
			page,
			limit,
			dateFrom: query.dateFrom,
			dateTo: query.dateTo,
			user: query.user,
			query: query.query,
		};

		const result =
			await this.jsonCommitService.getAllCommitsFromAllGraphs(params);

		const transformedData = result.data.map((commit) => {
			const { left, right } = this.extractDiffSlices(
				commit.diff,
				commit.fullData,
			);
			return {
				...commit,
				diff: {
					left,
					right,
				},
			};
		});

		console.log(
			`[JsonCommitController] Возвращено коммитов: ${transformedData.length} из ${result.total}`,
		);
		return {
			...result,
			data: transformedData,
		};
	}

	@Get("commits/search/:id")
	@ApiOperation({
		summary: "Поиск коммитов по JSONу",
		description: "Поиск коммитов с фильтрацией по дате, пользователю и тексту",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "ID JSONа для поиска коммитов",
		example: "uuid-string",
	})
	@ApiQuery({
		name: "dateFrom",
		required: false,
		type: String,
		description: "Дата начала поиска (ISO формат)",
		example: "2024-01-01T00:00:00.000Z",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		type: String,
		description: "Дата окончания поиска (ISO формат)",
		example: "2024-12-31T23:59:59.999Z",
	})
	@ApiQuery({
		name: "user",
		required: false,
		type: String,
		description: "Поиск по пользователю (имя или email)",
		example: "john.doe",
	})
	@ApiQuery({
		name: "query",
		required: false,
		type: String,
		description: "Поисковый запрос (сообщение коммита, ID)",
		example: "обновление",
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
		description: "Количество элементов на странице",
		example: 10,
	})
	@ApiResponse({
		status: 200,
		description: "Результаты поиска коммитов",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							short_id: { type: "string", example: "a1b2c3d4" },
							message: { type: "string", example: "Обновлены узлы графа" },
							diff: {
								type: "object",
								properties: {
									left: { type: "object", description: "Original diff data" },
									right: { type: "object", description: "Changed data" },
								},
							},
							graphId: { type: "string", example: "uuid-string" },
							author: {
								type: "object",
								properties: {
									id: { type: "string" },
									username: { type: "string" },
									email: { type: "string" },
								},
							},
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
	async searchCommits(
		@Param("id") graphId: string,
		@Query() query: any,
		@CurrentUser() _user: any,
	) {
		const page = query.page ? Number.parseInt(query.page, 10) : 1;
		const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;

		const searchParams = {
			dateFrom: query.dateFrom,
			dateTo: query.dateTo,
			user: query.user,
			query: query.query,
			page,
			limit,
		};

		const result = await this.jsonCommitService.searchCommits(
			graphId,
			searchParams,
		);

		const transformedData = result.data.map((commit) => {
			const { left, right } = this.extractDiffSlices(
				commit.diff,
				commit.fullData,
			);
			const { fullData, ...commitWithoutFullData } = commit;
			return {
				...commitWithoutFullData,
				diff: {
					left,
					right,
				},
			};
		});

		return {
			...result,
			data: transformedData,
			page,
			limit,
		};
	}

	@Get("commits/:id")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить коммит по ID",
		description: "Возвращает конкретный коммит по его идентификатору",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "UUID коммита в формате xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
		example: "c058a9cb-a16d-4944-b316-885beeab4604",
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно найден",
		schema: {
			type: "object",
			properties: {
				id: { type: "string", example: "uuid-string" },
				short_id: { type: "string", example: "a1b2c3d4" },
				message: { type: "string", example: "Обновлены узлы графа" },
				diff: {
					type: "object",
					properties: {
						left: { type: "object", description: "Original diff data" },
						right: { type: "object", description: "Changed data" },
					},
				},
				graphId: { type: "string", example: "uuid-string" },
				createdAt: { type: "string", format: "date-time" },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Коммит не найден",
	})
	async getCommit(@Param("id") id: string, @CurrentUser() _user: any) {
		console.log(`[JsonCommitController] Запрос коммита с ID: ${id}`);
		try {
			const commit = await this.jsonCommitService.findCommitById(id);
			const { left, right } = this.extractDiffSlices(
				commit.diff,
				commit.fullData,
			);

			// Return only diff data, not fullData to reduce response size
			const { fullData, ...commitWithoutFullData } = commit;
			return {
				...commitWithoutFullData,
				diff: {
					left,
					right,
				},
			};
		} catch (error) {
			console.error(
				`[JsonCommitController] Ошибка при получении коммита ${id}:`,
				error,
			);
			throw error;
		}
	}

	@Get("commits/:id/cumulative")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получить кумулятивные данные до указанного коммита",
		description:
			"Возвращает полные данные, восстановленные до указанного коммита включительно, со всеми предыдущими коммитами",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор коммита",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "Кумулятивные данные успешно получены",
		schema: {
			type: "object",
			properties: {
				fullData: {
					type: "object",
					description: "Полные данные на момент коммита",
				},
				commits: {
					type: "array",
					items: {
						type: "object",
						properties: {
							id: { type: "string", example: "uuid-string" },
							short_id: { type: "string", example: "a1b2c3d4" },
							message: { type: "string", example: "Обновлены узлы графа" },
							diff: { type: "object", description: "Diff данные коммита" },
							graphId: { type: "string", example: "uuid-string" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
				targetCommit: {
					type: "object",
					properties: {
						id: { type: "string", example: "uuid-string" },
						short_id: { type: "string", example: "a1b2c3d4" },
						message: { type: "string", example: "Обновлены узлы графа" },
						graphId: { type: "string", example: "uuid-string" },
						createdAt: { type: "string", format: "date-time" },
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Коммит не найден",
	})
	async getCumulativeDataAtCommit(
		@Param("id") id: string,
		@CurrentUser() _user: any,
	) {
		return await this.jsonCommitService.getCumulativeDataAtCommit(id);
	}

	@Post("commits/:id/apply")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({
		summary: "Применить коммит к JSON данным",
		description:
			"Восстанавливает полные данные на момент указанного коммита и обновляет связанный JSON граф, помечая его как текущий",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор коммита",
		example: "uuid-string",
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно применен, JSON данные обновлены",
	})
	@ApiResponse({
		status: 404,
		description: "Коммит или связанные JSON данные не найдены",
	})
	async applyCommit(@Param("id") id: string, @CurrentUser() _user: any) {
		return await this.jsonDataService.applyCommitById(id);
	}

	@Post("commits/:id/apply-partial")
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({
		summary: "Частично применить коммит к JSON данным",
		description:
			"Применяет изменения только для выбранных сущностей из коммита и обновляет связанный JSON граф, помечая его как текущий",
	})
	@ApiParam({
		name: "id",
		type: String,
		description: "Уникальный идентификатор коммита",
		example: "uuid-string",
	})
	@ApiBody({ type: ApplyPartialCommitRequestDto })
	@ApiResponse({
		status: 200,
		description: "Коммит частично применен, JSON данные обновлены",
	})
	@ApiResponse({
		status: 404,
		description: "Коммит или связанные JSON данные не найдены",
	})
	async applyPartialCommit(
		@Param("id") id: string,
		@Body() body: ApplyPartialCommitRequestDto,
		@CurrentUser() _user: any,
	) {
		return await this.jsonDataService.applyPartialCommitById(
			id,
			body.selectedEntityIds,
		);
	}

	private extractUserFromHeaders(headers: Record<string, string>) {
		const userId = headers["x-user-id"];
		const userName = headers["x-user-name"];
		const userEmail = headers["x-user-email"];

		if (userId && userName && userEmail) {
			return {
				id: userId,
				username: userName,
				email: userEmail,
			};
		}

		// Fallback to fake user for development
		return {
			id: "system-user",
			username: "system",
			email: "system@localhost",
		};
	}

	private extractDiffSlices(
		diff: Record<string, any>,
		_fullData: Record<string, any>,
	): { left: Record<string, any>; right: Record<string, any> } {
		if (diff._type === "initial") {
			return {
				left: {},
				right: diff.data,
			};
		}

		const left: Record<string, any> = {};
		const right: Record<string, any> = {};

		const extractFromDiff = (diffObj: any, path: string[] = []) => {
			for (const [key, value] of Object.entries(diffObj)) {
				const currentPath = [...path, key];

				if (Array.isArray(value) && value.length === 2) {
					this.setNestedValue(left, currentPath, value[0]);
					this.setNestedValue(right, currentPath, value[1]);
				} else if (Array.isArray(value) && value.length === 1) {
					this.setNestedValue(right, currentPath, value[0]);
				} else if (
					Array.isArray(value) &&
					value.length === 3 &&
					value[2] === 0
				) {
					this.setNestedValue(left, currentPath, value[0]);
				} else if (
					typeof value === "object" &&
					value !== null &&
					!Array.isArray(value)
				) {
					extractFromDiff(value, currentPath);
				}
			}
		};

		extractFromDiff(diff);
		return { left, right };
	}

	private setNestedValue(
		obj: Record<string, any>,
		path: string[],
		value: any,
	): void {
		let current = obj;
		for (let i = 0; i < path.length - 1; i++) {
			if (!(path[i] in current)) {
				current[path[i]] = {};
			}
			current = current[path[i]];
		}
		current[path[path.length - 1]] = value;
	}
}
