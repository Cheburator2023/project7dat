import { Injectable, Logger } from "@nestjs/common";
import { IntegrityResult } from "../types";
import { JsonIntegrityValidator } from "./interfaces/validation.interfaces";

@Injectable()
export class JsonIntegrityValidationService extends JsonIntegrityValidator {
	private readonly logger = new Logger(JsonIntegrityValidationService.name);

	validateIntegrity(data: any): IntegrityResult {
		const issues: string[] = [];

		if (!data.entities || !data.mappings) {
			return { isValid: false, issues: ["Отсутствуют entities или mappings"] };
		}

		this.validateReferentialIntegrity(data, issues);

		// Отсутствие source entities НЕ считается критической ошибкой целостности
		const hasCriticalIssues = issues.some(
			(issue) =>
				!issue.includes("source entity не найдена") &&
				!issue.includes("target entity не найдена"),
		);

		return {
			isValid: !hasCriticalIssues,
			issues,
		};
	}

	private validateReferentialIntegrity(data: any, issues: string[]): void {
		if (!data.mappings || !Array.isArray(data.mappings)) {
			return;
		}

		data.mappings.forEach((mapping: any, index: number) => {
			const targetEntity = data.entities.find(
				(e: any) => e.id === mapping.entityId,
			);
			if (!targetEntity) {
				// Отсутствие target entity - предупреждение
				issues.push(
					`Маппинг ${index}: target entity не найдена: ${mapping.entityId}`,
				);
			}

			if (mapping.deps && Array.isArray(mapping.deps)) {
				mapping.deps.forEach((dep: any, depIndex: number) => {
					this.validateDependencyIntegrity(
						dep,
						mapping,
						index,
						depIndex,
						data,
						issues,
					);
				});
			}
		});
	}

	private validateDependencyIntegrity(
		dep: any,
		mapping: any,
		mappingIndex: number,
		depIndex: number,
		data: any,
		issues: string[],
	): void {
		const sourceEntity = data.entities.find((e: any) => e.id === dep.entityId);
		if (!sourceEntity) {
			// Отсутствие source entity - предупреждение
			issues.push(
				`Маппинг ${mappingIndex}, зависимость ${depIndex}: source entity не найдена: ${dep.entityId}`,
			);
		}

		const targetEntity = data.entities.find(
			(e: any) => e.id === mapping.entityId,
		);

		this.validateAttributeMapsIntegrity(
			dep,
			mappingIndex,
			depIndex,
			sourceEntity,
			targetEntity,
			issues,
		);
		this.validateAttributeDepsIntegrity(
			dep,
			mappingIndex,
			depIndex,
			sourceEntity,
			issues,
		);
	}

	private validateAttributeMapsIntegrity(
		dep: any,
		mappingIndex: number,
		depIndex: number,
		sourceEntity: any,
		targetEntity: any,
		issues: string[],
	): void {
		if (!dep.attrMaps || !Array.isArray(dep.attrMaps)) {
			return;
		}

		dep.attrMaps.forEach((attrMap: any, attrMapIndex: number) => {
			if (sourceEntity && sourceEntity.attrSeq) {
				const srcAttr = sourceEntity.attrSeq.find(
					(a: any) => a.name === attrMap.src,
				);
				if (!srcAttr) {
					// Отсутствие source атрибута - критическая ошибка
					issues.push(
						`Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: source атрибут не найден: ${attrMap.src}`,
					);
				}
			}

			if (targetEntity && targetEntity.attrSeq) {
				const dstAttr = targetEntity.attrSeq.find(
					(a: any) => a.name === attrMap.dst,
				);
				if (!dstAttr) {
					// Отсутствие target атрибута - критическая ошибка
					issues.push(
						`Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: target атрибут не найден: ${attrMap.dst}`,
					);
				}
			}
		});
	}

	private validateAttributeDepsIntegrity(
		dep: any,
		mappingIndex: number,
		depIndex: number,
		sourceEntity: any,
		issues: string[],
	): void {
		if (!dep.atrDeps || !Array.isArray(dep.atrDeps)) {
			return;
		}

		dep.atrDeps.forEach((attrDep: any, attrDepIndex: number) => {
			if (sourceEntity && sourceEntity.attrSeq) {
				const srcAttr = sourceEntity.attrSeq.find(
					(a: any) => a.name === attrDep.attr,
				);
				if (!srcAttr) {
					// Отсутствие source атрибута для функциональной зависимости - критическая ошибка
					issues.push(
						`Маппинг ${mappingIndex}, зависимость ${depIndex}, attrDep ${attrDepIndex}: source атрибут не найден: ${attrDep.attr}`,
					);
				}
			}
		});
	}
}
