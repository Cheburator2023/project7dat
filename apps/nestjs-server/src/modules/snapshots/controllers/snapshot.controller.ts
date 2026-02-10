import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    Delete,
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

@ApiTags("Снепшоты (Snapshots)")
@Controller("snapshots")
export class SnapshotController {
    constructor(private readonly snapshotService: SnapshotService) {}

    @Post()
    @ApiOperation({
        summary: "Создание снимка модели данных",
        description: "Создает снимок текущей модели данных системы Data Lineage",
    })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                user: {
                    type: "string",
                    description: "ФИО пользователя, который внес изменения",
                    example: "Иванов Иван Иванович",
                },
                snapshot_json: {
                    type: "object",
                    description: "JSON текущей модели данных",
                },
            },
            required: ["user", "snapshot_json"],
        },
    })
    @ApiResponse({
        status: 201,
        description: "Снимок успешно создан",
        schema: {
            type: "object",
            properties: {
                snapshot_id: { type: "string", example: "uuid-string" },
                timestamp: { type: "string", format: "date-time" },
                user: { type: "string", example: "Иванов Иван Иванович" },
                snapshot_json: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        },
    })
    async createSnapshot(
        @Body() body: { user: string; snapshot_json: Record<string, any> },
    ) {
        const snapshot = await this.snapshotService.createSnapshot(body.user, body.snapshot_json);

        return {
            snapshot_id: snapshot.snapshot_id,
            timestamp: snapshot.timestamp,
            user: snapshot.user,
            snapshot_json: snapshot.snapshot_json,
            created_at: snapshot.created_at,
            updated_at: snapshot.updated_at,
        };
    }

    @Get()
    @ApiOperation({
        summary: "Получение списка снимков",
        description: "Возвращает список всех снимков модели данных",
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
        description: "Список снимков успешно получен",
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            snapshot_id: { type: "string" },
                            timestamp: { type: "string", format: "date-time" },
                            user: { type: "string" },
                            snapshot_json: { type: "object" },
                            created_at: { type: "string", format: "date-time" },
                            updated_at: { type: "string", format: "date-time" },
                        },
                    },
                },
                total: { type: "number" },
                page: { type: "number" },
                limit: { type: "number" },
                totalPages: { type: "number" },
            },
        },
    })
    async getSnapshots(@Query() query: any) {
        try {
            const page = query.page ? Number.parseInt(query.page, 10) : 1;
            const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;

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

            const result = await this.snapshotService.getAllSnapshotsWithPagination({
                page,
                limit,
                search: query.search,
            });

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
        summary: "Получение снимка по ID",
        description: "Возвращает снимок модели данных по его идентификатору",
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
                snapshot_id: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
                user: { type: "string" },
                snapshot_json: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: "Снимок не найден",
    })
    async getSnapshot(@Param("id") id: string) {
        const snapshot = await this.snapshotService.getSnapshotById(id);
        return {
            snapshot_id: snapshot.snapshot_id,
            timestamp: snapshot.timestamp,
            user: snapshot.user,
            snapshot_json: snapshot.snapshot_json,
            created_at: snapshot.created_at,
            updated_at: snapshot.updated_at,
        };
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Удаление снимка",
        description: "Удаляет снимок модели данных по его идентификатору",
    })
    @ApiParam({
        name: "id",
        description: "Идентификатор снимка",
        example: "uuid-string",
    })
    @ApiResponse({
        status: 200,
        description: "Снимок успешно удален",
        schema: {
            type: "object",
            properties: {
                deleted: { type: "boolean", example: true },
            },
        },
    })
    async deleteSnapshot(@Param("id") id: string) {
        return await this.snapshotService.deleteSnapshot(id);
    }

    @Get("latest")
    @ApiOperation({
        summary: "Получение последнего снимка",
        description: "Возвращает последний созданный снимок модели данных",
    })
    @ApiResponse({
        status: 200,
        description: "Последний снимок найден",
        schema: {
            type: "object",
            properties: {
                snapshot_id: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
                user: { type: "string" },
                snapshot_json: { type: "object" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: "Снимки не найдены",
    })
    async getLatestSnapshot() {
        const snapshot = await this.snapshotService.getLatestSnapshot();
        if (!snapshot) {
            throw new BadRequestException("Снимки не найдены");
        }
        return {
            snapshot_id: snapshot.snapshot_id,
            timestamp: snapshot.timestamp,
            user: snapshot.user,
            snapshot_json: snapshot.snapshot_json,
            created_at: snapshot.created_at,
            updated_at: snapshot.updated_at,
        };
    }
}