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
			10000,
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
	 * Проверяет имена сущностей и их атрибутов на соответствие бизнес-правилам.
	 * Имя должно:
	 * - содержать только допустимые символы (буквы, цифры, дефис, подчёркивание, скобки)
	 * - содержать хотя бы одну букву или цифру (не состоять только из спецсимволов)
	 * - не быть пустым
	 * - не состоять из одного дефиса, подчёркивания и т.п.
	 * Дополнительно проверяется namespace (схема) сущности.
	 */
	private validateNaming(entities: any[], violations: string[]): void {
		if (!entities || !Array.isArray(entities)) {
			return;
		}

		entities.forEach((entity: any, index: number) => {
			// Проверка имени таблицы (entity.name)
			if (!this.isValidName(entity.name, true)) {
				violations.push(
					`Сущность ${index}: имя таблицы содержит недопустимые символы или не содержит букв/цифр: "${entity.name}"`,
				);
			}

			// Проверка схемы (entity.namespace), если она присутствует
			if (entity.namespace && !this.isValidName(entity.namespace, true)) {
				violations.push(
					`Сущность ${index}: схема (namespace) содержит недопустимые символы или не содержит букв/цифр: "${entity.namespace}"`,
				);
			}

			// Проверка атрибутов
			if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
				entity.attrSeq.forEach((attr: any, attrIndex: number) => {
					if (!this.isValidName(attr.name, true)) {
						violations.push(
							`Сущность ${index}, атрибут ${attrIndex}: имя атрибута содержит недопустимые символы или не содержит букв/цифр: "${attr.name}"`,
						);
					}
				});
			}
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
	 * Проверяет, является ли имя допустимым согласно бизнес-правилам.
	 * @param name - проверяемое имя
	 * @param requireAlphanumeric - требовать наличия хотя бы одной буквы или цифры
	 */
	private isValidName(name: string, requireAlphanumeric = true): boolean {
		if (!name || typeof name !== "string") {
			return false;
		}

		// Проверка на пустую строку или только пробелы
		if (name.trim().length === 0) {
			return false;
		}

		// Допустимые символы: буквы (русские и латинские), цифры, дефис, подчёркивание, пробел, скобки
		const validNameRegex = /^[а-яА-Яa-zA-Z0-9_\-()\s]+$/;
		if (!validNameRegex.test(name)) {
			return false;
		}

		// Если требуется наличие хотя бы одной буквы или цифры (чтобы избежать имён типа "---", "___")
		if (requireAlphanumeric) {
			// Проверяем наличие хотя бы одного алфавитно-цифрового символа
			const hasAlphanumeric = /[а-яА-Яa-zA-Z0-9]/.test(name);
			if (!hasAlphanumeric) {
				return false;
			}
		}

		return true;
	}
}
