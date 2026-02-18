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
	 * Основной метод конвертации.
	 * @param parsedData - распарсенные данные из S2T-файла
	 * @param options - опции (наименование и описание процесса, вводимые пользователем)
	 */
	convertToJson(
		parsedData: ParsedS2TData,
		options?: { processName?: string; processDescription?: string },
	): S2tCommitJsonDto {
		this.logger.log(
			`Конвертация S2T -> JSON, тип: ${parsedData.fileType}, файл: ${parsedData.fileName}`,
		);

		// Валидация входных данных
		if (!parsedData.rows || parsedData.rows.length === 0) {
			throw new BadRequestException("Нет данных для конвертации");
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

		// Собираем уникальные сущности источников и целей
		const sources = new Map<
			string,
			{ schema: string; table: string; system: string; rows: S2TRow[] }
		>();
		const targets = new Map<
			string,
			{ schema: string; table: string; system: string; rows: S2TRow[] }
		>();

		rows.forEach((row) => {
			// Источник
			if (row.sourceSchema && row.sourceTable) {
				const key = `${row.sourceSchema}.${row.sourceTable}`;
				if (!sources.has(key)) {
					sources.set(key, {
						schema: row.sourceSchema!,
						table: row.sourceTable!,
						system: row.sourceBaseSystem || this.DEFAULT_SYSTEM_CODE_MART,
						rows: [],
					});
				}
				sources.get(key)!.rows.push(row);
			}
			// Цель
			if (row.targetSchema && row.targetTable) {
				const key = `${row.targetSchema}.${row.targetTable}`;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema!,
						table: row.targetTable!,
						system: row.targetBaseSystem || this.DEFAULT_SYSTEM_CODE_MART,
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

		// Сначала цели (modified = true)
		targets.forEach((t, fullName) => {
			const entity = this.buildEntity(fullName, t, t.rows, true, "table");
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Затем источники (modified = false)
		sources.forEach((s, fullName) => {
			const entity = this.buildEntity(fullName, s, s.rows, false, "table");
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Формируем mappings
		const mappings: S2tCommitJsonMappingDto[] = [];
		for (const [targetFullName, target] of targets.entries()) {
			const mapping = this.buildMapping(
				targetFullName,
				target.system,
				target.rows,
				sources,
				options,
			);
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

		// Собираем целевые сущности (JSON-файлы)
		const targets = new Map<
			string,
			{ schema: string; table: string; system: string; rows: S2TRow[] }
		>();

		rows.forEach((row) => {
			if (row.targetTable) {
				// Для JSON схема может отсутствовать – ключ может быть просто table
				const key = row.targetSchema
					? `${row.targetSchema}.${row.targetTable}`
					: row.targetTable;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema || "",
						table: row.targetTable,
						system: row.targetBaseSystem || this.DEFAULT_SYSTEM_CODE_JSON,
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
			const entity = this.buildEntity(fullName, t, t.rows, true, "json");
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		return {
			desc: { commit_type: "json" },
			entities,
			mappings: [], // Для JSON-файла маппинги не заполняются
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

		const sources = new Map<
			string,
			{ schema: string; table: string; system: string; rows: S2TRow[] }
		>();
		const targets = new Map<
			string,
			{ schema: string; table: string; system: string; rows: S2TRow[] }
		>();

		rows.forEach((row) => {
			// Источник
			if (row.sourceSchema && row.sourceTable) {
				const key = `${row.sourceSchema}.${row.sourceTable}`;
				if (!sources.has(key)) {
					sources.set(key, {
						schema: row.sourceSchema!,
						table: row.sourceTable!,
						system: row.sourceBaseSystem || this.DEFAULT_SYSTEM_CODE_MODEL,
						rows: [],
					});
				}
				sources.get(key)!.rows.push(row);
			}
			// Цель (входящий вектор)
			if (row.targetSchema && row.targetTable) {
				const key = `${row.targetSchema}.${row.targetTable}`;
				if (!targets.has(key)) {
					targets.set(key, {
						schema: row.targetSchema!,
						table: row.targetTable!,
						system: row.targetBaseSystem || this.DEFAULT_SYSTEM_CODE_MODEL,
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
			const entity = this.buildEntity(
				fullName,
				t,
				t.rows,
				true,
				"input_vector",
			);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Источники (modified = false, тип определяется по имени таблицы)
		sources.forEach((s, fullName) => {
			const type = s.table.toUpperCase().startsWith("JSON_") ? "json" : "table";
			const entity = this.buildEntity(fullName, s, s.rows, false, type);
			if (entity.attrSeq.length > 0) {
				entities.push(entity);
			}
		});

		// Mappings
		const mappings: S2tCommitJsonMappingDto[] = [];
		for (const [targetFullName, target] of targets.entries()) {
			const mapping = this.buildMapping(
				targetFullName,
				target.system,
				target.rows,
				sources,
				options,
			);
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
	// Вспомогательные методы для построения структур JSON коммита
	// ------------------------------------------------------------------------

	/**
	 * Построение объекта сущности (entity) из строк S2T.
	 * @param fullName - полное имя сущности (schema.table или просто table)
	 * @param container - объект с информацией о схеме, таблице, системе
	 * @param rows - строки S2T, относящиеся к этой сущности
	 * @param modified - true для целевой сущности, false для источника
	 * @param entityType - тип сущности (table, json, input_vector и т.д.)
	 */
	private buildEntity(
		fullName: string,
		container: { schema: string; table: string; system: string },
		rows: S2TRow[],
		modified: boolean,
		entityType: string,
	): S2tCommitJsonEntityDto {
		// Собираем уникальные атрибуты
		const attrMap = new Map<
			string,
			{ name: string; type: string; comment?: string }
		>();

		rows.forEach((row) => {
			const attrName = modified
				? row.targetAttributeCode
				: row.sourceAttributeCode;
			const attrType = modified ? row.targetDataType : row.sourceDataType;
			const attrDesc = modified
				? row.targetAttributeDescription
				: row.sourceAttributeDescription;

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
		const id = fullName.includes(".")
			? fullName
			: container.schema
				? `${container.schema}.${container.table}`
				: container.table;

		// Собираем атрибуты в массив
		const attrSeq: S2tCommitJsonEntityAttrDto[] = Array.from(
			attrMap.values(),
		).map((a) => ({
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
	 */
	private buildMapping(
		targetFullName: string,
		targetSystem: string,
		targetRows: S2TRow[],
		sourcesMap: Map<string, any>,
		options?: { processName?: string; processDescription?: string },
	): S2tCommitJsonMappingDto {
		const depsMap = new Map<string, S2tCommitJsonDependencyDto>();

		targetRows.forEach((row) => {
			if (
				row.sourceSchema &&
				row.sourceTable &&
				row.sourceAttributeCode &&
				row.targetAttributeCode
			) {
				const sourceKey = `${row.sourceSchema}.${row.sourceTable}`;
				const source = sourcesMap.get(sourceKey);
				if (!source) return; // если источник не найден (не должен быть)

				if (!depsMap.has(sourceKey)) {
					depsMap.set(sourceKey, {
						entityId: sourceKey,
						system_code: row.sourceBaseSystem || source.system || "1642",
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

		return {
			entityId: targetFullName,
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
		if (
			t.includes("decimal") ||
			t.includes("numeric") ||
			t.includes("float") ||
			t.includes("double")
		)
			return "decimal";
		if (t.includes("timestamp") || t.includes("date") || t.includes("datetime"))
			return "timestamp";
		if (t.includes("bool")) return "boolean";
		return "string";
	}
}
