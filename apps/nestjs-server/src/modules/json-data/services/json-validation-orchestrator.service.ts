import { Injectable, Inject, Logger } from "@nestjs/common";
import {
    ValidationResult,
    IntegrityResult,
    BusinessValidationResult,
    RecursionCheckResult,
    DuplicateCheckResult,
    SchemaVersionResult,
    ValidationReport,
    ComprehensiveValidationResponse
} from "../types/validation.types";
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

        // Валидация структуры
        const structureValidation = this.structureValidator.validateStructure(data);

        // Валидация целостности
        const integrityValidation = this.integrityValidator.validateIntegrity(data);

        // Валидация бизнес-правил
        const businessRulesValidation = this.businessRulesValidator.validateBusinessRules(data);

        // Валидация версии схемы
        const schemaVersionValidation = this.schemaVersionValidator.validateSchemaVersion(data);

        // Проверка версии на совместимость
        const versionCompatibility = this.versioningService.validateVersionCompatibility(
            schemaVersionValidation.version,
        );

        // Проверка на рекурсию
        const recursionCheck = this.structureValidator.checkForRecursion(
            data.entities || [],
            data.mappings || [],
        );

        // Проверка на дублирование
        const duplicateCheck = this.structureValidator.checkForDuplicates(data);

        // Нормализация данных
        const normalizedData = this.structureValidator.normalizeJsonData(data);

        // Статистика
        const statistics = this.calculateStatistics(data);

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

        const isValid =
            structureValidation.isValid &&
            integrityValidation.isValid &&
            businessRulesValidation.isValid &&
            schemaVersionValidation.isValid &&
            versionCompatibility.compatible &&
            !recursionCheck.hasRecursion &&
            !duplicateCheck.hasDuplicates;

        const response: ComprehensiveValidationResponse = {
            isValid,
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

        this.logger.log(`Комплексная валидация завершена. Результат: ${isValid ? "VALID" : "INVALID"}`);

        return response;
    }

    generateValidationReport(data: any): ValidationReport {
        const structureValidation = this.structureValidator.validateStructure(data);
        const integrityValidation = this.integrityValidator.validateIntegrity(data);
        const schemaVersionValidation = this.schemaVersionValidator.validateSchemaVersion(data);
        const statistics = this.calculateStatistics(data);

        return {
            summary: {
                isValid: structureValidation.isValid && integrityValidation.isValid && schemaVersionValidation.isValid,
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
                "Обратите внимание на предупреждения валидации перед импортом",
            );
        }

        if (!integrityValidation.isValid) {
            recommendations.push(
                "Исправьте проблемы целостности данных перед импортом",
            );
        }

        // Рекомендации по версионированию
        if (versionCompatibility.migrationRequired) {
            recommendations.push(
                `Требуется миграция данных с версии ${versionCompatibility.incomingVersion}`,
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