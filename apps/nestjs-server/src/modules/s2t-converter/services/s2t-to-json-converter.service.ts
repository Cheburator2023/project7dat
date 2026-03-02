import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ParsedS2TData } from "../interfaces/s2t-parsed-data.interface";
import { S2TRow } from "../interfaces/s2t-row.interface";
import { S2TFileType } from "../interfaces/s2t-file-type.enum";
import {
	S2tCommitJsonDto,
	S2tCommitJsonEntityDto,
	S2tCommitJsonEntityAttrDto,
	S2tCommitJsonMappingDto,
	S2tCommitJsonDependencyDto,
} from "../dto/s2t-commit-json.dto";

/**
 * Сервис конвертации распарсенных данных S2T в JSON коммита Data Lineage.
 */
@Injectable()
export class S2tToJsonConverterService {
	private readonly logger = new Logger(S2tToJsonConverterService.name);

	// Значения system_code по умолчанию для разных типов
	private readonly DEFAULT_SYSTEM_CODE_MART = "1642"; // DAPP
	private readonly DEFAULT_SYSTEM_CODE_JSON = "1642"; // DAPP
	private readonly DEFAULT_SYSTEM_CODE_MODEL = "1655"; // PIM

	// Признак изменения для сущностей и атрибутов
	private readonly ENTITY_CHANGE_VALUE = "commit";
	private readonly ATTR_CHANGE_VALUE = "new";
	private readonly RELATION_CHANGE_VALUE = "new";

	/**
	 * Извлекает числовой код системы из сырой строки.
	 * Примеры:
	 *   "1642_19, Озеро данных" → "1642_19"
	 *   "1655" → "1655"
	 *   "1642" → "1642"
	 */
	private extractSystemCode(raw: string | undefined | null): string | null {
		if (!raw) return null;
		const trimmed = raw.trim();
		// Ищем первую часть до запятой или пробела, которая может содержать цифры и подчёркивания
		const parts = trimmed.split(/[,;\s]+/);
		const firstPart = parts[0].trim();
		// Проверяем, что строка состоит только из цифр и подчёркиваний
		if (/^[\d_]+$/.test(firstPart)) {
			return firstPart;
		}
		// Если не подходит – пытаемся просто взять начальные цифры и подчёркивания
		const match = trimmed.match(/^[\d_]+/);
		return match ? match[0] : null;
	}

	/**
	 * Возвращает очищенный system_code для сущности с учётом типа файла.
	 * Если код не удалось извлечь – используется значение по умолчанию.
	 */
	private getCleanedSystemCode(
		raw: string | undefined | null,
		fileType: S2TFileType,
		context: string,
	): string {
		const extracted = this.extractSystemCode(raw);
		if (extracted) {
			if (extracted !== raw) {
				this.logger.log(
					`[${context}] system_code очищен: "${raw}" → "${extracted}"`,
				);
			}
			return extracted;
		}

		// Если не удалось извлечь – берём значение по умолчанию в зависимости от типа
		let defaultValue: string;
		switch (fileType) {
			case S2TFileType.MART:
				defaultValue = this.DEFAULT_SYSTEM_CODE_MART;
				break;
			case S2TFileType.MODEL:
				defaultValue = this.DEFAULT_SYSTEM_CODE_MODEL;
				break;
			case S2TFileType.JSON:
				defaultValue = this.DEFAULT_SYSTEM_CODE_JSON;
				break;
			default:
				defaultValue = this.DEFAULT_SYSTEM_CODE_MART;
		}

		if (raw) {
			this.logger.warn(
				`[${context}] Не удалось извлечь числовой код из "${raw}", используется значение по умолчанию: ${defaultValue}`,
			);
		}
		return defaultValue;
	}

	// ------------------------------------------------------------------------
	// Основной метод конвертации
	// ------------------------------------------------------------------------
	convertToJson(
		parsedData: ParsedS2TData,
		options?: { processName?: string; processDescription?: string },
	): S2tCommitJsonDto {
		this.logger.log(`Конвертация S2T -> JSON, тип: ${parsedData.fileType}, файл: ${parsedData.fileName}`);

		// Валидация входных данных
		if (!parsedData.rows || parsedData.rows.length === 0) {
			throw new BadRequestException('Нет данных для конвертации');
		}

		switch (parsedData.fileType) {
			case S2TFileType.MART:
				return this.convertMart(parsedData, options);
			case S2TFileType.JSON:
				return this.convertJsonFile(parsedData);
			case S2TFileType.MODEL:
				return this.convertModel(parsedData, options);
			default:
				throw new Error(`Неподдерживаемый тип файла: ${parsedData.fileType}`);
		}
	}

	// ------------------------------------------------------------------------
	// Витрина (table)
	// ------------------------------------------------------------------------
	private convertMart(
		parsedData: ParsedS2TData,
		options?: { processName?: string; processDescription?: string },
	): S2tCommitJsonDto {
		const rows = parsedData.rows;
		const sources = new Map<string, { schema: string; table: string; system: string; rows: S2TRow[] }>();
		const targets = new Map<string, { schema: string; table: string; system: string; rows: S2TRow[] }>();

		rows.forEach(row => {
			// Источник
			if (row.sourceSchema && row.sourceTable) {
				const cleanedSystem = this.getCleanedSystemCode(
					row.sourceBaseSystem,
					parsedData.fileType,
					`source: ${row.sourceSchema}.${row.sourceTable}`,
				);
				const key = `${row.sourceSchema}.${row.sourceTable}`;
				if (!sources.has(key)) {
					sources.set(key, {
						schema: row.sourceSchema!,
						table: row.sourceTable!,
						system: cleanedSystem,
						rows: [],
					});
				}
				sources.get(key)!.rows.push(row);
			}
			// Цель
			if (row.targetSchema && row.targetTable) {
				const cleanedSystem = this.getCleanedSystemCode(
					row.targetBaseSystem,
					parsedData.fileType,
					`target: ${row.targetSchema}.${row.targetTable}`,
				);
				const key = `${row.targetSchema}.${row.targetTable}`;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema!,
						table: row.targetTable!,
						system: cleanedSystem,
						rows: [],
					});
				}
				targets.get(key)!.rows.push(row);
			}
		});

		if (targets.size === 0) {
			throw new BadRequestException("Не найдена целевая таблица (Target)");
		}

		// Формируем entities
		const entities: S2tCommitJsonEntityDto[] = [];

		// Цели (modified = true)
		targets.forEach((t, fullName) => {
			const entity = this.buildEntity(fullName, t, t.rows, true, "table", parsedData.fileType);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Источники (modified = false)
		sources.forEach((s, fullName) => {
			const entity = this.buildEntity(fullName, s, s.rows, false, "table", parsedData.fileType);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Формируем mappings
		const mappings: S2tCommitJsonMappingDto[] = [];
		for (const [targetFullName, target] of targets.entries()) {
			const mapping = this.buildMapping(targetFullName, target.system, target.rows, sources, options, parsedData.fileType);
			if (mapping.deps.length > 0) {
				mappings.push(mapping);
			}
		}

		return {
			desc: {
				commit_type: "table",
				process: options?.processName,
				description: options?.processDescription,
			},
			entities,
			mappings,
		};
	}

	// ------------------------------------------------------------------------
	// JSON‑файл (json)
	// ------------------------------------------------------------------------
	private convertJsonFile(parsedData: ParsedS2TData): S2tCommitJsonDto {
		const rows = parsedData.rows;
		const targets = new Map<string, { schema: string; table: string; system: string; rows: S2TRow[] }>();

		rows.forEach(row => {
			if (row.targetTable) {
				const cleanedSystem = this.getCleanedSystemCode(
					row.targetBaseSystem,
					parsedData.fileType,
					`target: ${row.targetSchema || ''}.${row.targetTable}`,
				);
				const key = row.targetSchema ? `${row.targetSchema}.${row.targetTable}` : row.targetTable;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema || '',
						table: row.targetTable,
						system: cleanedSystem,
						rows: [],
					});
				}
				targets.get(key)!.rows.push(row);
			}
		});

		if (targets.size === 0) {
			throw new BadRequestException("Не найдена целевая сущность JSON");
		}

		const entities: S2tCommitJsonEntityDto[] = [];
		targets.forEach((t, fullName) => {
			const entity = this.buildEntity(fullName, t, t.rows, true, "json", parsedData.fileType);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		return {
			desc: { commit_type: "json" },
			entities,
			mappings: [],
		};
	}

	// ------------------------------------------------------------------------
	// Модель (model)
	// ------------------------------------------------------------------------
	private convertModel(
		parsedData: ParsedS2TData,
		options?: { processName?: string; processDescription?: string },
	): S2tCommitJsonDto {
		const rows = parsedData.rows;
		const sources = new Map<string, { schema: string; table: string; system: string; rows: S2TRow[] }>();
		const targets = new Map<string, { schema: string; table: string; system: string; rows: S2TRow[] }>();

		rows.forEach(row => {
			// Источник
			if (row.sourceSchema && row.sourceTable) {
				const cleanedSystem = this.getCleanedSystemCode(
					row.sourceBaseSystem,
					parsedData.fileType,
					`source: ${row.sourceSchema}.${row.sourceTable}`,
				);
				const key = `${row.sourceSchema}.${row.sourceTable}`;
				if (!sources.has(key)) {
					sources.set(key, {
						schema: row.sourceSchema!,
						table: row.sourceTable!,
						system: cleanedSystem,
						rows: [],
					});
				}
				sources.get(key)!.rows.push(row);
			}
			// Цель (входящий вектор)
			if (row.targetSchema && row.targetTable) {
				const cleanedSystem = this.getCleanedSystemCode(
					row.targetBaseSystem,
					parsedData.fileType,
					`target: ${row.targetSchema}.${row.targetTable}`,
				);
				const key = `${row.targetSchema}.${row.targetTable}`;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema!,
						table: row.targetTable!,
						system: cleanedSystem,
						rows: [],
					});
				}
				targets.get(key)!.rows.push(row);
			}
		});

		if (targets.size === 0) {
			throw new BadRequestException(
				"Не найден целевой входящий вектор (Target)",
			);
		}

		const entities: S2tCommitJsonEntityDto[] = [];

		// Цели (modified = true, тип input_vector)
		targets.forEach((t, fullName) => {
			const entity = this.buildEntity(fullName, t, t.rows, true, "input_vector", parsedData.fileType);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Источники (modified = false)
		sources.forEach((s, fullName) => {
			const type = s.table.toUpperCase().startsWith("JSON_") ? "json" : "table";
			const entity = this.buildEntity(fullName, s, s.rows, false, type, parsedData.fileType);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Mappings
		const mappings: S2tCommitJsonMappingDto[] = [];
		for (const [targetFullName, target] of targets.entries()) {
			const mapping = this.buildMapping(targetFullName, target.system, target.rows, sources, options, parsedData.fileType);
			if (mapping.deps.length > 0) {
				mappings.push(mapping);
			}
		}

		return {
			desc: {
				commit_type: "model",
				process: options?.processName,
				description: options?.processDescription,
			},
			entities,
			mappings,
		};
	}

	// ------------------------------------------------------------------------
	// Вспомогательные методы
	// ------------------------------------------------------------------------
	private buildEntityId(container: { schema: string; table: string; system: string }): string {
		if (container.schema) {
			const id = `${container.schema}.${container.table}.${container.system}`;
			this.logger.debug(`buildEntityId: schema="${container.schema}", table="${container.table}", system="${container.system}" -> id="${id}"`);
			return id;
		}
		const id = `${container.table}.${container.system}`;
		this.logger.debug(`buildEntityId (без схемы): table="${container.table}", system="${container.system}" -> id="${id}"`);
		return id;
	}

	/**
	 * Построение объекта сущности (entity) из строк S2T.
	 * @param fullName - полное имя сущности (schema.table или просто table)
	 * @param container - объект с информацией о схеме, таблице, системе
	 * @param rows - строки S2T, относящиеся к этой сущности
	 * @param modified - true для целевой сущности, false для источника
	 * @param entityType - тип сущности (table, json, input_vector и т.д.)
	 * @param fileType - тип файла
	 */
	private buildEntity(
		fullName: string,
		container: { schema: string; table: string; system: string },
		rows: S2TRow[],
		modified: boolean,
		entityType: string,
		fileType: S2TFileType,
	): S2tCommitJsonEntityDto {
		const attrMap = new Map<string, { name: string; type: string; comment?: string }>();

		rows.forEach(row => {
			const attrName = modified ? row.targetAttributeCode : row.sourceAttributeCode;
			const attrType = modified ? row.targetDataType : row.sourceDataType;
			const attrDesc = modified ? row.targetAttributeDescription : row.sourceAttributeDescription;

			if (attrName && attrName.trim() !== "") {
				// Если атрибут с таким именем уже есть, используем первое вхождение
				if (!attrMap.has(attrName)) {
					attrMap.set(attrName, {
						name: attrName,
						type: this.normalizeType(attrType || "string"),
						comment: attrDesc,
					});
				}
			}
		});

		// Описание таблицы берём из первой строки
		const description = modified
			? rows[0]?.targetTableDescription
			: rows[0]?.sourceTableDescription;

		// Определяем id: если fullName уже содержит точку, используем его, иначе формируем из schema + table
		const id = this.buildEntityId(container);

		// Собираем атрибуты в массив
		const attrSeq: S2tCommitJsonEntityAttrDto[] = Array.from(attrMap.values()).map(a => ({
			name: a.name,
			type: a.type.toUpperCase(),
			comment: a.comment,
			attr_change: this.ATTR_CHANGE_VALUE,
		}));

		return {
			id,
			modified,
			type: entityType,
			namespace: container.schema || "", // для JSON может быть пусто
			name: container.table,
			system_code: container.system,
			entity_change: this.ENTITY_CHANGE_VALUE,
			description: description || undefined,
			container_description: undefined, // не заполняется из S2T
			container_change: undefined, // не заполняется из S2T
			attrSeq,
		};
	}

	/**
	 * Построение объекта маппинга для целевой сущности.
	 * @param targetFullName - полное имя целевой сущности
	 * @param targetSystem - код системы целевой сущности
	 * @param targetRows - строки S2T, относящиеся к целевой сущности
	 * @param sourcesMap - карта всех источников (для поиска)
	 * @param options - опции процесса
	 * @param fileType - тип файла
	 */
	private buildMapping(
		targetFullName: string,
		targetSystem: string,
		targetRows: S2TRow[],
		sourcesMap: Map<string, any>,
		options?: { processName?: string; processDescription?: string },
		fileType?: S2TFileType,
	): S2tCommitJsonMappingDto {
		const depsMap = new Map<string, S2tCommitJsonDependencyDto>();

		targetRows.forEach(row => {
			if (row.sourceSchema && row.sourceTable && row.sourceAttributeCode && row.targetAttributeCode) {
				const sourceKey = `${row.sourceSchema}.${row.sourceTable}`;
				const source = sourcesMap.get(sourceKey);
				if (!source) return; // если источник не найден (не должен быть)

				// Очищаем system_code для источника (на случай, если в attrMaps используется сырое значение)
				const sourceSystem = this.getCleanedSystemCode(
					row.sourceBaseSystem || source.system,
					fileType || S2TFileType.MART,
					`mapping source: ${sourceKey}`,
				);

				const sourceEntityId = this.buildEntityId({
					schema: row.sourceSchema,
					table: row.sourceTable,
					system: sourceSystem,
				});

				if (!depsMap.has(sourceKey)) {
					depsMap.set(sourceKey, {
						entityId: sourceEntityId,
						system_code: sourceSystem,
						process: options?.processName,
						process_description: options?.processDescription,
						attrMaps: [],
						atrDeps: [], // не заполняется из S2T
					});
				}

				const deps = depsMap.get(sourceKey)!;
				deps.attrMaps.push({
					src: row.sourceAttributeCode!,
					dst: row.targetAttributeCode!,
					relation_change: this.RELATION_CHANGE_VALUE,
				});
			}
		});

		const targetEntityId = this.buildEntityId({
			schema: targetRows[0]?.targetSchema || '',
			table: targetRows[0]?.targetTable || '',
			system: targetSystem,
		});

		return {
			entityId: targetEntityId,
			system_code: targetSystem,
			relation_change: this.RELATION_CHANGE_VALUE,
			deps: Array.from(depsMap.values()),
		};
	}

	/**
	 * Нормализует тип данных из S2T в допустимый тип JSON коммита.
	 * Приводит к нижнему регистру, затем маппит в один из: string, integer, decimal, timestamp, boolean.
	 */
	private normalizeType(dataType: string): string {
		if (!dataType) return "string";
		const t = dataType.toLowerCase().trim();

		if (t.includes("number") || t.includes("int")) return "integer";
		if (t.includes("decimal") || t.includes("numeric") || t.includes("float") || t.includes("double")) return "decimal";
		if (t.includes("timestamp") || t.includes("date") || t.includes("datetime")) return "timestamp";
		if (t.includes("bool")) return "boolean";
		return "string";
	}
}
