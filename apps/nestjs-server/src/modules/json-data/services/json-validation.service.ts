import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    ValidationResult,
    IntegrityResult,
    BusinessValidationResult,
    RecursionCheckResult,
    DuplicateCheckResult,
    SchemaVersionResult,
    ValidationReport
} from "../types/validation.types";

@Injectable()
export class JsonValidationService {
    private readonly logger = new Logger(JsonValidationService.name);
    private readonly maxJsonSize: number;
    private readonly maxEntities: number;
    private readonly maxAttributes: number;
    private readonly validEntityTypes = ["table", "view", "unresolved", "rdd"];
    private readonly validAttributeTypes = ["timestamp", "decimal", "string", "integer"];

    constructor(private readonly configService: ConfigService) {
        this.maxJsonSize = this.configService.get<number>("MAX_JSON_SIZE", 52428800);
        this.maxEntities = this.configService.get<number>("MAX_ENTITIES_PER_IMPORT", 1000);
        this.maxAttributes = this.configService.get<number>("MAX_ATTRIBUTES_PER_ENTITY", 200);
    }

    /**
     * Комплексная валидация JSON перед импортом
     */
    validateJsonForImport(data: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

		this.logger.log("Начало комплексной валидации JSON");

        // Проверка размера
        this.validateJsonSize(data, errors);

        // Проверка базовой структуры
        this.validateBasicStructure(data, errors, warnings);

        // Проверка сущностей
        this.validateEntities(data.entities, errors, warnings);

        // Проверка маппингов
        this.validateMappings(data.mappings, data.entities, errors, warnings);

        // Проверка нейминга объектов
        this.validateNaming(data.entities, errors);

        this.logger.log(
            `Валидация завершена. Ошибок: ${errors.length}, предупреждений: ${warnings.length}`,
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Проверка размера JSON
     */
    private validateJsonSize(data: any, errors: string[]): void {
        const jsonSize = JSON.stringify(data).length;
        if (jsonSize > this.maxJsonSize) {
            throw new BadRequestException(
                `Размер JSON превышает лимит: ${jsonSize} > ${this.maxJsonSize}`,
            );
        }
    }

    /**
     * Проверка базовой структуры JSON
     */
    private validateBasicStructure(data: any, errors: string[], warnings: string[]): void {
        if (!data.desc) {
            errors.push("Отсутствует объект desc");
        } else {
            if (!data.desc.appName) {
                errors.push("Отсутствует desc.appName");
            }
            if (!data.desc.appId) {
                errors.push("Отсутствует desc.appId");
            }
        }

		if (!data.entities || !Array.isArray(data.entities)) {
			errors.push("entities должен быть массивом");
		}

        if (!data.mappings || !Array.isArray(data.mappings)) {
            errors.push("mappings должен быть массивом");
        }
    }

    /**
     * Проверка сущностей
     */
    private validateEntities(entities: any[], errors: string[], warnings: string[]): void {
        if (!entities || !Array.isArray(entities)) {
            return;
        }

        // Проверка лимитов
        if (entities.length > this.maxEntities) {
            errors.push(
                `Превышено максимальное количество сущностей: ${entities.length} > ${this.maxEntities}`,
            );
        }

        entities.forEach((entity: any, index: number) => {
            this.validateSingleEntity(entity, index, errors, warnings);
        });
    }

    /**
     * Проверка отдельной сущности
     */
    private validateSingleEntity(
        entity: any,
        index: number,
        errors: string[],
        warnings: string[],
    ): void {
        if (!entity.id) {
            errors.push(`Сущность ${index}: отсутствует id`);
        }
        if (!entity.name) {
            errors.push(`Сущность ${index}: отсутствует name`);
        }
        if (!entity.type) {
            errors.push(`Сущность ${index}: отсутствует type`);
        }
        if (entity.modified === undefined) {
            warnings.push(
                `Сущность ${index}: отсутствует флаг modified (будет установлен в false)`,
            );
        }

        // Проверка корректности типа
        if (entity.type && !this.validEntityTypes.includes(entity.type)) {
            errors.push(`Сущность ${index}: неверный тип '${entity.type}'`);
        }

        // Проверка атрибутов
        this.validateEntityAttributes(entity, index, errors, warnings);
    }

    /**
     * Проверка атрибутов сущности
     */
    private validateEntityAttributes(
        entity: any,
        entityIndex: number,
        errors: string[],
        warnings: string[],
    ): void {
        if (!entity.attrSeq || !Array.isArray(entity.attrSeq)) {
            return;
        }

        if (entity.attrSeq.length > this.maxAttributes) {
            errors.push(
                `Сущность ${entity.id}: превышено максимальное количество атрибутов: ${entity.attrSeq.length} > ${this.maxAttributes}`,
            );
        }

        entity.attrSeq.forEach((attr: any, attrIndex: number) => {
            this.validateSingleAttribute(attr, entityIndex, attrIndex, entity.id, errors);
        });
    }

    /**
     * Проверка отдельного атрибута
     */
    private validateSingleAttribute(
        attr: any,
        entityIndex: number,
        attrIndex: number,
        entityId: string,
        errors: string[],
    ): void {
        if (!attr.name) {
            errors.push(`Сущность ${entityIndex}, атрибут ${attrIndex}: отсутствует name`);
        }
        if (!attr.type) {
            errors.push(`Сущность ${entityIndex}, атрибут ${attrIndex}: отсутствует type`);
        }

        // Проверка корректности типа атрибута
        if (attr.type && !this.validAttributeTypes.includes(attr.type)) {
            errors.push(
                `Сущность ${entityId}, атрибут ${attrIndex}: неверный тип '${attr.type}'`,
            );
        }
    }

    /**
     * Проверка маппингов
     */
    private validateMappings(
        mappings: any[],
        entities: any[],
        errors: string[],
        warnings: string[],
    ): void {
        if (!mappings || !Array.isArray(mappings)) {
            return;
        }

        mappings.forEach((mapping: any, index: number) => {
            this.validateSingleMapping(mapping, index, entities, errors, warnings);
        });
    }

    /**
     * Проверка отдельного маппинга
     */
    private validateSingleMapping(
        mapping: any,
        index: number,
        entities: any[],
        errors: string[],
        warnings: string[],
    ): void {
        if (!mapping.entityId) {
            errors.push(`Маппинг ${index}: отсутствует entityId`);
        }

        // Проверка существования target entity
        const targetEntity = entities.find((e: any) => e.id === mapping.entityId);
        if (!targetEntity) {
            warnings.push(`Маппинг ${index}: target entity не найдена: ${mapping.entityId}`);
        }

        // Проверка зависимостей
        this.validateMappingDependencies(mapping, index, entities, errors, warnings);
    }

    /**
     * Проверка зависимостей маппинга
     */
    private validateMappingDependencies(
        mapping: any,
        mappingIndex: number,
        entities: any[],
        errors: string[],
        warnings: string[],
    ): void {
        if (!mapping.deps || !Array.isArray(mapping.deps)) {
            return;
        }

        mapping.deps.forEach((dep: any, depIndex: number) => {
            this.validateSingleDependency(dep, mappingIndex, depIndex, entities, errors, warnings);
        });
    }

    /**
     * Проверка отдельной зависимости
     */
    private validateSingleDependency(
        dep: any,
        mappingIndex: number,
        depIndex: number,
        entities: any[],
        errors: string[],
        warnings: string[],
    ): void {
        if (!dep.entityId) {
            errors.push(`Маппинг ${mappingIndex}, зависимость ${depIndex}: отсутствует entityId`);
        }

        const sourceEntity = entities.find((e: any) => e.id === dep.entityId);
        if (!sourceEntity) {
            warnings.push(
                `Маппинг ${mappingIndex}, зависимость ${depIndex}: source entity не найдена: ${dep.entityId}`,
            );
        }

        // Проверка attrMaps
        this.validateAttributeMaps(dep, mappingIndex, depIndex, sourceEntity, errors, warnings);

        // Проверка attrDeps
        this.validateAttributeDeps(dep, mappingIndex, depIndex, sourceEntity, errors, warnings);
    }

    /**
     * Проверка маппинга атрибутов
     */
    private validateAttributeMaps(
        dep: any,
        mappingIndex: number,
        depIndex: number,
        sourceEntity: any,
        errors: string[],
        warnings: string[],
    ): void {
        if (!dep.attrMaps || !Array.isArray(dep.attrMaps)) {
            return;
        }

        dep.attrMaps.forEach((attrMap: any, attrMapIndex: number) => {
            if (!attrMap.src) {
                errors.push(
                    `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: отсутствует src`,
                );
            }
            if (!attrMap.dst) {
                errors.push(
                    `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: отсутствует dst`,
                );
            }
        });
    }

    /**
     * Проверка зависимостей атрибутов
     */
    private validateAttributeDeps(
        dep: any,
        mappingIndex: number,
        depIndex: number,
        sourceEntity: any,
        errors: string[],
        warnings: string[],
    ): void {
        if (!dep.atrDeps || !Array.isArray(dep.atrDeps)) {
            return;
        }

        dep.atrDeps.forEach((attrDep: any, attrDepIndex: number) => {
            if (!attrDep.attr) {
                errors.push(
                    `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrDep ${attrDepIndex}: отсутствует attr`,
                );
            }
            if (!attrDep.linkTypes || !Array.isArray(attrDep.linkTypes)) {
                warnings.push(
                    `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrDep ${attrDepIndex}: отсутствуют linkTypes`,
                );
            }
        });
    }

    /**
     * Проверка целостности данных
     */
    validateDataIntegrity(data: any): IntegrityResult {
        const issues: string[] = [];

        if (!data.entities || !data.mappings) {
            return { isValid: false, issues: ["Отсутствуют entities или mappings"] };
        }

        // Проверка ссылочной целостности для маппингов
        this.validateReferentialIntegrity(data, issues);

        return {
            isValid: issues.length === 0,
            issues,
        };
    }

    /**
     * Проверка ссылочной целостности
     */
    private validateReferentialIntegrity(data: any, issues: string[]): void {
        if (!data.mappings || !Array.isArray(data.mappings)) {
            return;
        }

        data.mappings.forEach((mapping: any, index: number) => {
            const targetEntity = data.entities.find((e: any) => e.id === mapping.entityId);
            if (!targetEntity) {
                issues.push(`Маппинг ${index}: target entity не найдена: ${mapping.entityId}`);
            }

            if (mapping.deps && Array.isArray(mapping.deps)) {
                mapping.deps.forEach((dep: any, depIndex: number) => {
                    this.validateDependencyIntegrity(dep, mapping, index, depIndex, data, issues);
                });
            }
        });
    }

    /**
     * Проверка целостности зависимости
     */
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
            issues.push(
                `Маппинг ${mappingIndex}, зависимость ${depIndex}: source entity не найдена: ${dep.entityId}`,
            );
        }

        const targetEntity = data.entities.find((e: any) => e.id === mapping.entityId);

        // Проверка атрибутов в attrMaps
        this.validateAttributeMapsIntegrity(dep, mappingIndex, depIndex, sourceEntity, targetEntity, issues);

        // Проверка атрибутов в attrDeps
        this.validateAttributeDepsIntegrity(dep, mappingIndex, depIndex, sourceEntity, issues);
    }

    /**
     * Проверка целостности маппинга атрибутов
     */
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
                const srcAttr = sourceEntity.attrSeq.find((a: any) => a.name === attrMap.src);
                if (!srcAttr) {
                    issues.push(
                        `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: source атрибут не найден: ${attrMap.src}`,
                    );
                }
            }

            if (targetEntity && targetEntity.attrSeq) {
                const dstAttr = targetEntity.attrSeq.find((a: any) => a.name === attrMap.dst);
                if (!dstAttr) {
                    issues.push(
                        `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrMap ${attrMapIndex}: target атрибут не найден: ${attrMap.dst}`,
                    );
                }
            }
        });
    }

    /**
     * Проверка целостности зависимостей атрибутов
     */
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
                const srcAttr = sourceEntity.attrSeq.find((a: any) => a.name === attrDep.attr);
                if (!srcAttr) {
                    issues.push(
                        `Маппинг ${mappingIndex}, зависимость ${depIndex}, attrDep ${attrDepIndex}: source атрибут не найден: ${attrDep.attr}`,
                    );
                }
            }
        });
    }

    /**
     * Проверка бизнес-правил
     */
    validateBusinessRules(data: any): BusinessValidationResult {
        const violations: string[] = [];
        const recommendations: string[] = [];

        // Проверка нейминга объектов
        this.validateNaming(data.entities, violations);

        // Проверка лимитов
        this.validateLimits(data, violations, recommendations);

        return {
            isValid: violations.length === 0,
            violations,
            recommendations,
        };
    }

    /**
     * Проверка нейминга объектов
     */
    private validateNaming(entities: any[], errors: string[]): void {
        if (!entities || !Array.isArray(entities)) {
            return;
        }

        entities.forEach((entity: any, index: number) => {
            if (!this.isValidName(entity.name)) {
                errors.push(
                    `Сущность ${index}: имя содержит недопустимые символы: ${entity.name}`,
                );
            }

            if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
                entity.attrSeq.forEach((attr: any, attrIndex: number) => {
                    if (!this.isValidName(attr.name)) {
                        errors.push(
                            `Сущность ${index}, атрибут ${attrIndex}: имя содержит недопустимые символы: ${attr.name}`,
                        );
                    }
                });
            }
        });
    }

    /**
     * Проверка лимитов
     */
    private validateLimits(data: any, violations: string[], recommendations: string[]): void {
        const entitiesCount = data.entities?.length || 0;
        const attributesCount = data.entities?.reduce(
            (acc: number, entity: any) => acc + (entity.attrSeq?.length || 0),
            0,
        ) || 0;

        if (entitiesCount > this.maxEntities) {
            violations.push(`Превышено максимальное количество сущностей: ${entitiesCount}`);
        }

        if (attributesCount > 1000) { // Пример бизнес-правила
            recommendations.push("Большое количество атрибутов. Рассмотрите оптимизацию структуры данных.");
        }

        if (entitiesCount > 50) {
            recommendations.push("Большое количество сущностей. Рекомендуется разбить импорт на части");
        }
    }

    /**
     * Проверка корректности имени (кириллица и разрешенные символы)
     */
    private isValidName(name: string): boolean {
        if (!name || typeof name !== "string") {
            return false;
        }

        // Разрешенные символы: кириллица, латиница, цифры, подчеркивание, дефис, пробел
        const validNameRegex = /^[а-яА-Яa-zA-Z0-9_\-\s]+$/;
        return validNameRegex.test(name);
    }

    /**
     * Проверка версии схемы JSON
     */
    validateSchemaVersion(data: any): SchemaVersionResult {
        const version = data.desc?.schemaVersion || "1.0";

        // Поддерживаемые версии
        const supportedVersions = ["1.0", "1.1", "2.0"];
        const isSupported = supportedVersions.includes(version);

        let message = "";
        if (!isSupported) {
            message = `Версия схемы ${version} не поддерживается. Поддерживаемые версии: ${supportedVersions.join(", ")}`;
        } else {
            message = `Версия схемы ${version} поддерживается`;
        }

        return {
            isValid: isSupported,
            version,
            supported: isSupported,
            message,
        };
    }

    /**
     * Генерация отчета о валидации
     */
    generateValidationReport(data: any): ValidationReport {
        const validation = this.validateJsonForImport(data);
        const schemaVersion = this.validateSchemaVersion(data);
        const integrity = this.validateDataIntegrity(data);
        const businessRules = this.validateBusinessRules(data);

        // Статистика
        const statistics = this.calculateStatistics(data);

        return {
            summary: {
                isValid: validation.isValid && integrity.isValid && schemaVersion.isValid && businessRules.isValid,
                entitiesCount: statistics.entitiesCount,
                attributesCount: statistics.attributesCount,
                mappingsCount: statistics.mappingsCount,
                schemaVersion: schemaVersion.version,
            },
            validation,
            integrity,
            statistics,
        };
    }

    /**
     * Расчет статистики данных
     */
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

    /**
     * Проверка на рекурсивные зависимости
     */
    checkForRecursion(entities: any[], mappings: any[]): RecursionCheckResult {
        const graph = new Map<string, string[]>();
        const cycles: string[][] = [];

		// Построение графа зависимостей
		entities.forEach((entity) => {
			graph.set(entity.id, []);
		});

		mappings.forEach((mapping) => {
			if (mapping.deps && Array.isArray(mapping.deps)) {
				mapping.deps.forEach((dep: any) => {
					const source = dep.entityId;
					const target = mapping.entityId;

					if (graph.has(source)) {
						graph.get(source)!.push(target);
					}
				});
			}
		});

		// Поиск циклов с помощью DFS
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const dfs = (node: string, path: string[]): boolean => {
			if (recursionStack.has(node)) {
				cycles.push([...path, node]);
				return true;
			}

			if (visited.has(node)) {
				return false;
			}

			visited.add(node);
			recursionStack.add(node);
			path.push(node);

			const neighbors = graph.get(node) || [];
			let hasCycle = false;

			for (const neighbor of neighbors) {
				if (dfs(neighbor, path)) {
					hasCycle = true;
				}
			}

			path.pop();
			recursionStack.delete(node);
			return hasCycle;
		};

		let hasRecursion = false;
		for (const node of graph.keys()) {
			if (!visited.has(node)) {
				if (dfs(node, [])) {
					hasRecursion = true;
				}
			}
		}

		return {
			hasRecursion,
			cycles,
		};
	}

    /**
     * Проверка на дублирование сущностей и атрибутов
     */
    checkForDuplicates(data: any): DuplicateCheckResult {
        const duplicates: string[] = [];
        const entityIds = new Set<string>();
        const entityNames = new Set<string>();

		// Проверка дублирования сущностей
		data.entities.forEach((entity: any) => {
			if (entityIds.has(entity.id)) {
				duplicates.push(`Дублирование entity.id: ${entity.id}`);
			}
			entityIds.add(entity.id);

			const entityKey = `${entity.namespace}.${entity.name}`;
			if (entityNames.has(entityKey)) {
				duplicates.push(`Дублирование entity: ${entityKey}`);
			}
			entityNames.add(entityKey);
		});

		// Проверка дублирования атрибутов внутри сущностей
		data.entities.forEach((entity: any) => {
			if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
				const attrNames = new Set<string>();
				entity.attrSeq.forEach((attr: any) => {
					if (attrNames.has(attr.name)) {
						duplicates.push(
							`Дублирование атрибута: ${attr.name} в сущности ${entity.id}`,
						);
					}
					attrNames.add(attr.name);
				});
			}
		});

        return {
            hasDuplicates: duplicates.length > 0,
            duplicates,
        };
    }

    /**
     * Нормализация JSON данных
     */
    normalizeJsonData(data: any): any {
        this.logger.log("Нормализация JSON данных");

        const normalized = JSON.parse(JSON.stringify(data));

        // Нормализация desc
        if (!normalized.desc) {
            normalized.desc = {};
        }
        if (!normalized.desc.schemaVersion) {
            normalized.desc.schemaVersion = "1.0";
        }

        // Нормализация entities
        if (normalized.entities && Array.isArray(normalized.entities)) {
            normalized.entities.forEach((entity: any) => {
                // Установка значения по умолчанию для modified
                if (entity.modified === undefined) {
                    entity.modified = false;
                }

                // Нормализация типа
                if (entity.type) {
                    entity.type = entity.type.toLowerCase().trim();
                }

                // Нормализация namespace
                if (!entity.namespace) {
                    entity.namespace = "default";
                }

                // Нормализация атрибутов
                if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
                    entity.attrSeq.forEach((attr: any) => {
                        if (attr.type) {
                            attr.type = attr.type.toLowerCase().trim();
                        }
                        if (attr.comment === undefined) {
                            attr.comment = "";
                        }
                    });
                }
            });
        }

        // Нормализация маппингов
        if (normalized.mappings && Array.isArray(normalized.mappings)) {
            normalized.mappings.forEach((mapping: any) => {
                if (!mapping.deps) {
                    mapping.deps = [];
                }

                // Нормализация зависимостей
                if (mapping.deps && Array.isArray(mapping.deps)) {
                    mapping.deps.forEach((dep: any) => {
                        if (!dep.attrMaps) {
                            dep.attrMaps = [];
                        }
                        if (!dep.atrDeps) {
                            dep.atrDeps = [];
                        }
                    });
                }
            });
        }

        // Нормализация failedMappings
        if (!normalized.failedMappings) {
            normalized.failedMappings = [];
        }

        this.logger.log("Нормализация завершена");
        return normalized;
    }
}
