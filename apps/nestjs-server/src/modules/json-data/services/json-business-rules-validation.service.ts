import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BusinessValidationResult } from "../types/validation.types";
import { IJsonBusinessRulesValidator } from "./interfaces/validation.interfaces";

@Injectable()
export class JsonBusinessRulesValidationService implements IJsonBusinessRulesValidator {
    private readonly logger = new Logger(JsonBusinessRulesValidationService.name);
    private readonly maxEntities: number;

    constructor(private readonly configService: ConfigService) {
        this.maxEntities = this.configService.get<number>("MAX_ENTITIES_PER_IMPORT", 1000);
    }

    validateBusinessRules(data: any): BusinessValidationResult {
        const violations: string[] = [];
        const recommendations: string[] = [];

        this.validateNaming(data.entities, violations);
        this.validateLimits(data, violations, recommendations);

        return {
            isValid: violations.length === 0,
            violations,
            recommendations,
        };
    }

    private validateNaming(entities: any[], violations: string[]): void {
        if (!entities || !Array.isArray(entities)) {
            return;
        }

        entities.forEach((entity: any, index: number) => {
            if (!this.isValidName(entity.name)) {
                violations.push(
                    `Сущность ${index}: имя содержит недопустимые символы: ${entity.name}`,
                );
            }

            if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
                entity.attrSeq.forEach((attr: any, attrIndex: number) => {
                    if (!this.isValidName(attr.name)) {
                        violations.push(
                            `Сущность ${index}, атрибут ${attrIndex}: имя содержит недопустимые символы: ${attr.name}`,
                        );
                    }
                });
            }
        });
    }

    private validateLimits(data: any, violations: string[], recommendations: string[]): void {
        const entitiesCount = data.entities?.length || 0;
        const attributesCount = data.entities?.reduce(
            (acc: number, entity: any) => acc + (entity.attrSeq?.length || 0),
            0,
        ) || 0;

        if (entitiesCount > this.maxEntities) {
            violations.push(`Превышено максимальное количество сущностей: ${entitiesCount}`);
        }

        if (attributesCount > 1000) {
            recommendations.push("Большое количество атрибутов. Рассмотрите оптимизацию структуры данных.");
        }

        if (entitiesCount > 50) {
            recommendations.push("Большое количество сущностей. Рекомендуется разбить импорт на части");
        }
    }

    private isValidName(name: string): boolean {
        if (!name || typeof name !== "string") {
            return false;
        }

        const validNameRegex = /^[а-яА-Яa-zA-Z0-9_\-\s]+$/;
        return validNameRegex.test(name);
    }
}
