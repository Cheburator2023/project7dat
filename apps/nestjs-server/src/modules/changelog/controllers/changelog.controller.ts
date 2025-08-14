import { Controller, Get, Param, Query } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from "@nestjs/swagger";
import { ChangelogService } from "../services/changelog.service";
import {
	ChangelogResponseDto,
	GetChangelogQueryDto,
} from "../schemas/changelog.schema";

@ApiTags("changelog")
@Controller("api/changelog")
export class ChangelogController {
	constructor(private readonly changelogService: ChangelogService) {}

	@Get()
	@ApiOperation({ summary: "Получить общий changelog всех графиков" })
	@ApiResponse({
		status: 200,
		description: "Список изменений всех графиков",
		type: ChangelogResponseDto,
	})
	@ApiQuery({ name: "page", required: false, description: "Номер страницы" })
	@ApiQuery({ name: "limit", required: false, description: "Размер страницы" })
	@ApiQuery({
		name: "actionType",
		required: false,
		description: "Фильтр по типу действия",
	})
	@ApiQuery({
		name: "author",
		required: false,
		description: "Фильтр по автору",
	})
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Дата начала периода",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Дата окончания периода",
	})
	async getAllChangelog(
		@Query() query: GetChangelogQueryDto,
	): Promise<ChangelogResponseDto> {
		return this.changelogService.getAllChangelog(query);
	}

	@Get("graph/:graphId")
	@ApiOperation({ summary: "Получить changelog конкретного графика" })
	@ApiParam({ name: "graphId", description: "ID графика" })
	@ApiResponse({
		status: 200,
		description: "Список изменений графика",
		type: ChangelogResponseDto,
	})
	@ApiQuery({ name: "page", required: false, description: "Номер страницы" })
	@ApiQuery({ name: "limit", required: false, description: "Размер страницы" })
	@ApiQuery({
		name: "actionType",
		required: false,
		description: "Фильтр по типу действия",
	})
	@ApiQuery({
		name: "author",
		required: false,
		description: "Фильтр по автору",
	})
	@ApiQuery({
		name: "dateFrom",
		required: false,
		description: "Дата начала периода",
	})
	@ApiQuery({
		name: "dateTo",
		required: false,
		description: "Дата окончания периода",
	})
	async getGraphChangelog(
		@Param("graphId") graphId: string,
		@Query() query: GetChangelogQueryDto,
	): Promise<ChangelogResponseDto> {
		return this.changelogService.getChangelogForGraph(graphId, query);
	}
}
