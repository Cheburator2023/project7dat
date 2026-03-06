import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ExcelJS from "exceljs";

function printUsage() {
	console.log("Usage:");
	// eslint-disable-next-line no-console
	console.log("  node scripts/xlsx-to-json.mjs <input.xlsx> [output.json] [--pretty]");
	// eslint-disable-next-line no-console
	console.log("  node scripts/xlsx-to-json.mjs <inputDir> <outputDir> [--recursive] [--pretty]");
	// eslint-disable-next-line no-console
	console.log("Options:");
	// eslint-disable-next-line no-console
	console.log("  --recursive        Search for .xlsx files recursively (directory mode)");
	// eslint-disable-next-line no-console
	console.log("  --pretty           Pretty-print JSON");
	// eslint-disable-next-line no-console
	console.log("  --help, -h         Show this help");
	// eslint-disable-next-line no-console
	console.log("Example:");
	// eslint-disable-next-line no-console
	console.log("  node scripts/xlsx-to-json.mjs docs/s2t_task/s2t_files_examples/model_S2T_пример модели.xlsx out.json --pretty");
	// eslint-disable-next-line no-console
	console.log("  node scripts/xlsx-to-json.mjs docs/s2t_task/s2t_files_examples out-json --recursive --pretty");
}

function parseArgs(argv) {
	const positional = [];
	let pretty = false;
	let recursive = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--help" || arg === "-h") return { help: true };
		if (arg === "--pretty") {
			pretty = true;
			continue;
		}
		if (arg === "--recursive") {
			recursive = true;
			continue;
		}
		positional.push(arg);
	}

	return { positional, pretty, recursive };
}

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function pathStat(p) {
	try {
		return await fs.stat(p);
	} catch {
		return null;
	}
}

async function listXlsxFiles(inputDir, recursive) {
	const results = [];
	const dirents = await fs.readdir(inputDir, { withFileTypes: true });

	for (const d of dirents) {
		const abs = path.join(inputDir, d.name);
		if (d.isDirectory()) {
			if (!recursive) continue;
			const inner = await listXlsxFiles(abs, recursive);
			results.push(...inner);
			continue;
		}

		if (!d.isFile()) continue;
		if (!d.name.toLowerCase().endsWith(".xlsx")) continue;
		results.push(abs);
	}

	return results;
}

function toPlainValue(value) {
	if (value == null) return value;

	if (value instanceof Date) {
		return { $type: "date", value: value.toISOString() };
	}

	if (Buffer.isBuffer(value)) {
		return { $type: "buffer", value: value.toString("base64") };
	}

	if (Array.isArray(value)) return value.map((v) => toPlainValue(v));

	if (typeof value === "object") {
		const out = {};
		for (const [k, v] of Object.entries(value)) out[k] = toPlainValue(v);
		return out;
	}

	return value;
}

function cellToJson(cell) {
	const raw = cell.value;
	const cellValue = toPlainValue(raw);

	const formula = raw && typeof raw === "object" && "formula" in raw ? raw.formula : undefined;
	const result = raw && typeof raw === "object" && "result" in raw ? toPlainValue(raw.result) : undefined;

	return {
		address: cell.address,
		row: cell.row,
		col: cell.col,
		type: cell.type,
		value: cellValue,
		formula,
		result,
		numFmt: cell.numFmt,
		style: toPlainValue(cell.style),
	};
}

function worksheetToJson(worksheet) {
	const columns = (worksheet.columns ?? []).map((c) => ({
		header: toPlainValue(c.header),
		key: c.key,
		width: c.width,
		hidden: c.hidden,
		outlineLevel: c.outlineLevel,
		style: toPlainValue(c.style),
	}));

	const rows = [];
	worksheet.eachRow({ includeEmpty: true }, (row) => {
		const cells = [];
		row.eachCell({ includeEmpty: true }, (cell) => {
			cells.push(cellToJson(cell));
		});
		rows.push({
			number: row.number,
			height: row.height,
			hidden: row.hidden,
			outlineLevel: row.outlineLevel,
			style: toPlainValue(row.style),
			cells,
		});
	});

	const merges = (() => {
		const anyMerges = worksheet.model?.merges;
		if (Array.isArray(anyMerges)) return anyMerges;
		if (anyMerges && typeof anyMerges === "object") return Object.keys(anyMerges);
		return [];
	})();

	return {
		id: worksheet.id,
		name: worksheet.name,
		state: worksheet.state,
		properties: toPlainValue(worksheet.properties),
		pageSetup: toPlainValue(worksheet.pageSetup),
		headerFooter: toPlainValue(worksheet.headerFooter),
		views: toPlainValue(worksheet.views),
		columns,
		rows,
		merges,
		dataValidations: toPlainValue(worksheet.dataValidations?.model),
	};
}

async function convertOneXlsxToJson({ inputPath, outputPath, pretty }) {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(inputPath);

	const json = {
		meta: {
			input: inputPath,
			generatedAt: new Date().toISOString(),
		},
		workbook: {
			creator: workbook.creator,
			lastModifiedBy: workbook.lastModifiedBy,
			created: toPlainValue(workbook.created),
			modified: toPlainValue(workbook.modified),
			lastPrinted: toPlainValue(workbook.lastPrinted),
			properties: toPlainValue(workbook.properties),
			calcProperties: toPlainValue(workbook.calcProperties),
			views: toPlainValue(workbook.views),
			definedNames: toPlainValue(workbook.definedNames?.model),
			worksheets: workbook.worksheets.map((ws) => worksheetToJson(ws)),
		},
	};

	const serialized = JSON.stringify(json, null, pretty ? 2 : 0);
	await ensureDir(path.dirname(outputPath));
	await fs.writeFile(outputPath, serialized, "utf8");
}

async function main() {
	const parsed = parseArgs(process.argv.slice(2));
	if (parsed?.help) {
		printUsage();
		return;
	}

	const [inputRaw, outputRaw] = parsed.positional ?? [];
	if (!inputRaw) {
		printUsage();
		process.exitCode = 1;
		return;
	}

	const inputPath = path.resolve(process.cwd(), inputRaw);
	const inputStat = await pathStat(inputPath);
	if (!inputStat) {
		// eslint-disable-next-line no-console
		console.error(`Input path does not exist: ${inputRaw}`);
		process.exitCode = 1;
		return;
	}

	if (inputStat.isDirectory()) {
		const outputDirRaw = outputRaw ?? `${path.basename(inputPath)}_json`;
		const outputDir = path.resolve(process.cwd(), outputDirRaw);
		await ensureDir(outputDir);

		const files = await listXlsxFiles(inputPath, parsed.recursive);
		if (files.length === 0) {
			// eslint-disable-next-line no-console
			console.log(`No .xlsx files found in: ${path.relative(process.cwd(), inputPath)}`);
			return;
		}

		let converted = 0;
		for (const absFile of files) {
			const relFromInput = path.relative(inputPath, absFile);
			const relOut = relFromInput.replace(/\.xlsx$/i, ".json");
			const outFile = path.join(outputDir, relOut);
			await convertOneXlsxToJson({
				inputPath: path.relative(process.cwd(), absFile),
				outputPath: outFile,
				pretty: parsed.pretty,
			});
			converted += 1;
		}

		// eslint-disable-next-line no-console
		console.log(`Done. Converted: ${converted}. Output dir: ${path.relative(process.cwd(), outputDir)}`);
		return;
	}

	const outputPath = path.resolve(
		process.cwd(),
		outputRaw ?? `${path.basename(inputPath, path.extname(inputPath))}.json`,
	);

	await convertOneXlsxToJson({
		inputPath: path.relative(process.cwd(), inputPath),
		outputPath,
		pretty: parsed.pretty,
	});

	// eslint-disable-next-line no-console
	console.log(`Saved: ${path.relative(process.cwd(), outputPath)}`);
}

await main();
