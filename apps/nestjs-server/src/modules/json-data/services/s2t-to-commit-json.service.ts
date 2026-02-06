import { Injectable, Logger, BadRequestException } from "@nestjs/common";

interface DataLineageSchema {
	desc: {
		appId: string;
		appName: string;
		commit_type?: string;
		process?: string;
		description?: string;
	};
	entities: Array<{
		id: string;
		modified: boolean;
		type: "table" | "view" | "json" | "input_vector" | "rdd" | "unresolved";
		namespace?: string;
		name: string | null;
		entity_change?: string;
		description?: string;
		system_code?: string;
		attrSeq?: Array<{
			name: string;
			type: string;
			comment?: string;
		}>;
	}>;
	mappings: Array<{
		id: number;
		entityId: string;
		system_code?: string;
		process?: string;
		processId?: number | null;
		deps?: Array<{
			entityId: string;
			system_code?: string;
			attrMaps?: Array<{
				src: string;
				dst: string;
			}>;
			atrDeps?: Array<{
				attr: string;
				linkTypes?: Array<"window" | "join" | "where" | "groupby">;
			}>;
		}>;
		unmatched?: Array<any>;
	}>;
	failedMappings: Array<any>;
}

interface S2TWorksheet {
	name: string;
	rows: Array<{
		number: number;
		cells: Array<{
			address: string;
			row: number;
			col: number;
			value: any;
		}>;
	}>;
}

interface S2TWorkbook {
	worksheets: S2TWorksheet[];
}

@Injectable()
export class S2tToCommitJsonService {
	private readonly logger = new Logger(S2tToCommitJsonService.name);

	private extractCellText(val: any): string {
		if (val === null || val === undefined) return "";
		if (typeof val !== "object") return String(val);
		if (val.result !== undefined) return this.extractCellText(val.result);
		if (Array.isArray(val.richText)) {
			return val.richText
				.map((part: any) =>
					typeof part === "object" ? (part.text ?? "") : String(part),
				)
				.join("");
		}
		if (val.$type !== undefined && val.value !== undefined)
			return String(val.value);
		if (typeof val.text === "string") return val.text;
		return String(val);
	}

	convertWorkbookToCommitJson(params: {
		workbook: S2TWorkbook;
		fileName?: string;
		processName?: string;
		processDescription?: string;
		commitName: string;
	}): DataLineageSchema {
		const mode = this.detectMode(params.fileName);
		this.logger.log(
			`Начало конвертации S2T workbook → commit JSON (mode=${mode}, fileName=${params.fileName ?? ""})`,
		);

		const mappingSheet = this.findMappingSheet(params.workbook);
		if (!mappingSheet) {
			const sheetNames = (params.workbook?.worksheets ?? [])
				.map((ws) => ws.name)
				.join(", ");
			throw new BadRequestException(
				`Не найден лист 'Mapping' в S2T файле. Доступные листы: ${sheetNames || "—"}`,
			);
		}

		const { sourceEntities, targetEntity, mappings, issues } =
			this.parseMappingSheet(mappingSheet, { mode });
		if (issues.length > 0) {
			this.logger.warn(
				`S2T конвертация: найдено проблемных строк: ${issues.length}. Первые 5: ${issues
					.slice(0, 5)
					.join(" | ")}`,
			);
		}

		const needsProcess = mode === "datamart" || mode === "model";

		const commitJson: DataLineageSchema = {
			desc: {
				appId: params.processName || params.commitName,
				appName: params.processName || params.commitName,
				commit_type: mode === "datamart" ? "table" : mode,
				process: needsProcess ? params.processName : undefined,
				description: needsProcess ? params.processDescription : undefined,
			},
			entities: targetEntity
				? [...sourceEntities, targetEntity]
				: sourceEntities,
			mappings: mappings ? [mappings] : [],
			failedMappings: [],
		};

		this.logger.log(
			`Конвертация завершена: entities=${commitJson.entities.length}, mappings=${commitJson.mappings.length}`,
		);

		return commitJson;
	}

	private detectMode(fileName?: string): "datamart" | "json" | "model" {
		const lower = (fileName ?? "").toLowerCase();
		if (lower.includes("model_")) return "model";
		if (lower.includes("json_")) return "json";
		return "datamart";
	}

	private findMappingSheet(workbook: S2TWorkbook): S2TWorksheet | null {
		return (
			workbook.worksheets.find((ws) => ws.name.toLowerCase() === "mapping") ||
			null
		);
	}

	private parseMappingSheet(
		sheet: S2TWorksheet,
		params: { mode: "datamart" | "json" | "model" },
	): {
		sourceEntities: DataLineageSchema["entities"];
		targetEntity: DataLineageSchema["entities"][0] | null;
		mappings: DataLineageSchema["mappings"][0] | null;
		issues: string[];
	} {
		const rows = sheet.rows;
		if (rows.length < 3) {
			throw new BadRequestException(
				`Лист Mapping содержит недостаточно строк (rows=${rows.length}). Ожидается минимум 3 (заголовок + данные).`,
			);
		}

		const sourceEntitiesMap = new Map<
			string,
			DataLineageSchema["entities"][0]
		>();
		const attrMapsMap = new Map<string, Array<{ src: string; dst: string }>>();

		let targetEntityId = "";
		let targetNamespace = "";
		let targetName = "";
		let targetDescription = "";
		let targetSystemCode = "";
		const targetAttrs: Array<{ name: string; type: string; comment: string }> =
			[];
		const issues: string[] = [];

		if (params.mode === "json") {
			const jsonEntitiesMap = new Map<
				string,
				DataLineageSchema["entities"][0]
			>();

			for (let i = 2; i < rows.length; i++) {
				const row = rows[i];
				const cells = row.cells;
				const rowNo = row.number ?? i + 1;

				const getCell = (col: number): string => {
					const cell = cells.find((c) => c.col === col);
					return this.extractCellText(cell?.value);
				};

				const targetSystemCode_cell = getCell(19).trim();
				const targetSchema = getCell(20).trim();
				const targetTable = getCell(21).trim();
				const targetDescription_cell = getCell(24).trim();
				const targetAttrName = getCell(22).trim();
				const targetAttrComment = getCell(23).trim();
				const targetAttrType = getCell(26).trim();

				if (!targetTable) {
					if (targetAttrName || targetAttrType || targetDescription_cell) {
						issues.push(
							`Mapping/${rowNo}: режим json_ — заполнены поля Target, но пустая Target.Таблица(U)`,
						);
					}
					continue;
				}

				const entityId = targetSchema
					? `${targetSchema}/${targetTable}`
					: targetTable;
				const systemCode = targetSystemCode_cell || "1642";

				if (!jsonEntitiesMap.has(entityId)) {
					jsonEntitiesMap.set(entityId, {
						id: entityId,
						modified: true,
						type: "json",
						namespace: undefined,
						name: targetTable,
						entity_change: "",
						description: targetDescription_cell,
						system_code: systemCode,
						attrSeq: [],
					});
				}

				const entity = jsonEntitiesMap.get(entityId)!;
				if (targetDescription_cell && !entity.description) {
					entity.description = targetDescription_cell;
				}

				if (targetAttrName && targetAttrType) {
					const exists = entity.attrSeq?.some((a) => a.name === targetAttrName);
					if (!exists) {
						entity.attrSeq = entity.attrSeq || [];
						entity.attrSeq.push({
							name: targetAttrName,
							type: this.normalizeType(targetAttrType),
							comment: targetAttrComment || "",
						});
					}
				}
			}

			if (jsonEntitiesMap.size === 0) {
				throw new BadRequestException(
					"Не найдено ни одной JSON сущности (Target) в листе Mapping. Проверьте заполнение колонки Target.Таблица(U).",
				);
			}

			return {
				sourceEntities: Array.from(jsonEntitiesMap.values()),
				targetEntity: null,
				mappings: null,
				issues,
			};
		}

		for (let i = 2; i < rows.length; i++) {
			const row = rows[i];
			const cells = row.cells;
			const rowNo = row.number ?? i + 1;

			const getCell = (col: number): string => {
				const cell = cells.find((c) => c.col === col);
				return this.extractCellText(cell?.value);
			};

			const sourceSystemCode = getCell(2).trim();
			const sourceSchema = getCell(4).trim();
			const sourceTable = getCell(3).trim();
			const sourceDescription = getCell(6).trim();
			const sourceAttrName = getCell(7).trim();
			const sourceAttrComment = getCell(8).trim();
			const sourceAttrType = getCell(9).trim();

			const targetSystemCode_cell = getCell(19).trim();
			const targetSchema = getCell(20).trim();
			const targetTable = getCell(21).trim();
			const targetDescription_cell = getCell(24).trim();
			const targetAttrName = getCell(22).trim();
			const targetAttrComment = getCell(23).trim();
			const targetAttrType = getCell(26).trim();

			if (
				(sourceAttrName || sourceAttrType) &&
				(!sourceSchema || !sourceTable)
			) {
				issues.push(
					`Mapping/${rowNo}: заполнен атрибут Source (G/I), но пустые Source.Схема(D) или Source.Таблица(C)`,
				);
			}
			if (
				params.mode === "datamart" &&
				(targetAttrName || targetAttrType) &&
				(!targetSchema || !targetTable)
			) {
				issues.push(
					`Mapping/${rowNo}: заполнен атрибут Target (V/Z), но пустые Target.Схема(T) или Target.Таблица(U)`,
				);
			}

			if (targetTable) {
				// Для json-mode schema может быть пустой (по требованиям)
				targetEntityId = targetSchema
					? `${targetSchema}/${targetTable}`
					: targetTable;
				targetNamespace = targetSchema;
				targetName = targetTable;
				targetSystemCode = targetSystemCode_cell;
				if (targetDescription_cell) targetDescription = targetDescription_cell;
			}

			if (targetAttrName && targetAttrType) {
				const existing = targetAttrs.find((a) => a.name === targetAttrName);
				if (!existing) {
					targetAttrs.push({
						name: targetAttrName,
						type: this.normalizeType(targetAttrType),
						comment: targetAttrComment || "",
					});
				}
			}

			if (sourceSchema && sourceTable) {
				const sourceEntityId = `${sourceSchema}/${sourceTable}`;
				const normalizedSourceSystemCode =
					sourceSystemCode || (params.mode === "model" ? "1655" : "");
				const resolvedSourceType =
					params.mode === "model" &&
					sourceTable.toUpperCase().startsWith("JSON_")
						? "json"
						: "table";

				if (!sourceEntitiesMap.has(sourceEntityId)) {
					sourceEntitiesMap.set(sourceEntityId, {
						id: sourceEntityId,
						modified: false,
						type: resolvedSourceType,
						namespace: sourceSchema,
						name: sourceTable,
						entity_change: "",
						description: sourceDescription,
						system_code: normalizedSourceSystemCode || undefined,
						attrSeq: [],
					});
					attrMapsMap.set(sourceEntityId, []);
				}

				const entity = sourceEntitiesMap.get(sourceEntityId)!;

				if (sourceAttrName && sourceAttrType) {
					const existingAttr = entity.attrSeq?.find(
						(a) => a.name === sourceAttrName,
					);
					if (!existingAttr) {
						entity.attrSeq = entity.attrSeq || [];
						entity.attrSeq.push({
							name: sourceAttrName,
							type: this.normalizeType(sourceAttrType),
							comment: sourceAttrComment || "",
						});
					}

					if (targetAttrName) {
						const maps = attrMapsMap.get(sourceEntityId)!;
						const existingMap = maps.find(
							(m) => m.src === sourceAttrName && m.dst === targetAttrName,
						);
						if (!existingMap) {
							maps.push({ src: sourceAttrName, dst: targetAttrName });
						}
					}
				}
			}
		}

		let targetEntity: DataLineageSchema["entities"][0] | null = null;
		let mappings: DataLineageSchema["mappings"][0] | null = null;

		if (!targetEntityId) {
			if (params.mode === "datamart") {
				const sample = issues.slice(0, 5).join(" | ");
				throw new BadRequestException(
					`Не найдена целевая сущность (Target) в листе Mapping. Проверьте заполнение колонок Target.Схема(T) и Target.Таблица(U). Примеры проблем: ${sample || "—"}`,
				);
			}
			throw new BadRequestException(
				`Не найдена целевая сущность (Target) в листе Mapping для режима ${params.mode}. Проверьте заполнение колонки Target.Таблица(U).`,
			);
		} else {
			const normalizedTargetSystemCode =
				targetSystemCode || (params.mode === "model" ? "1655" : "");
			const resolvedTargetType =
				params.mode === "model" ? "input_vector" : "table";

			targetEntity = {
				id: targetEntityId,
				modified: true,
				type: resolvedTargetType,
				namespace: targetNamespace || undefined,
				name: targetName,
				entity_change: "",
				description: targetDescription,
				system_code: normalizedTargetSystemCode || undefined,
				attrSeq: targetAttrs,
			};

			if (params.mode === "datamart" || params.mode === "model") {
				const deps = Array.from(sourceEntitiesMap.keys()).map(
					(sourceEntityId) => {
						const sourceEntity = sourceEntitiesMap.get(sourceEntityId);
						return {
							entityId: sourceEntityId,
							system_code: sourceEntity?.system_code,
							attrMaps: attrMapsMap.get(sourceEntityId) || [],
							atrDeps: [],
						};
					},
				);

				mappings = {
					id: 1,
					entityId: targetEntityId,
					system_code: normalizedTargetSystemCode || undefined,
					process: "",
					processId: null,
					deps,
					unmatched: [],
				};
			}
		}

		return {
			sourceEntities: Array.from(sourceEntitiesMap.values()),
			targetEntity,
			mappings,
			issues,
		};
	}

	private normalizeType(type: string): string {
		if (!type) return "string";
		const lower = type.toLowerCase().trim();

		if (lower.includes("timestamp") || lower.includes("datetime"))
			return "timestamp";
		if (lower.includes("date")) return "date";
		if (
			lower.includes("decimal") ||
			lower.includes("numeric") ||
			lower.includes("double") ||
			lower.includes("float")
		)
			return "decimal";
		if (lower.includes("int") || lower.includes("integer")) return "integer";
		if (lower.includes("bool")) return "boolean";
		if (
			lower.includes("char") ||
			lower.includes("varchar") ||
			lower.includes("text")
		)
			return "string";

		return "string";
	}
}
