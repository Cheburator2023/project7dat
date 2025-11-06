import {
    Controller,
    Post,
    Body,
    Headers,
    UsePipes,
    ValidationPipe,
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    Logger
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiHeader,
} from "@nestjs/swagger";
import { JsonMappingService } from "../services/json-mapping.service";
import { JsonValidationService } from "../services/json-validation.service";
import { VersioningService } from "../services/versioning.service";
import { JsonImportRequestDto } from "../dto/requests/json-import-request.dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Импорт JSON")
@Controller("json-import")
export class JsonImportController {
    private readonly logger = new Logger(JsonImportController.name);

    constructor(
        private readonly jsonMappingService: JsonMappingService,
        private readonly jsonValidationService: JsonValidationService,
        private readonly versioningService: VersioningService
    ) {}

    @Post("surm")
    @RealmRole(Permission.DL_CREATE_JSON_DATA)
    @ApiOperation({
        summary: "Импорт JSON СУРМ в БД DL",
        description: "Импортирует JSON данные СУРМ в таблицы БД DL согласно маппингу"
    })
    @ApiBody({
        description: "JSON данные для импорта",
        type: JsonImportRequestDto
    })
    @ApiHeader({
        name: "x-user",
        description: "Идентификатор пользователя",
        required: false
    })
    @ApiResponse({
        status: 201,
        description: "JSON данные успешно импортированы",
        schema: {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                changeId: { type: "number", example: 123 },
                message: { type: "string", example: "JSON данные успешно импортированы в БД DL" },
                warnings: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Некоторые сущности не были изменены"]
                },
                stats: {
                    type: "object",
                    properties: {
                        entitiesProcessed: { type: "number", example: 10 },
                        attributesProcessed: { type: "number", example: 45 },
                        mappingsProcessed: { type: "number", example: 8 }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: "Неверная структура JSON данных"
    })
    @ApiResponse({
        status: 409,
        description: "Конфликты при импорте или данные не проверены"
    })
    @ApiResponse({
        status: 413,
        description: "Превышен размер файла"
    })
    @ApiResponse({
        status: 429,
        description: "Превышен лимит запросов"
    })
    async importSurmJson(
        @Body() importRequest: JsonImportRequestDto,
        @Headers("x-user") userHeader: string
    ) {
        this.logger.log(`Запрос на импорт SURM JSON от пользователя: ${userHeader}`);

        try {
            const user = userHeader || importRequest.user || "system";

            // Комплексная валидация
            const validationReport = this.jsonValidationService.generateValidationReport(importRequest.data);

            if (!validationReport.summary.isValid) {
                this.logger.warn(`Валидация не пройдена: ${JSON.stringify(validationReport.validation.errors)}`);
                throw new BadRequestException({
                    message: "Валидация JSON не пройдена",
                    details: validationReport
                });
            }

            // Проверка версии схемы
            const versionCompatibility = this.versioningService.validateVersionCompatibility(
                validationReport.summary.schemaVersion
            );

            if (!versionCompatibility.compatible) {
                throw new BadRequestException({
                    message: "Несовместимая версия схемы",
                    details: versionCompatibility
                });
            }

            // Обработка обратной совместимости
            let processedData = importRequest.data;
            if (versionCompatibility.migrationRequired) {
                processedData = this.versioningService.migrateDataToCurrentVersion(
                    importRequest.data,
                    validationReport.summary.schemaVersion
                );
                this.logger.log(`Данные мигрированы с версии ${validationReport.summary.schemaVersion}`);
            }

            // Нормализация данных
            processedData = this.jsonValidationService.normalizeJsonData(processedData);

            // Проверка на конфликты
            const conflictCheck = await this.jsonMappingService.checkAffectedMarts(processedData.entities || []);
            if (conflictCheck.hasConflicts) {
                throw new ConflictException({
                    message: "Обнаружены конфликты при импорте",
                    conflicts: conflictCheck.conflicts
                });
            }

            // Импорт данных
            const result = await this.jsonMappingService.importJsonData({
                ...importRequest,
                data: processedData,
                user
            });

            this.logger.log(`Импорт SURM JSON завершен успешно. Change ID: ${result.changeId}`);

            return {
                ...result,
                validationSummary: validationReport.summary,
                versionInfo: versionCompatibility
            };

        } catch (error) {
            this.logger.error(`Ошибка импорта SURM JSON: ${error.message}`, error.stack);

            if (error instanceof BadRequestException || error instanceof ConflictException) {
                throw error;
            }

            throw new InternalServerErrorException({
                message: "Внутренняя ошибка при импорте JSON",
                error: error.message
            });
        }
    }

    @Post("dapp")
    @RealmRole(Permission.DL_CREATE_JSON_DATA)
    @ApiOperation({
        summary: "Импорт JSON DAPP в БД DL",
        description: "Импортирует JSON данные DAPP в таблицы БД DL согласно маппингу"
    })
    @ApiBody({
        description: "JSON данные для импорта",
        type: JsonImportRequestDto
    })
    @ApiHeader({
        name: "x-user",
        description: "Идентификатор пользователя",
        required: false
    })
    @ApiResponse({
        status: 201,
        description: "JSON данные успешно импортированы",
        schema: {
            type: "object",
            properties: {
                success: { type: "boolean", example: true },
                changeId: { type: "number", example: 123 },
                message: { type: "string", example: "JSON данные успешно импортированы в БД DL" },
                stats: {
                    type: "object",
                    properties: {
                        entitiesProcessed: { type: "number", example: 15 },
                        attributesProcessed: { type: "number", example: 67 },
                        mappingsProcessed: { type: "number", example: 12 }
                    }
                }
            }
        }
    })
    async importDappJson(
        @Body() importRequest: JsonImportRequestDto,
        @Headers("x-user") userHeader: string
    ) {
        this.logger.log(`Запрос на импорт DAPP JSON от пользователя: ${userHeader}`);

        try {
            const user = userHeader || importRequest.user || "system";

            // Комплексная валидация
            const validationReport = this.jsonValidationService.generateValidationReport(importRequest.data);

            if (!validationReport.summary.isValid) {
                this.logger.warn(`Валидация DAPP JSON не пройдена: ${JSON.stringify(validationReport.validation.errors)}`);
                throw new BadRequestException({
                    message: "Валидация JSON не пройдена",
                    details: validationReport
                });
            }

            // Для DAPP JSON дополнительная проверка специфичных полей
            const dappValidation = this.validateDappSpecificFields(importRequest.data);
            if (!dappValidation.isValid) {
                throw new BadRequestException({
                    message: "Неверная структура DAPP JSON",
                    details: dappValidation
                });
            }

            // Нормализация данных
            const processedData = this.jsonValidationService.normalizeJsonData(importRequest.data);

            // Импорт данных
            const result = await this.jsonMappingService.importJsonData({
                ...importRequest,
                data: processedData,
                user
            });

            this.logger.log(`Импорт DAPP JSON завершен успешно. Change ID: ${result.changeId}`);

            return {
                ...result,
                validationSummary: validationReport.summary,
                dappSpecific: {
                    hasUnmatched: this.hasUnmatchedEntities(importRequest.data),
                    failedMappingsCount: this.countFailedMappings(importRequest.data)
                }
            };

        } catch (error) {
            this.logger.error(`Ошибка импорта DAPP JSON: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException({
                message: "Внутренняя ошибка при импорте DAPP JSON",
                error: error.message
            });
        }
    }

    @Post("validate-comprehensive")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Комплексная валидация JSON перед импортом",
        description: "Выполняет полную проверку JSON данных на корректность"
    })
    @ApiBody({
        description: "JSON данные для валидации",
        type: JsonImportRequestDto
    })
    @ApiResponse({
        status: 200,
        description: "Результаты комплексной валидации",
        schema: {
            type: "object",
            properties: {
                isValid: { type: "boolean" },
                validation: {
                    type: "object",
                    properties: {
                        isValid: { type: "boolean" },
                        errors: { type: "array", items: { type: "string" } },
                        warnings: { type: "array", items: { type: "string" } }
                    }
                },
                integrity: {
                    type: "object",
                    properties: {
                        isValid: { type: "boolean" },
                        issues: { type: "array", items: { type: "string" } }
                    }
                },
                schemaVersion: {
                    type: "object",
                    properties: {
                        isValid: { type: "boolean" },
                        version: { type: "string" },
                        supported: { type: "boolean" },
                        message: { type: "string" }
                    }
                },
                statistics: {
                    type: "object",
                    properties: {
                        entitiesCount: { type: "number" },
                        attributesCount: { type: "number" },
                        mappingsCount: { type: "number" },
                        dependenciesCount: { type: "number" },
                        modifiedEntitiesCount: { type: "number" }
                    }
                },
                normalizedData: { type: "object" },
                recommendations: { type: "array", items: { type: "string" } }
            }
        }
    })
    async comprehensiveValidation(
        @Body() importRequest: JsonImportRequestDto
    ) {
        this.logger.log('Запрос на комплексную валидацию JSON');

        try {
            const validationReport = this.jsonValidationService.generateValidationReport(importRequest.data);

            // Проверка версии схемы
            const versionCompatibility = this.versioningService.validateVersionCompatibility(
                validationReport.summary.schemaVersion
            );

            // Проверка на рекурсию
            const recursionCheck = this.jsonMappingService.checkForRecursion(
                importRequest.data.entities || [],
                importRequest.data.mappings || []
            );

            // Проверка на дублирование
            const duplicateCheck = this.jsonMappingService.checkForDuplicates(importRequest.data);

            // Нормализованные данные
            const normalizedData = this.jsonValidationService.normalizeJsonData(importRequest.data);

            // Рекомендации
            const recommendations = this.generateRecommendations(
                validationReport,
                versionCompatibility,
                recursionCheck,
                duplicateCheck
            );

            const response = {
                isValid: validationReport.summary.isValid &&
                    validationReport.integrity.isValid &&
                    versionCompatibility.compatible &&
                    !recursionCheck.hasRecursion &&
                    !duplicateCheck.hasDuplicates,
                validation: validationReport.validation,
                integrity: validationReport.integrity,
                schemaVersion: {
                    ...versionCompatibility,
                    currentVersion: validationReport.summary.schemaVersion
                },
                statistics: validationReport.statistics,
                recursionCheck,
                duplicateCheck,
                normalizedData,
                recommendations
            };

            this.logger.log(`Комплексная валидация завершена. Результат: ${response.isValid ? 'VALID' : 'INVALID'}`);

            return response;

        } catch (error) {
            this.logger.error(`Ошибка при валидации JSON: ${error.message}`, error.stack);
            throw new BadRequestException({
                message: "Ошибка при валидации JSON",
                error: error.message
            });
        }
    }

    @Post("check-dependencies")
    @RealmRole(Permission.DL_VIEW_JSON_DATA)
    @ApiOperation({
        summary: "Проверка зависимостей сущностей",
        description: "Проверяет использование сущностей в других процессах"
    })
    @ApiBody({
        description: "Список сущностей для проверки",
        schema: {
            type: "object",
            properties: {
                entityFullNames: {
                    type: "array",
                    items: { type: "string" },
                    example: ["schema1.table1", "schema2.view1"]
                },
                currentProcessId: {
                    type: "number",
                    example: 1
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: "Результаты проверки зависимостей",
        schema: {
            type: "object",
            properties: {
                hasConflicts: { type: "boolean" },
                conflicts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            entityName: { type: "string" },
                            processes: { type: "array", items: { type: "string" } }
                        }
                    }
                },
                recommendations: { type: "array", items: { type: "string" } }
            }
        }
    })
    async checkDependencies(
        @Body() body: { entityFullNames: string[]; currentProcessId?: number }
    ) {
        this.logger.log(`Проверка зависимостей для сущностей: ${body.entityFullNames?.length || 0}`);

        if (!body.entityFullNames || !Array.isArray(body.entityFullNames)) {
            throw new BadRequestException("entityFullNames должен быть массивом");
        }

        if (body.entityFullNames.length === 0) {
            return {
                hasConflicts: false,
                conflicts: [],
                recommendations: ["Нет сущностей для проверки"]
            };
        }

        try {
            const result = await this.jsonMappingService.dependencyCheckService.checkMartUsage(
                body.entityFullNames,
                body.currentProcessId
            );

            const recommendations = this.generateDependencyRecommendations(result);

            return {
                ...result,
                recommendations
            };

        } catch (error) {
            this.logger.error(`Ошибка при проверке зависимостей: ${error.message}`, error.stack);
            throw new InternalServerErrorException({
                message: "Ошибка при проверке зависимостей",
                error: error.message
            });
        }
    }

    /**
     * Валидация специфичных полей DAPP JSON
     */
    private validateDappSpecificFields(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Проверка наличия failedMappings для DAPP
        if (data.failedMappings === undefined) {
            errors.push("DAPP JSON должен содержать поле failedMappings");
        }

        // Проверка наличия unmatched в mappings
        if (data.mappings && Array.isArray(data.mappings)) {
            data.mappings.forEach((mapping: any, index: number) => {
                if (mapping.unmatched === undefined) {
                    errors.push(`Маппинг ${index} должен содержать поле unmatched`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Проверка наличия несопоставленных сущностей
     */
    private hasUnmatchedEntities(data: any): boolean {
        if (!data.mappings || !Array.isArray(data.mappings)) {
            return false;
        }

        return data.mappings.some((mapping: any) =>
            mapping.unmatched && Array.isArray(mapping.unmatched) && mapping.unmatched.length > 0
        );
    }

    /**
     * Подсчет неудачных маппингов
     */
    private countFailedMappings(data: any): number {
        if (!data.failedMappings || !Array.isArray(data.failedMappings)) {
            return 0;
        }

        return data.failedMappings.length;
    }

    /**
     * Генерация рекомендаций на основе результатов валидации
     */
    private generateRecommendations(
        validationReport: any,
        versionCompatibility: any,
        recursionCheck: any,
        duplicateCheck: any
    ): string[] {
        const recommendations: string[] = [];

        // Рекомендации по валидации
        if (validationReport.validation.warnings.length > 0) {
            recommendations.push("Обратите внимание на предупреждения валидации перед импортом");
        }

        if (!validationReport.integrity.isValid) {
            recommendations.push("Исправьте проблемы целостности данных перед импортом");
        }

        // Рекомендации по версионированию
        if (versionCompatibility.migrationRequired) {
            recommendations.push(`Требуется миграция данных с версии ${validationReport.summary.schemaVersion}`);
        }

        if (!versionCompatibility.compatible) {
            recommendations.push("Версия схемы не совместима с текущей системой");
        }

        // Рекомендации по рекурсии
        if (recursionCheck.hasRecursion) {
            recommendations.push("Обнаружены рекурсивные зависимости. Проверьте логику маппингов");
        }

        // Рекомендации по дублированию
        if (duplicateCheck.hasDuplicates) {
            recommendations.push("Обнаружены дублирующиеся сущности или атрибуты");
        }

        // Общие рекомендации
        if (validationReport.statistics.modifiedEntitiesCount > 0) {
            recommendations.push("Будут обновлены существующие сущности. Убедитесь в отсутствии конфликтов");
        }

        if (validationReport.statistics.entitiesCount > 50) {
            recommendations.push("Большое количество сущностей. Рекомендуется разбить импорт на части");
        }

        return recommendations;
    }

    /**
     * Генерация рекомендаций по зависимостям
     */
    private generateDependencyRecommendations(result: any): string[] {
        const recommendations: string[] = [];

        if (result.hasConflicts) {
            recommendations.push("Обнаружены конфликты зависимостей. Рекомендуется:");
            recommendations.push("- Согласовать изменения с владельцами затронутых процессов");
            recommendations.push("- Выполнить импорт в период минимальной нагрузки");
            recommendations.push("- Создать бэкап данных перед импортом");
        } else {
            recommendations.push("Конфликты зависимостей не обнаружены. Импорт может быть выполнен безопасно");
        }

        if (result.conflicts.length > 3) {
            recommendations.push("Множественные конфликты. Рекомендуется поэтапный импорт");
        }

        return recommendations;
    }
}