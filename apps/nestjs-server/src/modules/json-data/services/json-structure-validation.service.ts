import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	ValidationResult,
	RecursionCheckResult,
	DuplicateCheckResult,
} from "../types";
import { JsonStructureValidator } from "./interfaces/validation.interfaces";

@Injectable()
export class JsonStructureValidationService extends JsonStructureValidator {
	private readonly logger = new Logger(JsonStructureValidationService.name);
	private readonly maxJsonSize: number;
	private readonly maxEntities: number;
	private readonly maxAttributes: number;
	private readonly validEntityTypes = [
		"table",
		"view",
		"json",
		"input_vector",
		"unresolved",
		"rdd",
	];
	private readonly validAttributeTypes = [
		"timestamp",
		"date",
		"datetime",
		"decimal",
		"numeric",
		"double",
		"float",
		"string",
		"varchar",
		"text",
		"char",
		"integer",
		"int",
		"bigint",
		"smallint",
		"boolean",
		"bool",
	];
	private readonly validSystemCodes = ["1642", "1655"]; // DAPP и ПИМ

	constructor(private readonly configService: ConfigService) {
		super();
		this.maxJsonSize = this.configService.get<number>(
			"MAX_JSON_SIZE",
			52428800000,
		);
		this.maxEntities = this.configService.get<number>(
			"MAX_ENTITIES_PER_IMPORT",
			100000000,
		);
		this.maxAttributes = this.configService.get<number>(
			"MAX_ATTRIBUTES_PER_ENTITY",
			20000000,
		);
	}

	validateStructure(data: any): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		this.logger.log("Начало валидации структуры JSON");

		// Проверка размера
		this.validateJsonSize(data, errors);

		// Проверка базовой структуры
		this.validateBasicStructure(data, errors, warnings);

		// Проверка сущностей
		this.validateEntities(data.entities, errors, warnings);

		// Проверка маппингов
		this.validateMappings(data.mappings, data.entities, errors, warnings);

		this.logger.log(
			`Валидация структуры завершена. Ошибок: ${errors.length}, предупреждений: ${warnings.length}`,
		);

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

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

			const entityKey = `${entity.namespace}.${entity.name}.${entity.system_code || ""}`;
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

	normalizeJsonData(data: any): any {
		this.logger.log("Нормализация JSON данных");

		// In-place мутация: вызывающий код использует только нормализованный результат,
		// оригинал больше не нужен. Избегаем JSON.parse(JSON.stringify(data))
		// deep copy (~195MB), которая вызывала OOM при больших моделях.
		const normalized = data;

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

				// Нормализация system_code
				if (!entity.system_code) {
					entity.system_code = "1642"; // Значение по умолчанию для DAPP
				}

				// Нормализация атрибутов
				if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
					entity.attrSeq.forEach((attr: any) => {
						if (attr.type) {
							attr.type = this.normalizeAttributeType(attr.type);
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
				if (!mapping.system_code) {
					mapping.system_code = "1642"; // Значение по умолчанию
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
						if (!dep.system_code) {
							dep.system_code = mapping.system_code || "1642";
						}
						// Нормализация process_description
						if (
							dep.process !== undefined &&
							dep.process_description === undefined
						) {
							dep.process_description = "";
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

	private normalizeAttributeType(type: string): string {
		if (!type || typeof type !== "string") {
			return "string";
		}

		const normalized = type.toLowerCase().trim();

		// Извлечение базового типа из сложных определений
		if (normalized.includes("decimal") || normalized.includes("numeric")) {
			return "decimal";
		}
		if (normalized.includes("timestamp") || normalized.includes("datetime")) {
			return "timestamp";
		}
		if (normalized.includes("int") || normalized.includes("integer")) {
			return "integer";
		}
		if (normalized.includes("bool")) {
			return "boolean";
		}
		if (
			normalized.includes("char") ||
			normalized.includes("text") ||
			normalized.includes("varchar")
		) {
			return "string";
		}
		if (normalized.includes("double") || normalized.includes("float")) {
			return "decimal";
		}

		return normalized;
	}

	private validateJsonSize(data: any, errors: string[]): void {
		const jsonSize = JSON.stringify(data).length;
		if (jsonSize > this.maxJsonSize) {
			throw new BadRequestException(
				`Размер JSON превышает лимит: ${jsonSize} > ${this.maxJsonSize}`,
			);
		}
	}

	private validateBasicStructure(
		data: any,
		errors: string[],
		warnings: string[],
	): void {
		if (!data.desc) {
			errors.push("Отсутствует объект desc");
		}

		if (!data.entities || !Array.isArray(data.entities)) {
			errors.push("entities должен быть массивом");
		}

		if (!data.mappings || !Array.isArray(data.mappings)) {
			errors.push("mappings должен быть массивом");
		}
	}

	private validateEntities(
		entities: any[],
		errors: string[],
		warnings: string[],
	): void {
		if (!entities || !Array.isArray(entities)) {
			return;
		}

		if (entities.length > this.maxEntities) {
			errors.push(
				`Превышено максимальное количество сущностей: ${entities.length} > ${this.maxEntities}`,
			);
		}

		entities.forEach((entity: any, index: number) => {
			this.validateSingleEntity(entity, index, errors, warnings);
		});
	}

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
		if (!entity.system_code) {
			warnings.push(
				`Сущность ${index}: отсутствует system_code (будет установлено значение по умолчанию 1642)`,
			);
		}

		if (entity.type && !this.validEntityTypes.includes(entity.type)) {
			errors.push(`Сущность ${index}: неверный тип '${entity.type}'`);
		}

		if (
			entity.system_code &&
			!this.validSystemCodes.includes(entity.system_code)
		) {
			warnings.push(
				`Сущность ${index}: неизвестный system_code '${entity.system_code}'`,
			);
		}

		this.validateEntityAttributes(entity, index, errors, warnings);
	}

	private validateEntityAttributes(
		entity: any,
		entityIndex: number,
		errors: string[],
		warnings: string[],
	): void {
		if (!entity.attrSeq || !Array.isArray(entity.attrSeq)) {
			return;
		}

		entity.attrSeq.forEach((attr: any, attrIndex: number) => {
			this.validateSingleAttribute(
				attr,
				entityIndex,
				attrIndex,
				entity.id,
				errors,
				warnings,
			);
		});
	}

	private validateSingleAttribute(
		attr: any,
		entityIndex: number,
		attrIndex: number,
		entityId: string,
		errors: string[],
		warnings: string[],
	): void {
		if (!attr.name) {
			errors.push(
				`Сущность ${entityIndex}, атрибут ${attrIndex}: отсутствует name`,
			);
		}
		if (!attr.type) {
			errors.push(
				`Сущность ${entityIndex}, атрибут ${attrIndex}: отсутствует type`,
			);
		}

		if (attr.type) {
			const normalizedType = this.normalizeAttributeType(attr.type);
			if (!this.validAttributeTypes.includes(normalizedType)) {
				warnings.push(
					`Сущность ${entityId}, атрибут ${attrIndex}: тип '${attr.type}' будет нормализован к '${normalizedType}'`,
				);
			}
		}
	}

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
		if (!mapping.system_code) {
			warnings.push(
				`Маппинг ${index}: отсутствует system_code (будет установлено значение по умолчанию 1642)`,
			);
		}

		const targetEntity = entities.find((e: any) => e.id === mapping.entityId);
		if (!targetEntity) {
			warnings.push(
				`Маппинг ${index}: target entity не найдена: ${mapping.entityId}`,
			);
		}

		this.validateMappingDependencies(
			mapping,
			index,
			entities,
			errors,
			warnings,
		);
	}

	private validateMappingDependencies(
		mapping: any,
		index: number,
		entities: any[],
		errors: string[],
		warnings: string[],
	): void {
		if (!mapping.deps || !Array.isArray(mapping.deps)) {
			return;
		}

		mapping.deps.forEach((dep: any, depIndex: number) => {
			this.validateSingleDependency(
				dep,
				index,
				depIndex,
				entities,
				errors,
				warnings,
			);
		});
	}

	private validateSingleDependency(
		dep: any,
		mappingIndex: number,
		depIndex: number,
		entities: any[],
		errors: string[],
		warnings: string[],
	): void {
		if (!dep.entityId) {
			errors.push(
				`Маппинг ${mappingIndex}, зависимость ${depIndex}: отсутствует entityId`,
			);
		}
		if (!dep.system_code) {
			warnings.push(
				`Маппинг ${mappingIndex}, зависимость ${depIndex}: отсутствует system_code (будет установлено значение по умолчанию 1642)`,
			);
		}

		const sourceEntity = entities.find((e: any) => e.id === dep.entityId);
		if (!sourceEntity) {
			warnings.push(
				`Маппинг ${mappingIndex}, зависимость ${depIndex}: source entity не найдена: ${dep.entityId}`,
			);
		}

		// Проверка process_description при наличии process
		if (dep.process !== undefined && dep.process_description === undefined) {
			warnings.push(
				`Маппинг ${mappingIndex}, зависимость ${depIndex}: отсутствует process_description при наличии process`,
			);
		}

		this.validateAttributeMaps(
			dep,
			mappingIndex,
			depIndex,
			sourceEntity,
			errors,
			warnings,
		);
		this.validateAttributeDeps(
			dep,
			mappingIndex,
			depIndex,
			sourceEntity,
			errors,
			warnings,
		);
	}

	private validateAttributeMaps(
		dep: any,
		mappingIndex: number,
		depIndex: number,
		_sourceEntity: any,
		errors: string[],
		_warnings: string[],
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

	private validateAttributeDeps(
		dep: any,
		mappingIndex: number,
		depIndex: number,
		_sourceEntity: any,
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
}
