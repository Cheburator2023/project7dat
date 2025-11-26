import {
	Controller,
	Post,
	Body,
	Headers,
	BadRequestException,
	ConflictException,
	InternalServerErrorException,
	Logger,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiBearerAuth,
	ApiHeader,
} from "@nestjs/swagger";
import { JsonImportService } from "../services/json-import.service";
import { JsonValidationOrchestratorService } from "../services/json-validation-orchestrator.service";
import { JsonImportRequestDto } from "../dto/requests/json-import-request.dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { ComprehensiveValidationResponse } from "../types/validation.types";

@ApiBearerAuth("JWT-auth")
@ApiTags("Импорт JSON")
@Controller("json-import")
export class JsonImportController {
	private readonly logger = new Logger(JsonImportController.name);

    constructor(
        private readonly jsonImportService: JsonImportService,
        private readonly validationOrchestrator: JsonValidationOrchestratorService,
    ) {}

	@Post("surm")
	@RealmRole(Permission.DL_CREATE_JSON_DATA)
	@ApiOperation({
		summary: "Импорт JSON СУРМ в БД DL",
		description:
			"Импортирует JSON данные СУРМ в таблицы БД DL согласно маппингу",
	})
	@ApiBody({
		description: "JSON данные для импорта",
		type: JsonImportRequestDto,
	})
    @ApiHeader({
        name: 'x-user',
        description: 'Идентификатор пользователя в формате: { "id": "user-id", "username": "user-name", "email": "user@example.com" }',
        required: true,
        schema: {
            type: 'string',
            example: '{"id":"12345","username":"ivanov","email":"ivanov@company.com"}'
        }
    })
    @ApiResponse({
        status: 201,
        description: "JSON данные успешно импортированы",
        schema: {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                changeId: { type: "number", example: 123 },
                message: {
                    type: "string",
                    example: "JSON данные успешно импортированы в БД DL",
                },
                warnings: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Некоторые сущности не были изменены"],
                },
                stats: {
                    type: "object",
                    properties: {
                        entitiesProcessed: { type: "number", example: 10 },
                        attributesProcessed: { type: "number", example: 45 },
                        mappingsProcessed: { type: "number", example: 8 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: "Неверная структура JSON данных",
    })
    @ApiResponse({
        status: 409,
        description: "Конфликты при импорте или данные не проверены",
    })
    @ApiResponse({
        status: 413,
        description: "Превышен размер файла",
    })
    @ApiResponse({
        status: 429,
        description: "Превышен лимит запросов",
    })
    async importSurmJson(
        @Body() importRequest: JsonImportRequestDto,
        @Headers("x-user") userHeader: string,
    ): Promise<any> {
        this.logger.log(
            `Запрос на импорт SURM JSON от пользователя: ${userHeader}`,
        );

        try {
            const user = userHeader || importRequest.user || "system";
            const result = await this.jsonImportService.importJsonData({
                ...importRequest,
                user,
            });

			this.logger.log(
				`Импорт SURM JSON завершен успешно. Change ID: ${result.changeId}`,
			);

            return result;
        } catch (error) {
            this.logger.error(
                `Ошибка импорта SURM JSON: ${error.message}`,
                error.stack,
            );

			if (
				error instanceof BadRequestException ||
				error instanceof ConflictException
			) {
				throw error;
			}

			throw new InternalServerErrorException({
				message: "Внутренняя ошибка при импорте JSON",
				error: error.message,
                timestamp: new Date().toISOString(),
			});
		}
	}

	@Post("dapp")
	@RealmRole(Permission.DL_CREATE_JSON_DATA)
	@ApiOperation({
		summary: "Импорт JSON DAPP в БД DL",
		description:
			"Импортирует JSON данные DAPP в таблицы БД DL согласно маппингу",
	})
	@ApiBody({
		description: "JSON данные для импорта",
		type: JsonImportRequestDto,
	})
    @ApiHeader({
        name: 'x-user',
        description: 'Идентификатор пользователя в формате: { "id": "user-id", "username": "user-name", "email": "user@example.com" }',
        required: true,
        schema: {
            type: 'string',
            example: '{"id":"12345","username":"ivanov","email":"ivanov@company.com"}'
        }
    })
    @ApiResponse({
        status: 201,
        description: "JSON данные успешно импортированы",
        schema: {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                changeId: { type: "number", example: 123 },
                message: {
                    type: "string",
                    example: "JSON данные успешно импортированы в БД DL",
                },
                warnings: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Некоторые сущности не были изменены"],
                },
                stats: {
                    type: "object",
                    properties: {
                        entitiesProcessed: { type: "number", example: 10 },
                        attributesProcessed: { type: "number", example: 45 },
                        mappingsProcessed: { type: "number", example: 8 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: "Неверная структура JSON данных",
    })
    @ApiResponse({
        status: 409,
        description: "Конфликты при импорте или данные не проверены",
    })
    @ApiResponse({
        status: 413,
        description: "Превышен размер файла",
    })
    @ApiResponse({
        status: 429,
        description: "Превышен лимит запросов",
    })
    async importDappJson(
        @Body() importRequest: JsonImportRequestDto,
        @Headers("x-user") userHeader: string,
    ): Promise<any> {
        this.logger.log(
            `Запрос на импорт DAPP JSON от пользователя: ${userHeader}`,
        );

        try {
            const user = userHeader || importRequest.user || "system";
            const result = await this.jsonImportService.importJsonData({
                ...importRequest,
                user,
            });

            this.logger.log(
                `Импорт DAPP JSON завершен успешно. Change ID: ${result.changeId}`,
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Ошибка импорта DAPP JSON: ${error.message}`,
                error.stack,
            );

            if (
                error instanceof BadRequestException ||
                error instanceof ConflictException
            ) {
                throw error;
            }

            throw new InternalServerErrorException({
                message: "Внутренняя ошибка при импорте JSON",
                error: error.message,
                timestamp: new Date().toISOString(),
			});
		}
	}

	@Post("validate-comprehensive")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Комплексная валидация JSON перед импортом",
		description: "Выполняет полную проверку JSON данных на корректность",
	})
	@ApiBody({
		description: "JSON данные для валидации",
		type: JsonImportRequestDto,
	})
    @ApiHeader({
        name: 'x-user',
        description: 'Идентификатор пользователя для аудита',
        required: false,
        schema: {
            type: 'string',
            example: 'ivanov'
        }
    })
    @ApiResponse({
        status: 200,
        description: "Результаты комплексной валидации",
        type: Object,
    })
    async comprehensiveValidation(@Body() importRequest: JsonImportRequestDto): Promise<ComprehensiveValidationResponse> {
        this.logger.log("Запрос на комплексную валидацию JSON");

        try {
            const validationResult = await this.validationOrchestrator.validate(importRequest.data);
            return validationResult;
        } catch (error) {
            this.logger.error(
                `Ошибка при валидации JSON: ${error.message}`,
                error.stack,
            );
            throw new BadRequestException({
                message: "Ошибка при валидации JSON",
                error: error.message,
            });
        }
    }
}
