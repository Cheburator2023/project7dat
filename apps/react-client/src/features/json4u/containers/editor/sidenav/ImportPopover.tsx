import { toastErr } from "@react-client/features/json4u/lib/utils";
import type { CsvResult } from "@react-client/features/json4u/lib/worker/command/csv";
import { useEditor } from "@react-client/features/json4u/stores/editorStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

import { Button, ButtonGroup, Checkbox, Box, styled } from "@mui/material";
import { Spacer } from "@react-client/common/primitives/Spacer";

type FileType = "JSON" | "CSV";

const DropZone = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	border: "1px dashed",
	borderColor: theme.palette.divider,
	width: "100%",
	height: "256px",
	marginTop: theme.spacing(1),
	color: theme.palette.text.secondary,
	cursor: "pointer",
	"&:hover": {
		borderColor: theme.palette.error.main,
	},
}));

const FileTypeContainer = styled(Box)({
	marginRight: "8px",
});

const ConvertText = styled("span")(({ theme }) => ({
	marginLeft: "auto",
	color: theme.palette.text.secondary,
}));

const CsvOptionsContainer = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "16px",
});

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
				<DropZone>
					<p>{t("drop file")}</p>
				</DropZone>
			</FileUploader>
			<Spacer />
			<FileTypeContainer>{t("file type")}</FileTypeContainer>
			<ButtonGroup variant="outlined">
				<Button onClick={() => setFileType("JSON")}>JSON</Button>
				<Button onClick={() => setFileType("CSV")}>CSV</Button>
			</ButtonGroup>
			{fileType !== "JSON" && <ConvertText>{t("convert to JSON")}</ConvertText>}
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
		<CsvOptionsContainer>
			<Checkbox
				id="csv-options"
				defaultChecked={checked}
				checked={checked}
				onChange={(e) => setChecked(e.target.checked)}
			/>
			<label htmlFor="csv-options">{t("csv_with_header")}</label>
		</CsvOptionsContainer>
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
