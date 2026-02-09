import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from "@nestjs/swagger";
import { JsonExportNewService } from "../services/json-export-new.service";
import { JsonExportNewResponseDto } from "../dto/responses/json-export-new-response.dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт JSON (Новая структура)")
@Controller("json-export-new")
export class JsonExportNewController {
    constructor(private readonly jsonExportNewService: JsonExportNewService) {}

    @Get("dl")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Экспорт данных РБД в JSON DL (новая структура)",
        description: "Экспортирует все данные из РБД Data Lineage в новый формат JSON DL согласно ТЗ. Включает process_description и заполненные atrDeps.",
    })
    @ApiResponse({
        status: 200,
        description: "Данные успешно экспортированы в новый формат JSON DL",
        type: JsonExportNewResponseDto,
    })
    async exportToJsonNewStructure(): Promise<JsonExportNewResponseDto> {
        return await this.jsonExportNewService.exportToJsonNewStructure();
    }

    @Get("test-sample")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Тестовый экспорт с образцом данных",
        description: "Возвращает образец данных в новой структуре для тестирования",
    })
    @ApiResponse({
        status: 200,
        description: "Тестовые данные успешно возвращены",
        type: JsonExportNewResponseDto,
    })
    async getTestSample(): Promise<JsonExportNewResponseDto> {
        // Возвращаем тестовые данные для проверки структуры с process_description и atrDeps
        return {
            desc: {
                change_date: new Date().toISOString(),
                default_system_code: "1642"
            },
            entities: [
                {
                    id: "BDM.ACCOUNT",
                    modified: true,
                    type: "table",
                    namespace: "BDM",
                    name: "ACCOUNT",
                    system_code: "1642",
                    entity_change: new Date().toISOString(),
                    description: "Таблица счетов",
                    container_description: "Схема BDM",
                    container_change: new Date().toISOString(),
                    attrSeq: [
                        {
                            name: "ACCOUNT_ID",
                            type: "INTEGER",
                            comment: "Идентификатор счета",
                            attr_change: new Date().toISOString()
                        },
                        {
                            name: "ACCOUNT_NAME",
                            type: "STRING",
                            comment: "Наименование счета",
                            attr_change: new Date().toISOString()
                        }
                    ]
                },
                {
                    id: "ЦФТ2.MAIN_TABLE",
                    modified: false,
                    type: "table",
                    namespace: "ЦФТ2",
                    name: "MAIN_TABLE",
                    system_code: "1642",
                    entity_change: new Date().toISOString(),
                    container_description: "Схема ЦФТ2",
                    container_change: new Date().toISOString(),
                    attrSeq: [
                        {
                            name: "ID",
                            type: "INTEGER",
                            attr_change: new Date().toISOString()
                        },
                        {
                            name: "NAME",
                            type: "STRING",
                            attr_change: new Date().toISOString()
                        }
                    ]
                }
            ],
            mappings: [
                {
                    entityId: "BDM.ACCOUNT",
                    system_code: "1642",
                    relation_change: new Date().toISOString(),
                    deps: [
                        {
                            entityId: "ЦФТ2.MAIN_TABLE",
                            system_code: "1642",
                            process: "РУЧНАЯ ЗАГРУЗКА ФАЙЛОВ ВИТРИН",
                            process_description: "Процесс ручной загрузки данных из ЦФТ2 в BDM",
                            process_change: new Date().toISOString(),
                            attrMaps: [
                                {
                                    src: "ID",
                                    dst: "ACCOUNT_ID",
                                    src_id: 123,
                                    dst_id: 456,
                                    relation_change: new Date().toISOString()
                                },
                                {
                                    src: "NAME",
                                    dst: "ACCOUNT_NAME",
                                    src_id: 124,
                                    dst_id: 457,
                                    relation_change: new Date().toISOString()
                                }
                            ],
                            atrDeps: [
                                {
                                    attr: "ID",
                                    linkTypes: ["WHERE", "JOIN"],
                                    src_id: 123,
                                    relation_change: new Date().toISOString()
                                },
                                {
                                    attr: "NAME",
                                    linkTypes: ["SELECT"],
                                    src_id: 124,
                                    relation_change: new Date().toISOString()
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }
}