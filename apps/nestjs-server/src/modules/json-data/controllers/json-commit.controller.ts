import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	HttpCode,
	HttpStatus,
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
import { JsonCommitService } from "../services/json-commit.service";
import {
	JsonCommitSaveRequestDto,
	CommitType,
	JsonCommitStatusUpdateDto,
	JsonCommitResponseDto,
	JsonCommitListResponseDto,
} from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { JsonCommitEntity } from "../entities/json-commit.entity";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Коммиты")
@Controller("json-commits")
export class JsonCommitController {
	constructor(private readonly jsonCommitService: JsonCommitService) {}

	@Get("grouped/original")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary:
			"Получение сгруппированных коммитов (оригиналы с пользовательскими версиями)",
		description:
			"Возвращает оригинальные коммиты с их пользовательскими версиями",
	})
	@ApiResponse({
		status: 200,
		description: "Сгруппированные коммиты успешно получены",
		schema: {
			type: "object",
			properties: {
				commits: {
					type: "array",
					items: {
						type: "object",
						properties: {
							original: { $ref: "#/components/schemas/JsonCommitResponseDto" },
							user_versions: {
								type: "array",
								items: { $ref: "#/components/schemas/JsonCommitResponseDto" },
							},
						},
					},
				},
			},
		},
	})
	async getGroupedCommits(): Promise<{
		commits: Array<{
			original: JsonCommitResponseDto;
			user_versions: JsonCommitResponseDto[];
		}>;
	}> {
		const originalCommits = await this.jsonCommitService.getOriginalCommits();

		const groupedCommits = await Promise.all(
			originalCommits.map(async (original) => {
				const userVersions =
					await this.jsonCommitService.getUserVersionsByOriginal(
						original.commit_id,
					);
				return {
					original: this.mapEntityToDto(original),
					user_versions: userVersions.map((version) =>
						this.mapEntityToDto(version),
					),
				};
			}),
		);

		return { commits: groupedCommits };
	}

	@Get()
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получение списка всех коммитов",
		description:
			"Возвращает все коммиты во всех статусах согласно документации",
	})
	@ApiResponse({
		status: 200,
		description: "Список коммитов успешно получен",
		type: JsonCommitListResponseDto,
	})
	async getAllCommits(): Promise<JsonCommitListResponseDto> {
		const commits = await this.jsonCommitService.getAllCommits();
		return {
			commits: commits.map((commit) => this.mapEntityToDto(commit)),
			total: commits.length,
		};
	}

	@Get(":id")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получение коммита по ID",
		description: "Возвращает коммит по его идентификатору",
	})
	@ApiParam({
		name: "id",
		description: "GUID коммита",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно найден",
		type: JsonCommitResponseDto,
	})
	@ApiResponse({
		status: 404,
		description: "Коммит не найден",
	})
	async getCommit(@Param("id") id: string): Promise<JsonCommitResponseDto> {
		const commit = await this.jsonCommitService.getCommitById(id);
		return this.mapEntityToDto(commit);
	}

	@Post()
	@RealmRole(Permission.DL_CREATE_COMMITS)
	@ApiOperation({
		summary: "Сохранение коммита",
		description: "Сохранение оригинального или пользовательской версии коммита",
	})
	@ApiBody({ type: JsonCommitSaveRequestDto })
	@ApiResponse({
		status: 201,
		description: "Коммит успешно сохранен",
		type: JsonCommitResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Неверные данные запроса",
	})
	async saveCommit(
		@Body() saveDto: JsonCommitSaveRequestDto,
	): Promise<JsonCommitResponseDto> {
		const commit = await this.jsonCommitService.saveCommit(saveDto);
		return this.mapEntityToDto(commit);
	}

	@Post("status")
	@HttpCode(HttpStatus.OK)
	@RealmRole(Permission.DL_UPDATE_COMMITS)
	@ApiOperation({
		summary: "Смена статуса коммитов",
		description:
			"Изменение статуса всех коммитов в статусе 'processing' на 'done'",
	})
	@ApiBody({ type: JsonCommitStatusUpdateDto })
	@ApiResponse({
		status: 200,
		description: "Статусы коммитов успешно обновлены",
		schema: {
			type: "object",
			properties: {
				updated: {
					type: "number",
					example: 5,
				},
			},
		},
	})
	async updateCommitStatus(
		@Body() statusDto: JsonCommitStatusUpdateDto,
	): Promise<{ updated: number }> {
		// Согласно документации, можно изменить статус только на 'done'
		if (statusDto.state !== "done") {
			throw new BadRequestException("Можно изменить статус только на 'done'");
		}
		return await this.jsonCommitService.updateCommitStatus();
	}

	@Get("parent/:parentId")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получение коммитов по родительскому ID",
		description:
			"Возвращает оригинальный коммит и все его пользовательские версии",
	})
	@ApiParam({
		name: "parentId",
		description: "GUID родительского коммита",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@ApiResponse({
		status: 200,
		description: "Список коммитов успешно получен",
		type: JsonCommitListResponseDto,
	})
	async getCommitsByParent(
		@Param("parentId") parentId: string,
	): Promise<JsonCommitListResponseDto> {
		const commits = await this.jsonCommitService.getCommitsByParent(parentId);
		return {
			commits: commits.map((commit) => this.mapEntityToDto(commit)),
			total: commits.length,
		};
	}

	@Delete(":id")
	@HttpCode(HttpStatus.OK)
	@RealmRole(Permission.DL_DELETE_COMMITS)
	@ApiOperation({
		summary: "Удаление коммита",
		description:
			"Удаление пользовательской версии коммита (оригинал удалить нельзя)",
	})
	@ApiParam({
		name: "id",
		description: "GUID коммита для удаления",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@ApiResponse({
		status: 200,
		description: "Коммит успешно удален",
		schema: {
			type: "object",
			properties: {
				deleted: {
					type: "boolean",
					example: true,
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description:
			"Нельзя удалить оригинальный коммит или коммит в статусе 'done'",
	})
	async deleteCommit(@Param("id") id: string): Promise<{ deleted: boolean }> {
		return await this.jsonCommitService.deleteCommit(id);
	}

	@Get("type/:type")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получение коммитов по типу",
		description: "Возвращает коммиты указанного типа",
	})
	@ApiParam({
		name: "type",
		description: "Тип коммита",
		enum: CommitType,
	})
	@ApiResponse({
		status: 200,
		description: "Список коммитов успешно получен",
		type: JsonCommitListResponseDto,
	})
	async getCommitsByType(
		@Param("type") type: CommitType,
	): Promise<JsonCommitListResponseDto> {
		const commits = await this.jsonCommitService.getCommitsByType(type);
		return {
			commits: commits.map((commit) => this.mapEntityToDto(commit)),
			total: commits.length,
		};
	}

	@Get("user/:user")
	@RealmRole(Permission.DL_VIEW_COMMITS)
	@ApiOperation({
		summary: "Получение коммитов по пользователю",
		description: "Возвращает коммиты указанного пользователя",
	})
	@ApiParam({
		name: "user",
		description: "ФИО пользователя",
		example: "Иванов Иван Иванович",
	})
	@ApiQuery({
		name: "type",
		required: false,
		description: "Фильтр по типу коммита",
		enum: CommitType,
	})
	@ApiResponse({
		status: 200,
		description: "Список коммитов успешно получен",
		type: JsonCommitListResponseDto,
	})
	async getCommitsByUser(
		@Param("user") user: string,
		@Query("type") type?: CommitType,
	): Promise<JsonCommitListResponseDto> {
		let commits;

		if (type) {
			const allCommits = await this.jsonCommitService.getCommitsByUser(user);
			commits = allCommits.filter((commit) => commit.type === type);
		} else {
			commits = await this.jsonCommitService.getCommitsByUser(user);
		}

		return {
			commits: commits.map((commit) => this.mapEntityToDto(commit)),
			total: commits.length,
		};
	}

	/**
	 * Преобразование сущности в DTO
	 */
	private mapEntityToDto(entity: JsonCommitEntity): JsonCommitResponseDto {
		return {
			commit_id: entity.commit_id,
			timestamp: entity.timestamp,
			user: entity.user,
			parent_id: entity.parent_id,
			commit_name: entity.commit_name,
			commit_description: entity.commit_description,
			state: entity.state,
			commit: entity.commit || null,
			type: entity.type,
			created_at: entity.created_at,
			updated_at: entity.updated_at,
		};
	}
}
