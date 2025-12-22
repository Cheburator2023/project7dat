import { Injectable, Inject, Logger } from "@nestjs/common";
import {
    ValidationResult,
    IntegrityResult,
    BusinessValidationResult,
    RecursionCheckResult,
    DuplicateCheckResult,
    ValidationReport,
    ComprehensiveValidationResponse
} from "../types";
import { VersioningService } from "./versioning.service";

@Injectable()
export class JsonValidationOrchestratorService {
    private readonly logger = new Logger(JsonValidationOrchestratorService.name);

    constructor(
        @Inject('IJsonStructureValidator')
        private readonly structureValidator: any,
        @Inject('IJsonIntegrityValidator')
        private readonly integrityValidator: any,
        @Inject('IJsonBusinessRulesValidator')
        private readonly businessRulesValidator: any,
        @Inject('IJsonSchemaVersionValidator')
        private readonly schemaVersionValidator: any,
        private readonly versioningService: VersioningService,
    ) {}

    async validate(data: any): Promise<ComprehensiveValidationResponse> {
        this.logger.log("Запуск комплексной валидации JSON");

        // Сначала нормализуем данные
        const normalizedData = this.structureValidator.normalizeJsonData(data);

        // Валидация структуры на нормализованных данных
        const structureValidation = this.structureValidator.validateStructure(normalizedData);

        // Валидация целостности на нормализованных данных
        const integrityValidation = this.integrityValidator.validateIntegrity(normalizedData);

        // Валидация бизнес-правил на нормализованных данных
        const businessRulesValidation = this.businessRulesValidator.validateBusinessRules(normalizedData);

        // Валидация версии схемы
        const schemaVersionValidation = this.schemaVersionValidator.validateSchemaVersion(normalizedData);

        // Проверка версии на совместимость
        const versionCompatibility = this.versioningService.validateVersionCompatibility(
            schemaVersionValidation.version,
        );

        // Проверка на рекурсию
        const recursionCheck = this.structureValidator.checkForRecursion(
            normalizedData.entities || [],
            normalizedData.mappings || [],
        );

        // Проверка на дублирование
        const duplicateCheck = this.structureValidator.checkForDuplicates(normalizedData);

        // Статистика
        const statistics = this.calculateStatistics(normalizedData);

        // Рекомендации
        const recommendations = this.generateRecommendations(
            structureValidation,
            integrityValidation,
            businessRulesValidation,
            versionCompatibility,
            recursionCheck,
            duplicateCheck,
            statistics,
        );

        // Данные считаются валидными если нет критических ошибок структуры
        const hasCriticalErrors = structureValidation.errors.length > 0 ||
            recursionCheck.hasRecursion ||
            duplicateCheck.hasDuplicates;

        const response: ComprehensiveValidationResponse = {
            isValid: !hasCriticalErrors,
            validation: structureValidation,
            integrity: integrityValidation,
            schemaVersion: {
                ...versionCompatibility,
                version: schemaVersionValidation.version,
                supported: schemaVersionValidation.supported,
            },
            statistics,
            recursionCheck,
            duplicateCheck,
            normalizedData,
            recommendations,
        };

        this.logger.log(`Комплексная валидация завершена. Результат: ${response.isValid ? "VALID" : "INVALID"}`);

        return response;
    }

    generateValidationReport(data: any): ValidationReport {
        const normalizedData = this.structureValidator.normalizeJsonData(data);
        const structureValidation = this.structureValidator.validateStructure(normalizedData);
        const integrityValidation = this.integrityValidator.validateIntegrity(normalizedData);
        const schemaVersionValidation = this.schemaVersionValidator.validateSchemaVersion(normalizedData);
        const statistics = this.calculateStatistics(normalizedData);

        const hasCriticalErrors = structureValidation.errors.length > 0;

        return {
            summary: {
                isValid: !hasCriticalErrors,
                entitiesCount: statistics.entitiesCount,
                attributesCount: statistics.attributesCount,
                mappingsCount: statistics.mappingsCount,
                schemaVersion: schemaVersionValidation.version,
            },
            validation: structureValidation,
            integrity: integrityValidation,
            statistics,
        };
    }

    private calculateStatistics(data: any): ValidationReport['statistics'] {
        return {
            entitiesCount: data.entities?.length || 0,
            attributesCount: data.entities?.reduce(
                (acc: number, entity: any) => acc + (entity.attrSeq?.length || 0),
                0,
            ) || 0,
            mappingsCount: data.mappings?.length || 0,
            dependenciesCount: data.mappings?.reduce(
                (acc: number, mapping: any) => acc + (mapping.deps?.length || 0),
                0,
            ) || 0,
            modifiedEntitiesCount: data.entities?.filter((e: any) => e.modified).length || 0,
        };
    }

    private generateRecommendations(
        structureValidation: ValidationResult,
        integrityValidation: IntegrityResult,
        businessRulesValidation: BusinessValidationResult,
        versionCompatibility: any,
        recursionCheck: RecursionCheckResult,
        duplicateCheck: DuplicateCheckResult,
        statistics: any,
    ): string[] {
        const recommendations: string[] = [];

        // Рекомендации по валидации
        if (structureValidation.warnings.length > 0) {
            recommendations.push(
                "Обнаружены предупреждения валидации, которые будут автоматически обработаны",
            );
        }

        if (structureValidation.errors.length > 0) {
            recommendations.push(
                "Обнаружены критические ошибки валидации, требующие исправления",
            );
        }

        // Предупреждения о отсутствующих source entities - не критические
        if (integrityValidation.issues.length > 0) {
            const missingEntityWarnings = integrityValidation.issues.filter(issue =>
                issue.includes('source entity не найдена') ||
                issue.includes('target entity не найдена')
            );
            if (missingEntityWarnings.length > 0) {
                recommendations.push(
                    `Обнаружены отсутствующие сущности: ${missingEntityWarnings.length}. Они могут быть добавлены в последующих импортах.`,
                );
            }

            const criticalIssues = integrityValidation.issues.filter(issue =>
                !issue.includes('source entity не найдена') &&
                !issue.includes('target entity не найдена')
            );
            if (criticalIssues.length > 0) {
                recommendations.push(
                    "Обнаружены критические проблемы целостности данных",
                );
            }
        }

        // Рекомендации по версионированию
        if (versionCompatibility.migrationRequired) {
            recommendations.push(
                `Данные будут автоматически мигрированы с версии ${versionCompatibility.incomingVersion} на ${versionCompatibility.currentVersion}`,
            );
        }

        if (!versionCompatibility.compatible) {
            recommendations.push("Версия схемы не совместима с текущей системой");
        }

        // Рекомендации по рекурсии
        if (recursionCheck.hasRecursion) {
            recommendations.push(
                "Обнаружены рекурсивные зависимости. Проверьте логику маппингов",
            );
        }

        // Рекомендации по дублированию
        if (duplicateCheck.hasDuplicates) {
            recommendations.push("Обнаружены дублирующиеся сущности или атрибуты");
        }

        // Общие рекомендации
        if (statistics.modifiedEntitiesCount > 0) {
            recommendations.push(
                "Будут обновлены существующие сущности. Убедитесь в отсутствии конфликтов",
            );
        }

        if (statistics.entitiesCount > 50) {
            recommendations.push(
                "Большое количество сущностей. Рекомендуется разбить импорт на части",
            );
        }

        // Добавляем рекомендации из бизнес-правил
        recommendations.push(...businessRulesValidation.recommendations);

        return recommendations;
    }
}
