import { Button, ButtonGroup } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import type { EditorWrapper } from "@react-client/features/json4u/lib/editor/editor";
import {
	downloadFile,
	toastErr,
} from "@react-client/features/json4u/lib/utils";
import type { CsvResult } from "@react-client/features/json4u/lib/worker/command/csv";
import { useEditor } from "@react-client/features/json4u/stores/editorStore";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useState } from "react";

type FileType = "JSON" | "CSV";

export function ExportPopover() {
	const t = useTranslations();
	const [fileType, setFileType] = useState<FileType>("JSON");
	const { onClickPreview, onClickDownload } = useOnClickButton(fileType);

	return (
		<div>
			<Flex alignItems="center">
				<span>{t("export to")}</span>
				<Spacer />
				<ButtonGroup variant="outlined">
					<Button onClick={() => setFileType("JSON")}>JSON</Button>
					<Button onClick={() => setFileType("CSV")}>CSV</Button>
				</ButtonGroup>
			</Flex>

			<Spacer />

			<Flex gap={10}>
				{fileType !== "JSON" && (
					<Button variant="outlined" onClick={onClickPreview}>
						{t("preview")}
					</Button>
				)}
				<Button variant="outlined" onClick={onClickDownload}>
					{t("download")}
				</Button>
			</Flex>
		</div>
	);
}

function useOnClickButton(fileType: FileType) {
	const t = useTranslations();
	const main = useEditor("main");
	const setViewMode = useStatusStore((state) => state.setViewMode);

	const onClickPreview = async () => {
		if (!main) {
			return;
		}

		convert(t, main, fileType, (_text) => {
			setViewMode("text");
		});
	};

	const onClickDownload = () => {
		if (!main) {
			return;
		}

		convert(t, main, fileType, (text) => {
			const blob = new Blob([text], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			downloadFile(fileType, url);
			URL.revokeObjectURL(url);
		});
	};

	return { onClickPreview, onClickDownload };
}

async function convert(
	t: ReturnType<typeof useTranslations>,
	main: EditorWrapper,
	fileType: FileType,
	onSucc: (text: string) => void,
) {
	let r: CsvResult = {
		text: main.text(),
	};

	if (fileType === "CSV") {
		const treeObject = main.tree.toObject();
		r = await main.worker().json2csv(treeObject);
	}

	if (r.errorKey) {
		toastErr(t(r.errorKey as any));
	} else {
		onSucc(r.text!);
	}
}
