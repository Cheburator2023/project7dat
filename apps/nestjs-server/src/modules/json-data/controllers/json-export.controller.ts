import {BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonExportResponseDto } from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { EntityExportPaginatedResponseDto } from "../dto/responses/entity-export-paginated.dto";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON")
@Controller("json-export")
export class JsonExportController {
	constructor(private readonly jsonExportService: JsonExportService) {}

	@Get("dl")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Экспорт данных РБД в JSON DL",
		description: "Экспортирует все данные из РБД Data Lineage в формат JSON DL",
	})
	@ApiResponse({
		status: 200,
		description: "Данные успешно экспортированы в JSON DL",
		type: JsonExportResponseDto,
	})
	async exportToJson(): Promise<JsonExportResponseDto> {
		return await this.jsonExportService.exportToJson();
	}

	@Get('entity/:fullName')
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: 'Экспорт связей сущности с пагинацией',
		description: 'Возвращает JSON с маппингами и зависимостями для указанной сущности с поддержкой пагинации',
	})
	@ApiParam({
		name: 'fullName',
		description: 'Полное имя сущности (например "schema.table")',
		example: 'prod_dm.sales_fact',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Номер страницы',
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Количество маппингов на странице',
		example: 20,
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['name', 'change_date'],
		description: 'Поле сортировки маппингов',
		example: 'name',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: ['ASC', 'DESC'],
		description: 'Направление сортировки',
		example: 'ASC',
	})
	@ApiResponse({
		status: 200,
		description: 'Успешный экспорт',
		type: EntityExportPaginatedResponseDto,
	})
	async exportEntityRelationsPaginated(
		@Param('fullName') fullName: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('sortBy') sortBy?: 'name' | 'change_date',
		@Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
	): Promise<EntityExportPaginatedResponseDto> {
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 20;
		const validSortBy = sortBy ?? 'name';
		const validSortOrder = sortOrder ?? 'ASC';

		if (isNaN(pageNum) || pageNum < 1) {
			throw new BadRequestException('page должен быть положительным числом');
		}
		if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
			throw new BadRequestException('limit должен быть числом от 1 до 100');
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
