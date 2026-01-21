import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import mammoth from "mammoth";

function printUsage() {
	// eslint-disable-next-line no-console
	console.log("Usage: node scripts/docx-to-md.mjs [--format html|md] <inputDir> <outputDir>");
	// eslint-disable-next-line no-console
	console.log("Default format: html");
	// eslint-disable-next-line no-console
	console.log("Example (html): node scripts/docx-to-md.mjs docs/s2t_task/docx docs/s2t_task/docx_html");
	// eslint-disable-next-line no-console
	console.log("Example (md):   node scripts/docx-to-md.mjs --format md docs/s2t_task/docx docs/s2t_task/docx_md");
}

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function listDocxFiles(inputDir) {
	const entries = await fs.readdir(inputDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".docx"))
		.map((e) => path.join(inputDir, e.name));
}

function parseArgs(argv) {
	let format = "html";
	const positional = [];

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--help" || arg === "-h") return { help: true, format };

		if (arg === "--format" || arg === "-f") {
			const next = argv[i + 1];
			if (!next) return { error: "Missing value for --format" };
			format = String(next).toLowerCase();
			i += 1;
			continue;
		}

		positional.push(arg);
	}

	if (format !== "html" && format !== "md" && format !== "markdown") {
		return { error: `Unsupported format: ${format}. Expected: html|md` };
	}

	if (format === "markdown") format = "md";

	return { format, positional };
}

async function convertOne(inputFilePath, outputDir, format) {
	const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
	const extension = format === "md" ? "md" : "html";
	const outPath = path.join(outputDir, `${baseName}.${extension}`);
	const outWarningsPath = path.join(outputDir, `${baseName}.warnings.json`);

	const result =
		format === "md"
			? await mammoth.convertToMarkdown({ path: inputFilePath })
			: await mammoth.convertToHtml({ path: inputFilePath });
	await fs.writeFile(outPath, result.value ?? "", "utf8");

	return { outPath, warningsCount: (result.messages ?? []).length };
}

async function main() {
	const parsed = parseArgs(process.argv.slice(2));
	if (parsed?.help) {
		printUsage();
		return;
	}

	if (parsed?.error) {
		// eslint-disable-next-line no-console
		console.error(parsed.error);
		printUsage();
		process.exitCode = 1;
		return;
	}

	const [inputDirRaw, outputDirRaw] = parsed.positional ?? [];
	if (!inputDirRaw || !outputDirRaw) {
		printUsage();
		process.exitCode = 1;
		return;
	}

	const inputDir = path.resolve(process.cwd(), inputDirRaw);
	const outputDir = path.resolve(process.cwd(), outputDirRaw);

	await ensureDir(outputDir);

	const files = await listDocxFiles(inputDir);
	if (files.length === 0) {
		// eslint-disable-next-line no-console
		console.log(`No .docx files found in: ${inputDir}`);
		return;
	}

	let converted = 0;
	let totalWarnings = 0;

	for (const filePath of files) {
		const { outPath, warningsCount } = await convertOne(filePath, outputDir, parsed.format);
		converted += 1;
		totalWarnings += warningsCount;
		// eslint-disable-next-line no-console
		console.log(`Converted: ${path.basename(filePath)} -> ${path.relative(process.cwd(), outPath)} (warnings: ${warningsCount})`);
	}

	// eslint-disable-next-line no-console
	console.log(`Done. Converted: ${converted}. Total warnings: ${totalWarnings}. Output dir: ${path.relative(process.cwd(), outputDir)}`);
}

await main();
