import { Injectable, Logger, BadRequestException } from "@nestjs/common";

interface DataLineageSchema {
	desc: {
		appId: string;
		appName: string;
	};
	entities: Array<{
		id: string;
		modified: boolean;
		type: "table" | "view" | "rdd" | "unresolved";
		namespace?: string;
		name: string | null;
		description?: string;
		attrSeq?: Array<{
			name: string;
			type: string;
			comment?: string;
		}>;
	}>;
	mappings: Array<{
		id: number;
		entityId: string;
		deps?: Array<{
			entityId: string;
			attrMaps?: Array<{
				src: string;
				dst: string;
			}>;
			atrDeps?: Array<{
				attr: string;
				linkTypes?: Array<"window" | "join" | "where" | "groupby">;
			}>;
		}>;
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

	convertWorkbookToCommitJson(params: {
		workbook: S2TWorkbook;
		processName?: string;
		processDescription?: string;
		commitName: string;
	}): DataLineageSchema {
		this.logger.log("Начало конвертации S2T workbook → commit JSON");

		const mappingSheet = this.findMappingSheet(params.workbook);
		if (!mappingSheet) {
			throw new BadRequestException("Не найден лист 'Mapping' в S2T файле");
		}

		const { sourceEntities, targetEntity, mappings } =
			this.parseMappingSheet(mappingSheet);

		const commitJson: DataLineageSchema = {
			desc: {
				appId: params.processName || params.commitName,
				appName: params.processName || params.commitName,
			},
			entities: [...sourceEntities, targetEntity],
			mappings: [mappings],
			failedMappings: [],
		};

		this.logger.log(
			`Конвертация завершена: entities=${commitJson.entities.length}, mappings=${commitJson.mappings.length}`,
		);

		return commitJson;
	}

	private findMappingSheet(workbook: S2TWorkbook): S2TWorksheet | null {
		return (
			workbook.worksheets.find((ws) => ws.name.toLowerCase() === "mapping") ||
			null
		);
	}

	private parseMappingSheet(sheet: S2TWorksheet): {
		sourceEntities: DataLineageSchema["entities"];
		targetEntity: DataLineageSchema["entities"][0];
		mappings: DataLineageSchema["mappings"][0];
	} {
		const rows = sheet.rows;
		if (rows.length < 3) {
			throw new BadRequestException("Лист Mapping содержит недостаточно строк");
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
		const targetAttrs: Array<{ name: string; type: string; comment: string }> =
			[];

		for (let i = 2; i < rows.length; i++) {
			const row = rows[i];
			const cells = row.cells;

			const getCell = (col: number): string => {
				const cell = cells.find((c) => c.col === col);
				const val = cell?.value;
				if (val === null || val === undefined) return "";
				if (typeof val === "object" && val.result !== undefined)
					return String(val.result || "");
				return String(val || "");
			};

			const sourceSchema = getCell(4).trim();
			const sourceTable = getCell(3).trim();
			const sourceDescription = getCell(6).trim();
			const sourceAttrName = getCell(7).trim();
			const sourceAttrComment = getCell(8).trim();
			const sourceAttrType = getCell(9).trim();

			const targetSchema = getCell(20).trim();
			const targetTable = getCell(21).trim();
			const targetDescription_cell = getCell(24).trim();
			const targetAttrName = getCell(22).trim();
			const targetAttrComment = getCell(23).trim();
			const targetAttrType = getCell(26).trim();

			if (targetSchema && targetTable) {
				targetEntityId = `${targetSchema}/${targetTable}`;
				targetNamespace = targetSchema;
				targetName = targetTable;
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

				if (!sourceEntitiesMap.has(sourceEntityId)) {
					sourceEntitiesMap.set(sourceEntityId, {
						id: sourceEntityId,
						modified: false,
						type: "table",
						namespace: sourceSchema,
						name: sourceTable,
						description: sourceDescription,
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

		if (!targetEntityId) {
			throw new BadRequestException(
				"Не найдена целевая сущность (Target) в листе Mapping",
			);
		}

		const targetEntity: DataLineageSchema["entities"][0] = {
			id: targetEntityId,
			modified: true,
			type: "view",
			namespace: targetNamespace,
			name: targetName,
			description: targetDescription,
			attrSeq: targetAttrs,
		};

		const deps = Array.from(sourceEntitiesMap.keys()).map((sourceEntityId) => ({
			entityId: sourceEntityId,
			attrMaps: attrMapsMap.get(sourceEntityId) || [],
			atrDeps: [],
		}));

		const mappings: DataLineageSchema["mappings"][0] = {
			id: 1,
			entityId: targetEntityId,
			deps,
		};

		return {
			sourceEntities: Array.from(sourceEntitiesMap.values()),
			targetEntity,
			mappings,
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
