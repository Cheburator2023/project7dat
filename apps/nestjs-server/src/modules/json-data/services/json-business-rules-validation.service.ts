import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BusinessValidationResult } from "../types";
import { JsonBusinessRulesValidator } from "./interfaces/validation.interfaces";

@Injectable()
export class JsonBusinessRulesValidationService extends JsonBusinessRulesValidator {
	private readonly maxEntities: number;

    constructor(private readonly configService: ConfigService) {
        super();
        this.maxEntities = this.configService.get<number>(
            "MAX_ENTITIES_PER_IMPORT",
            1000,
        );
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

    /**
     * Проверяет имена сущностей и их контейнеров (namespace) на соответствие бизнес-правилам.
     * Требования:
     * - имя не должно быть пустым или состоять только из пробелов
     * - должно содержать хотя бы одну букву (русскую или латинскую) или цифру
     *   (чтобы отсечь имена, состоящие только из спецсимволов, например "---")
     * - любые печатные символы разрешены (пробелы, точка, плюс, кавычки, скобки и т.д.)
     * Атрибуты не проверяются, так как для них допустимы другие символы (например, точка).
     */
    private validateNaming(entities: any[], violations: string[]): void {
        if (!entities || !Array.isArray(entities)) {
            return;
        }

        entities.forEach((entity: any, index: number) => {
            // Проверка имени таблицы (entity.name)
            if (!this.isValidEntityName(entity.name)) {
                violations.push(
                    `Сущность ${index}: имя таблицы содержит недопустимые символы или не содержит букв/цифр: "${entity.name}"`,
                );
            }

            // Проверка схемы (entity.namespace), если она присутствует
            if (entity.namespace && !this.isValidEntityName(entity.namespace)) {
                violations.push(
                    `Сущность ${index}: схема (namespace) содержит недопустимые символы или не содержит букв/цифр: "${entity.namespace}"`,
                );
            }

            // Атрибуты не проверяются (допускают точку и другие символы)
        });
    }

	private validateLimits(
		data: any,
		violations: string[],
		recommendations: string[],
	): void {
		const entitiesCount = data.entities?.length || 0;
		const attributesCount =
			data.entities?.reduce(
				(acc: number, entity: any) => acc + (entity.attrSeq?.length || 0),
				0,
			) || 0;

		if (entitiesCount > this.maxEntities) {
			violations.push(
				`Превышено максимальное количество сущностей: ${entitiesCount}`,
			);
		}

		if (attributesCount > 1000) {
			recommendations.push(
				"Большое количество атрибутов. Рассмотрите оптимизацию структуры данных.",
			);
		}

		if (entitiesCount > 50) {
			recommendations.push(
				"Большое количество сущностей. Рекомендуется разбить импорт на части",
			);
		}
	}

    /**
     * Проверяет, является ли имя сущности (таблицы или схемы) допустимым.
     * Правила:
     * - не пустое и не только из пробелов
     * - содержит хотя бы одну букву (русскую/латинскую) или цифру
     * - не содержит управляющих символов (опционально, но для безопасности)
     */
    private isValidEntityName(name: string): boolean {
        if (!name || typeof name !== "string") {
            return false;
        }
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return false;
        }
        // Проверка наличия хотя бы одной буквы или цифры (включая русские)
        const hasAlphanumeric = /[а-яА-Яa-zA-Z0-9]/.test(trimmed);
        if (!hasAlphanumeric) {
            return false;
        }
        // Запрещаем только управляющие символы (непечатные)
        // Разрешаем всё, кроме управляющих (ASCII < 32, DEL 127)
        // Можно использовать regex на запрещённые, но проще разрешить любые печатные
        // Следующая проверка необязательна, но для полноты:
        const hasControlChar = /[\x00-\x1F\x7F]/.test(trimmed);
        return !hasControlChar;
    }
}
