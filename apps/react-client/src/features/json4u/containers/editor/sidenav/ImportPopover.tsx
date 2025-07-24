import { toastErr } from "@react-client/features/json4u/lib/utils";
import type { CsvResult } from "@react-client/features/json4u/lib/worker/command/csv";
import { useEditor } from "@react-client/features/json4u/stores/editorStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

import { Button, ButtonGroup, Checkbox } from "@mui/material";
import { Spacer } from "@react-client/common/primitives/Spacer";

type FileType = "JSON" | "CSV";

export function ImportPopover() {
	const t = useTranslations();
	const [fileType, setFileType] = useState<FileType>("JSON");
	const [csvWithHeader, setCsvWithHeader] = useState<boolean>(true);
	const onFile = useOnFile(fileType, { csvWithHeader });

	return (
		<div>
			{fileType === "CSV" && (
				<CsvOptions checked={csvWithHeader} setChecked={setCsvWithHeader} />
			)}
			<FileUploader
				handleChange={onFile}
				types={["txt", "json", "csv"]}
				dropMessageStyle={{ color: "transparent" }}
			>
				<div className="flex items-center justify-center border border-dashed hover:cursor-pointer hover:border-rose-400 w-full h-64 mt-2 text-zinc-500">
					<p>{t("drop file")}</p>
				</div>
			</FileUploader>
			<Spacer />
			<span className="mr-1">{t("file type")}</span>
			<ButtonGroup variant="outlined">
				<Button onClick={() => setFileType("JSON")}>JSON</Button>
				<Button onClick={() => setFileType("CSV")}>CSV</Button>
			</ButtonGroup>
			{fileType !== "JSON" && (
				<span className="ml-auto text-zinc-500">{t("convert to JSON")}</span>
			)}
		</div>
	);
}

interface CsvOptionsProps {
	checked: boolean;
	setChecked: (checked: boolean) => void;
}

function CsvOptions({ checked, setChecked }: CsvOptionsProps) {
	const t = useTranslations();

	return (
		<div className="flex items-center space-x-2">
			<Checkbox
				id="csv-options"
				defaultChecked={checked}
				checked={checked}
				onChange={(e) => setChecked(e.target.checked)}
			/>
			<label htmlFor="csv-options">{t("csv_with_header")}</label>
		</div>
	);
}

function useOnFile(fileType: FileType, options: { csvWithHeader?: boolean }) {
	const t = useTranslations();
	const main = useEditor("main");
	console.log("🐸 Pepe said >> useOnFile >> main:", main);

	return (file: File) => {
		if (!main) {
			return;
		}

		const reader = new FileReader();

		reader.onload = async (event) => {
			const fileContent = event.target?.result;

			if (typeof fileContent !== "string") {
				return;
			}

			let r: CsvResult = { text: fileContent };

			if (fileType !== "JSON") {
				if (fileType === "CSV") {
					r = await main
						.worker()
						.csv2json(fileContent, { withHeader: options.csvWithHeader });
				}
				// TODO: consider to support yaml
			}

			if (r.errorKey) {
				toastErr(t(r.errorKey as any));
				return;
			}

			const text = r.text ?? "";
			await main.parseAndSet(text);
		};

		reader.readAsText(file);
	};
}
