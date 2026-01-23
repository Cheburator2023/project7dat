import { Injectable, Logger } from "@nestjs/common";
import ExcelJS from "exceljs";

@Injectable()
export class S2tConversionService {
	private readonly logger = new Logger(S2tConversionService.name);

	private toPlainValue(value: any): any {
		if (value == null) return value;

		if (value instanceof Date) {
			return { $type: "date", value: value.toISOString() };
		}

		if (Buffer.isBuffer(value)) {
			return { $type: "buffer", value: value.toString("base64") };
		}

		if (Array.isArray(value)) return value.map((v) => this.toPlainValue(v));

		if (typeof value === "object") {
			const out: Record<string, any> = {};
			for (const [k, v] of Object.entries(value)) out[k] = this.toPlainValue(v);
			return out;
		}

		return value;
	}

	private cellToJson(cell: ExcelJS.Cell) {
		const raw: any = cell.value;
		const cellValue = this.toPlainValue(raw);

		const formula =
			raw && typeof raw === "object" && "formula" in raw
				? raw.formula
				: undefined;
		const result =
			raw && typeof raw === "object" && "result" in raw
				? this.toPlainValue(raw.result)
				: undefined;

		return {
			address: cell.address,
			row: cell.row,
			col: cell.col,
			type: cell.type,
			value: cellValue,
			formula,
			result,
			numFmt: (cell as any).numFmt,
			style: this.toPlainValue((cell as any).style),
		};
	}

	private worksheetToJson(worksheet: ExcelJS.Worksheet) {
		const columns = (worksheet.columns ?? []).map((c: any) => ({
			header: this.toPlainValue(c.header),
			key: c.key,
			width: c.width,
			hidden: c.hidden,
			outlineLevel: c.outlineLevel,
			style: this.toPlainValue(c.style),
		}));

		const rows: Array<Record<string, any>> = [];
		worksheet.eachRow({ includeEmpty: true }, (row) => {
			const cells: Array<Record<string, any>> = [];
			row.eachCell({ includeEmpty: true }, (cell) => {
				cells.push(this.cellToJson(cell));
			});
			rows.push({
				number: row.number,
				height: (row as any).height,
				hidden: (row as any).hidden,
				outlineLevel: (row as any).outlineLevel,
				style: this.toPlainValue((row as any).style),
				cells,
			});
		});

		const merges = (() => {
			const anyMerges: any = (worksheet as any).model?.merges;
			if (Array.isArray(anyMerges)) return anyMerges;
			if (anyMerges && typeof anyMerges === "object")
				return Object.keys(anyMerges);
			return [];
		})();

		return {
			id: worksheet.id,
			name: worksheet.name,
			state: worksheet.state,
			properties: this.toPlainValue((worksheet as any).properties),
			pageSetup: this.toPlainValue((worksheet as any).pageSetup),
			headerFooter: this.toPlainValue((worksheet as any).headerFooter),
			views: this.toPlainValue((worksheet as any).views),
			columns,
			rows,
			merges,
			dataValidations: this.toPlainValue(
				(worksheet as any).dataValidations?.model,
			),
		};
	}

	async convertXlsxBase64ToWorkbookJson(params: {
		xlsxBase64: string;
		fileName?: string;
	}): Promise<{
		meta: { fileName?: string; generatedAt: string };
		workbook: any;
	}> {
		const { xlsxBase64, fileName } = params;
		this.logger.log(`S2T xlsx→json: start (fileName=${fileName ?? ""})`);

		const buf = Buffer.from(xlsxBase64, "base64");
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buf as any);

		return {
			meta: {
				fileName,
				generatedAt: new Date().toISOString(),
			},
			workbook: {
				creator: workbook.creator,
				lastModifiedBy: workbook.lastModifiedBy,
				created: this.toPlainValue(workbook.created),
				modified: this.toPlainValue(workbook.modified),
				lastPrinted: this.toPlainValue((workbook as any).lastPrinted),
				properties: this.toPlainValue(workbook.properties),
				calcProperties: this.toPlainValue((workbook as any).calcProperties),
				views: this.toPlainValue((workbook as any).views),
				definedNames: this.toPlainValue((workbook as any).definedNames?.model),
				worksheets: workbook.worksheets.map((ws) => this.worksheetToJson(ws)),
			},
		};
	}
}
