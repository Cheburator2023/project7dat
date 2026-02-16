import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth, ApiQuery, ApiParam, ApiProperty,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonSearchService } from "../services/json-search.service";
import {CommitType, JsonExportResponseDto, JsonSourceType} from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import {ApplyS2tCommitRequestDto} from "../dto/requests/apply-s2t-commit-request.dto";
import {IsEnum, IsOptional, IsString} from "class-validator";

class GetJsonRequestDto {
	@ApiProperty({
		description: "User who confirms apply/merge",
		required: false,
		example: "user123",
	})
	@IsOptional()
	@IsString()
	search?: string;
}

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON")
@Controller("json-search")
export class JsonSearchController {
	constructor(private readonly jsonSearchService: JsonSearchService) {}

	@Post("search")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiQuery({
		name: "search",
		required: false,
		description: "Фильтр по названию"
	})
	@ApiOperation({
		summary: "Экспорт данных РБД в JSON DL",
		description: "Экспортирует все данные из РБД Data Lineage в формат JSON DL",
	})
	@ApiResponse({
		status: 200,
		description: "Данные успешно экспортированы в JSON DL",
		type: JsonExportResponseDto,
	})

	async getJson(@Body() body: GetJsonRequestDto) {
		return await this.jsonSearchService.getJson({search:  body.search ?? ''});
	}
}
