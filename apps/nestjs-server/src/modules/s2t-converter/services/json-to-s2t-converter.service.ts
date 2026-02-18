import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import * as XLSX from "xlsx";
import { S2TFileType } from "../interfaces/s2t-file-type.enum";

interface S2tAttribute {
	name: string;
	type: string;
	comment?: string;
}

@Injectable()
export class JsonToS2tConverterService {
	private readonly logger = new Logger(JsonToS2tConverterService.name);

	convertToS2t(jsonData: any, fileType?: S2TFileType): Buffer {
		this.logger.log("Конвертация JSON -> S2T");

		const type = fileType || this.detectType(jsonData);
		let headers: string[];
		let rows: any[][];

		switch (type) {
			case S2TFileType.MART:
				[headers, rows] = this.buildMart(jsonData);
				break;
			case S2TFileType.JSON:
				[headers, rows] = this.buildJson(jsonData);
				break;
			case S2TFileType.MODEL:
				[headers, rows] = this.buildModel(jsonData);
				break;
			default:
				throw new BadRequestException(`Неизвестный тип: ${type}`);
		}

		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		XLSX.utils.book_append_sheet(wb, ws, "Mapping");
		return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
	}

	private detectType(json: any): S2TFileType {
		const commitType = json?.desc?.commit_type;
		if (commitType === "table") return S2TFileType.MART;
		if (commitType === "json") return S2TFileType.JSON;
		if (commitType === "model") return S2TFileType.MODEL;
		throw new BadRequestException("Не удалось определить тип коммита");
	}

	// -------------------------------------------------------------
	// Витрина
	// -------------------------------------------------------------
	private buildMart(json: any): [string[], any[][]] {
		const headers = this.martHeaders();
		const rows: any[][] = [];

		const targetEntity = json.entities?.find((e: any) => e.modified === true);
		if (!targetEntity)
			throw new BadRequestException("Целевая сущность не найдена");

		const [targetSchema, targetTable] = this.splitId(targetEntity.id);
		const targetSys = targetEntity.system_code || "1642";
		const targetAttrMap = new Map<string, S2tAttribute>(
			(targetEntity.attrSeq || []).map((a: any) => [a.name, a]),
		);

		for (const mapping of json.mappings || []) {
			if (mapping.entityId !== targetEntity.id) continue;

			for (const dep of mapping.deps || []) {
				const [srcSchema, srcTable] = this.splitId(dep.entityId);
				const srcSys = dep.system_code || "1642";

				for (const am of dep.attrMaps || []) {
					const srcAttr = this.findAttr(json.entities, dep.entityId, am.src);
					const dstAttr = targetAttrMap.get(am.dst);

					const row = this.emptyRow();
					// Source
					row[1] = srcSys; // B
					row[3] = srcSchema; // D
					row[2] = srcTable; // C
					row[6] = am.src; // G
					row[7] = srcAttr?.comment || ""; // H
					row[8] = srcAttr?.type?.toLowerCase() || "string"; // I
					// Target
					row[18] = targetSys; // S
					row[19] = targetSchema; // T
					row[20] = targetTable; // U
					row[21] = am.dst; // V
					row[22] = dstAttr?.comment || ""; // W
					row[25] = dstAttr?.type?.toLowerCase() || "string"; // Z
					row[14] = "new"; // O
					rows.push(row);
				}
			}
		}

		return [headers, rows];
	}

	// -------------------------------------------------------------
	// JSON‑файл
	// -------------------------------------------------------------
	private buildJson(json: any): [string[], any[][]] {
		const headers = this.jsonHeaders();
		const rows: any[][] = [];

		const target = json.entities?.find(
			(e: any) => e.modified === true && e.type === "json",
		);
		if (!target) throw new BadRequestException("Сущность типа json не найдена");

		const [schema, table] = this.splitId(target.id);
		const sys = target.system_code || "1642";

		for (const attr of target.attrSeq || []) {
			const row = this.emptyRow();
			row[18] = sys; // S
			row[19] = schema; // T
			row[20] = table; // U
			row[21] = attr.name; // V
			row[22] = attr.comment || ""; // W
			row[25] = attr.type?.toLowerCase() || "string"; // Z
			rows.push(row);
		}

		return [headers, rows];
	}

	// -------------------------------------------------------------
	// Модель
	// -------------------------------------------------------------
	private buildModel(json: any): [string[], any[][]] {
		const headers = this.martHeaders(); // структура как у витрины
		const rows: any[][] = [];

		const target = json.entities?.find(
			(e: any) => e.modified === true && e.type === "input_vector",
		);
		if (!target) throw new BadRequestException("Целевой вектор не найден");

		const [targetSchema, targetTable] = this.splitId(target.id);
		const targetSys = target.system_code || "1655";
		const targetAttrMap = new Map<string, S2tAttribute>(
			(target.attrSeq || []).map((a: any) => [a.name, a]),
		);

		for (const mapping of json.mappings || []) {
			if (mapping.entityId !== target.id) continue;

			for (const dep of mapping.deps || []) {
				const [srcSchema, srcTable] = this.splitId(dep.entityId);
				const srcSys = dep.system_code || "1655";

				for (const am of dep.attrMaps || []) {
					const srcAttr = this.findAttr(json.entities, dep.entityId, am.src);
					const dstAttr = targetAttrMap.get(am.dst);

					const row = this.emptyRow();
					// Source
					row[1] = srcSys; // B
					row[3] = srcSchema; // D
					row[2] = srcTable; // C
					row[6] = am.src; // G
					row[7] = srcAttr?.comment || ""; // H
					row[8] = srcAttr?.type?.toLowerCase() || "string"; // I
					// Target
					row[18] = targetSys; // S
					row[19] = targetSchema; // T
					row[20] = targetTable; // U
					row[21] = am.dst; // V
					row[22] = dstAttr?.comment || ""; // W
					row[25] = dstAttr?.type?.toLowerCase() || "string"; // Z
					row[14] = "new"; // O
					rows.push(row);
				}
			}
		}

		return [headers, rows];
	}

	// -------------------------------------------------------------
	// Вспомогательные
	// -------------------------------------------------------------
	private splitId(entityId: string): [string, string] {
		const parts = entityId.split(".");
		return parts.length === 2 ? [parts[0], parts[1]] : ["default", entityId];
	}

	private findAttr(entities: any[], entityId: string, attrName: string): any {
		const e = entities.find((e: any) => e.id === entityId);
		return e?.attrSeq?.find((a: any) => a.name === attrName);
	}

	private emptyRow(length = 50): any[] {
		return new Array(length).fill("");
	}

	private martHeaders(): string[] {
		return [
			"",
			"База/Система",
			"",
			"Схема",
			"",
			"Таблица",
			"Код атрибута",
			"Краткое описание атрибута",
			"Тип данных",
			"",
			"",
			"",
			"",
			"",
			"commit",
			"",
			"",
			"",
			"База/Система",
			"",
			"Схема",
			"",
			"Таблица",
			"Код атрибута",
			"Краткое описание атрибута",
			"",
			"Тип данных",
			"",
			"",
			"",
			"",
			"",
			"",
		];
	}

	private jsonHeaders(): string[] {
		return [
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"База/Система",
			"",
			"Схема",
			"",
			"Таблица",
			"Код атрибута",
			"Краткое описание атрибута",
			"",
			"Тип данных",
		];
	}
}
