import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { JsonExportService } from "./json-export.service";

type JsonExportEntity = {
	id: string;
	type: string;
	namespace?: string;
	name: string | null;
	description?: string;
	system_code?: string;
	attrSeq?: Array<{ name: string; type: string; comment?: string }>;
};

type JsonExportMapping = {
	entityId: string;
	process?: string;
	process_description?: string;
	description?: string;
	deps?: Array<{
		entityId: string;
		attrMaps?: Array<{ src: string; dst: string }>;
		atrDeps?: Array<{ attr: string; linkTypes?: string[] }>;
	}>;
};

type JsonExportResult = {
	desc: { change_date: string };
	entities: JsonExportEntity[];
	mappings: JsonExportMapping[];
};

const PLACEHOLDER_CELL_VALUE = "-";
const NO_DATA_CELL_VALUE = "данных нет";

const COLORS = {
	headerDark: "FF1F4E79",
	headerLight: "FFD9E1F2",
	headerGray: "FFE7E6E6",
	sourceGroup: "FFBDD7EE",
	targetGroup: "FFC6E0B4",
	sourceTargetGroup: "FFD0CECE",
} as const;

const XLSX_MIME_TYPE =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const sanitizeFilePart = (value: string) =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const formatYYMMDDHHMM = (date: Date) => {
	const yy = String(date.getFullYear() % 100).padStart(2, "0");
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const hh = String(date.getHours()).padStart(2, "0");
	const min = String(date.getMinutes()).padStart(2, "0");
	return `${yy}${mm}${dd}${hh}${min}`;
};

const buildDefaultFileName = (params: {
	schemaName?: string;
	entityName: string;
}) => {
	const timestamp = formatYYMMDDHHMM(new Date());
	const schemaPart = params.schemaName
		? sanitizeFilePart(params.schemaName)
		: "";
	const entityPart = sanitizeFilePart(params.entityName);
	const base = schemaPart ? `${schemaPart}.${entityPart}` : entityPart;
	return `${base}${timestamp}.xlsx`;
};

const isTempLike = (value: string) => {
	const v = value.toLowerCase();
	return (
		v.includes("tmp") ||
		v.includes("temp") ||
		v.includes("temporary") ||
		v.includes("врем") ||
		v.includes("темп")
	);
};

const parseSchemaAndTable = (
	entityId: string,
): { schema?: string; table: string } => {
	const trimmed = entityId.trim();
	const lastDotIdx = trimmed.lastIndexOf(".");
	if (lastDotIdx > 0 && lastDotIdx < trimmed.length - 1) {
		return {
			schema: trimmed.slice(0, lastDotIdx),
			table: trimmed.slice(lastDotIdx + 1),
		};
	}
	return { table: trimmed };
};

@Injectable()
export class S2tExportService {
	private readonly logger = new Logger(S2tExportService.name);

	constructor(private readonly jsonExportService: JsonExportService) {}

	private findEntity(exportData: JsonExportResult, entityId: string) {
		return exportData.entities.find((e) => e.id === entityId) ?? null;
	}

	private findMapping(exportData: JsonExportResult, targetEntityId: string) {
		return (
			exportData.mappings.find((m) => m.entityId === targetEntityId) ?? null
		);
	}

	private getAttrMeta(entity: JsonExportEntity, attrName: string) {
		const attr = entity.attrSeq?.find((a) => a.name === attrName);
		return {
			type: attr?.type ?? "",
			comment: attr?.comment ?? "",
		};
	}

	private styleHeaderRange(params: {
		worksheet: ExcelJS.Worksheet;
		row: number;
		fromCol: number;
		toCol: number;
		fillArgb: string;
		fontColorArgb?: string;
	}) {
		for (let col = params.fromCol; col <= params.toCol; col += 1) {
			const cell = params.worksheet.getCell(params.row, col);
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: params.fillArgb },
			};
			cell.font = {
				bold: true,
				color: params.fontColorArgb
					? { argb: params.fontColorArgb }
					: undefined,
			};
			cell.alignment = {
				vertical: "middle",
				horizontal: "center",
				wrapText: true,
			};
			cell.border = {
				top: { style: "thin", color: { argb: "FFBFBFBF" } },
				left: { style: "thin", color: { argb: "FFBFBFBF" } },
				bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
				right: { style: "thin", color: { argb: "FFBFBFBF" } },
			};
		}
	}

	private applySimpleHeader(params: {
		worksheet: ExcelJS.Worksheet;
		headers: string[];
		addPlaceholderRow?: boolean;
	}) {
		const headerRow = params.worksheet.getRow(1);
		headerRow.values = [null, ...params.headers];
		headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
		headerRow.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: true,
		};
		headerRow.height = 18;
		headerRow.commit();

		params.worksheet.columns = params.headers.map((_, idx) => ({
			key: `c${idx + 1}`,
			width: 22,
		}));

		this.styleHeaderRange({
			worksheet: params.worksheet,
			row: 1,
			fromCol: 1,
			toCol: params.headers.length,
			fillArgb: COLORS.headerDark,
			fontColorArgb: "FFFFFFFF",
		});
		params.worksheet.views = [{ state: "frozen", ySplit: 1 }];

		if (params.addPlaceholderRow ?? true) {
			params.worksheet.addRow(params.headers.map(() => PLACEHOLDER_CELL_VALUE));
		}
	}

	private addNoDataRow(params: {
		worksheet: ExcelJS.Worksheet;
		columnsCount: number;
		message: string;
		messageColumnIndex1Based: number;
	}) {
		const row = Array.from(
			{ length: params.columnsCount },
			() => PLACEHOLDER_CELL_VALUE,
		);
		if (
			params.messageColumnIndex1Based >= 1 &&
			params.messageColumnIndex1Based <= params.columnsCount
		) {
			row[params.messageColumnIndex1Based - 1] = params.message;
		}
		params.worksheet.addRow(row);
	}

	private applyMappingHeader(worksheet: ExcelJS.Worksheet) {
		worksheet.getRow(1).height = 18;
		worksheet.getRow(2).height = 18;

		// row 1: group headers (merged cells like original template)
		worksheet.mergeCells(1, 1, 1, 2);
		worksheet.getCell(1, 1).value = "Source/Target";

		worksheet.mergeCells(1, 3, 1, 18);
		worksheet.getCell(1, 3).value = "Source";

		worksheet.mergeCells(1, 19, 1, 30);
		worksheet.getCell(1, 19).value = "Target";

		// Style group header row
		this.styleHeaderRange({
			worksheet,
			row: 1,
			fromCol: 1,
			toCol: 2,
			fillArgb: COLORS.sourceTargetGroup,
		});
		this.styleHeaderRange({
			worksheet,
			row: 1,
			fromCol: 3,
			toCol: 18,
			fillArgb: COLORS.sourceGroup,
		});
		this.styleHeaderRange({
			worksheet,
			row: 1,
			fromCol: 19,
			toCol: 30,
			fillArgb: COLORS.targetGroup,
		});

		// row 2: column headers (как в эталоне)
		const headers = [
			"#",
			"Тип объекта",
			"База/Система",
			"Схема",
			"Таблица",
			"Описание таблицы",
			"Код атрибута",
			"Краткое описание атрибута",
			"Тип данных",
			"Длина",
			"PK",
			"FK",
			"Not Null",
			"Dataset",
			"Algorithm",
			"Comment",
			"Status",
			"Version",
			"База/Система",
			"Схема",
			"Таблица",
			"Код атрибута",
			"Описание атрибута",
			"Описание таблицы",
			"Комментарий (рус)",
			"Тип данных",
			"Length",
			"PK",
			"FK",
			"Not Null",
		];

		const headerRow2 = worksheet.getRow(2);
		headerRow2.values = [null, ...headers];
		headerRow2.font = { bold: true };
		headerRow2.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: true,
		};
		headerRow2.commit();
		this.styleHeaderRange({
			worksheet,
			row: 2,
			fromCol: 1,
			toCol: headers.length,
			fillArgb: COLORS.headerGray,
		});

		worksheet.columns = headers.map((_, idx) => ({
			key: `c${idx + 1}`,
			width: idx === 0 ? 4 : 22,
		}));
		worksheet.autoFilter = {
			from: { row: 2, column: 1 },
			to: { row: 2, column: headers.length },
		};
		worksheet.views = [{ state: "frozen", ySplit: 2 }];
	}

	private async buildWorkbook(params: {
		exportData: JsonExportResult;
		targetEntityId: string;
	}) {
		const targetEntity = this.findEntity(
			params.exportData,
			params.targetEntityId,
		);
		if (!targetEntity) {
			throw new NotFoundException(
				`Целевая витрина '${params.targetEntityId}' не найдена`,
			);
		}

		if (!(targetEntity.type === "table" || targetEntity.type === "view")) {
			throw new BadRequestException(
				"Отчёт S2T формируется только для сущностей типа table или view",
			);
		}

		if (
			isTempLike(targetEntity.id) ||
			(targetEntity.name ? isTempLike(targetEntity.name) : false)
		) {
			throw new BadRequestException(
				"Отчёт S2T не формируется для временных сущностей",
			);
		}

		const mapping =
			this.findMapping(params.exportData, params.targetEntityId) ??
			({ entityId: params.targetEntityId, deps: [] } as JsonExportMapping);

		const targetParts = parseSchemaAndTable(targetEntity.id);
		const fileName = buildDefaultFileName({
			schemaName: targetParts.schema ?? targetEntity.namespace,
			entityName: targetParts.table,
		});

		const workbook = new ExcelJS.Workbook();
		workbook.creator = "data-lineage";
		workbook.created = new Date();

		// Листы как в исходном S2T XLSX-шаблоне
		const versionHistorySheet = workbook.addWorksheet("Version History");
		this.applySimpleHeader({
			worksheet: versionHistorySheet,
			headers: [
				"#",
				"Version",
				"Date",
				"Author",
				"Description",
				"Project",
				"Reviewer",
				"Review Date",
			],
			addPlaceholderRow: false,
		});
		versionHistorySheet.addRow([
			"1",
			"1",
			new Date().toISOString(),
			"data-lineage",
			"Сформировано автоматически",
			PLACEHOLDER_CELL_VALUE,
			PLACEHOLDER_CELL_VALUE,
			PLACEHOLDER_CELL_VALUE,
		]);

		const sourceTablesSheet = workbook.addWorksheet("Source Tables");
		this.applySimpleHeader({
			worksheet: sourceTablesSheet,
			headers: [
				"Database",
				"Schema",
				"Table Name",
				"Code",
				"Description",
				"Data Type",
				"PK",
				"Not Null",
				"Table Description",
			],
			addPlaceholderRow: false,
		});

		const targetTablesSheet = workbook.addWorksheet("Target Tables");
		this.applySimpleHeader({
			worksheet: targetTablesSheet,
			headers: [
				"Database",
				"Schema",
				"Table Name",
				"Short Description",
				"Documentation",
				"Rejects",
				"Additional Implementation Guidelines",
				"Version",
			],
			addPlaceholderRow: false,
		});

		const datasetsSheet = workbook.addWorksheet("Datasets");
		this.applySimpleHeader({
			worksheet: datasetsSheet,
			headers: ["Code", "Description", "Algorithm", "Comment", "Version"],
			addPlaceholderRow: false,
		});

		const mappingSheet = workbook.addWorksheet("Mapping");
		this.applyMappingHeader(mappingSheet);

		const commonAlgSheet = workbook.addWorksheet("Common ALG");
		this.applySimpleHeader({
			worksheet: commonAlgSheet,
			headers: [
				"Code",
				"Description",
				"Parameters",
				"Technical description",
				"Version",
			],
			addPlaceholderRow: false,
		});
		const questionsSheet = workbook.addWorksheet("Questions");
		this.applySimpleHeader({
			worksheet: questionsSheet,
			headers: [
				"#",
				"Question",
				"Created by",
				"Answer",
				"Answered by",
				"Status",
				"Version",
			],
			addPlaceholderRow: false,
		});
		const relatedDocsSheet = workbook.addWorksheet("Related Docs");
		this.applySimpleHeader({
			worksheet: relatedDocsSheet,
			headers: ["#", "Document", "Version"],
			addPlaceholderRow: false,
		});

		// Заполнение Source Tables / Target Tables / Datasets
		const sourceEntitiesById = new Map<string, JsonExportEntity>();
		for (const dep of mapping?.deps ?? []) {
			const sourceEntity = this.findEntity(params.exportData, dep.entityId);
			if (!sourceEntity) continue;
			if (
				isTempLike(sourceEntity.id) ||
				(sourceEntity.name ? isTempLike(sourceEntity.name) : false)
			) {
				continue;
			}
			sourceEntitiesById.set(sourceEntity.id, sourceEntity);
		}

		const sourceEntities = Array.from(sourceEntitiesById.values());
		let sourceTablesRows = 0;
		for (const sourceEntity of sourceEntities) {
			const sourceParts = parseSchemaAndTable(sourceEntity.id);
			const database = sourceEntity.system_code ?? PLACEHOLDER_CELL_VALUE;
			const schema = sourceParts.schema ?? sourceEntity.namespace ?? "";
			const tableName = sourceParts.table;
			const tableDescription = sourceEntity.description ?? "";

			if (!sourceEntity.attrSeq || sourceEntity.attrSeq.length === 0) {
				sourceTablesSheet.addRow([
					database,
					schema,
					tableName,
					PLACEHOLDER_CELL_VALUE,
					NO_DATA_CELL_VALUE,
					PLACEHOLDER_CELL_VALUE,
					PLACEHOLDER_CELL_VALUE,
					PLACEHOLDER_CELL_VALUE,
					tableDescription,
				]);
				sourceTablesRows += 1;
				continue;
			}

			for (const attr of sourceEntity.attrSeq) {
				sourceTablesSheet.addRow([
					database,
					schema,
					tableName,
					attr.name,
					attr.comment ?? "",
					attr.type,
					PLACEHOLDER_CELL_VALUE,
					PLACEHOLDER_CELL_VALUE,
					tableDescription,
				]);
				sourceTablesRows += 1;
			}
		}
		if (sourceTablesRows === 0) {
			this.addNoDataRow({
				worksheet: sourceTablesSheet,
				columnsCount: 9,
				message: NO_DATA_CELL_VALUE,
				messageColumnIndex1Based: 5,
			});
		}

		const targetDatabase = targetEntity.system_code ?? PLACEHOLDER_CELL_VALUE;
		targetTablesSheet.addRow([
			targetDatabase,
			targetParts.schema ?? targetEntity.namespace ?? "",
			targetParts.table,
			targetEntity.description ?? "",
			NO_DATA_CELL_VALUE,
			PLACEHOLDER_CELL_VALUE,
			PLACEHOLDER_CELL_VALUE,
			PLACEHOLDER_CELL_VALUE,
		]);

		if (mapping.process || mapping.process_description || mapping.description) {
			datasetsSheet.addRow([
				mapping.process ?? "-",
				mapping.process_description ?? mapping.description ?? "",
				mapping.process ?? "-",
				mapping.description ?? "",
				PLACEHOLDER_CELL_VALUE,
			]);
		} else {
			this.addNoDataRow({
				worksheet: datasetsSheet,
				columnsCount: 5,
				message: NO_DATA_CELL_VALUE,
				messageColumnIndex1Based: 2,
			});
		}

		// Остальные листы пока без источника данных в модели DL
		this.addNoDataRow({
			worksheet: commonAlgSheet,
			columnsCount: 5,
			message: NO_DATA_CELL_VALUE,
			messageColumnIndex1Based: 2,
		});
		this.addNoDataRow({
			worksheet: questionsSheet,
			columnsCount: 7,
			message: NO_DATA_CELL_VALUE,
			messageColumnIndex1Based: 2,
		});
		this.addNoDataRow({
			worksheet: relatedDocsSheet,
			columnsCount: 3,
			message: NO_DATA_CELL_VALUE,
			messageColumnIndex1Based: 2,
		});

		let rowIndex = 3;
		let seq = 1;
		for (const dep of mapping?.deps ?? []) {
			const sourceEntity = this.findEntity(params.exportData, dep.entityId);
			if (!sourceEntity) {
				this.logger.warn(
					`Источник '${dep.entityId}' не найден в entities, пропускаю`,
				);
				continue;
			}

			if (
				isTempLike(sourceEntity.id) ||
				(sourceEntity.name ? isTempLike(sourceEntity.name) : false)
			) {
				continue;
			}

			const sourceParts = parseSchemaAndTable(sourceEntity.id);
			const sourceSystemCode = sourceEntity.system_code ?? "";
			const targetSystemCode = targetEntity.system_code ?? "";

			for (const attrMap of dep.attrMaps ?? []) {
				const sourceAttrMeta = this.getAttrMeta(sourceEntity, attrMap.src);
				const targetAttrMeta = this.getAttrMeta(targetEntity, attrMap.dst);

				const row = mappingSheet.getRow(rowIndex);
				row.getCell(1).value = seq;
				row.getCell(2).value = "";

				row.getCell(3).value = sourceSystemCode;
				row.getCell(4).value =
					sourceParts.schema ?? sourceEntity.namespace ?? "";
				row.getCell(5).value = sourceParts.table;
				row.getCell(6).value = sourceEntity.description ?? "";
				row.getCell(7).value = attrMap.src;
				row.getCell(8).value = sourceAttrMeta.comment;
				row.getCell(9).value = sourceAttrMeta.type;

				row.getCell(19).value = targetSystemCode;
				row.getCell(20).value =
					targetParts.schema ?? targetEntity.namespace ?? "";
				row.getCell(21).value = targetParts.table;
				row.getCell(22).value = attrMap.dst;
				row.getCell(23).value = targetAttrMeta.comment;
				row.getCell(24).value = targetEntity.description ?? "";
				row.getCell(26).value = targetAttrMeta.type;

				row.commit();
				rowIndex += 1;
				seq += 1;
			}
		}

		// Если маппингов нет (или attrMaps пустые) — оставляем плейсхолдеры
		if (rowIndex === 3) {
			const row = Array.from({ length: 30 }, () => PLACEHOLDER_CELL_VALUE);
			row[0] = NO_DATA_CELL_VALUE;
			mappingSheet.addRow(row);
		}

		return { workbook, fileName };
	}

	async exportCurrentToXlsx(params: { targetEntityId: string }) {
		this.logger.log(`Экспорт S2T отчёта для '${params.targetEntityId}'`);
		const exportData =
			(await this.jsonExportService.exportToJson()) as any as JsonExportResult;

		const { workbook, fileName } = await this.buildWorkbook({
			exportData,
			targetEntityId: params.targetEntityId,
		});

		const buffer = await workbook.xlsx.writeBuffer();
		return { buffer: Buffer.from(buffer), fileName, mimeType: XLSX_MIME_TYPE };
	}

	async exportByChangeIdToXlsx(params: {
		targetEntityId: string;
		changeId: number;
	}) {
		this.logger.log(
			`Экспорт S2T отчёта для '${params.targetEntityId}' по change_id=${params.changeId}`,
		);
		const exportData = (await this.jsonExportService.exportByChangeId(
			params.changeId,
		)) as any as JsonExportResult;

		const { workbook, fileName } = await this.buildWorkbook({
			exportData,
			targetEntityId: params.targetEntityId,
		});

		const buffer = await workbook.xlsx.writeBuffer();
		return { buffer: Buffer.from(buffer), fileName, mimeType: XLSX_MIME_TYPE };
	}
}
