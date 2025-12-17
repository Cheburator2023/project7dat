import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonExportResponseDto } from "../dto/responses/json-export-response.dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON")
@Controller("json-export")
export class JsonExportController {
    constructor(private readonly jsonExportService: JsonExportService) {}

    @Get("dl")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Экспорт данных РБД в JSON DL",
        description: "Экспортирует все данные из РБД Data Lineage в формат JSON DL согласно документации",
    })
    @ApiResponse({
        status: 200,
        description: "Данные успешно экспортированы в JSON DL",
        type: JsonExportResponseDto,
    })
    async exportToJson(): Promise<JsonExportResponseDto> {
        return await this.jsonExportService.exportToJson();
    }

    @Get("dl/change/:changeId")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Экспорт данных РБД в JSON DL по change_id",
        description: "Экспортирует данные из РБД Data Lineage на момент указанного change_id",
    })
    @ApiParam({
        name: "changeId",
        type: Number,
        description: "Идентификатор изменения",
        example: 12345,
    })
    @ApiResponse({
        status: 200,
        description: "Данные успешно экспортированы в JSON DL",
        type: JsonExportResponseDto,
    })
    async exportToJsonByChange(
        @Param("changeId", ParseIntPipe) changeId: number,
    ): Promise<JsonExportResponseDto> {
        return await this.jsonExportService.exportByChangeId(changeId);
    }
}
