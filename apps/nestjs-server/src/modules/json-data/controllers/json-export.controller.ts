import { Controller, Get } from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from "@nestjs/swagger";
import { JsonExportService } from "../services/json-export.service";
import { JsonExportResponseDto } from "../dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON (Новая структура)")
@Controller("json-export")
export class JsonExportController {
    constructor(private readonly jsonExportService: JsonExportService) {}

    @Get("dl")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Экспорт данных РБД в JSON DL (новая структура)",
        description: "Экспортирует все данные из РБД Data Lineage в новый формат JSON DL согласно ТЗ. Включает process_description и заполненные atrDeps.",
    })
    @ApiResponse({
        status: 200,
        description: "Данные успешно экспортированы в новый формат JSON DL",
        type: JsonExportResponseDto,
    })
    async exportToJson(): Promise<JsonExportResponseDto> {
        return await this.jsonExportService.exportToJson();
    }
}