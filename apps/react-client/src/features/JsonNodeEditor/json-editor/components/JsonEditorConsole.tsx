import { useDisclosure } from "@nextui-org/modal";
import { semanticColors } from "@nextui-org/react";
import { useMemo } from "react";

import { Button, Tooltip } from "@mui/material";
import { Flex } from "../../../../common/primitives/Flex";
import { useJsonEngineStore } from "../../store/json-engine/json-engine.store";
import { downloadAsFile } from "../../utils/file-download.util";
import { useCustomTheme } from "../../utils/react-hooks/useCustomTheme";
import { ImportJsonModal } from "./ImportJsonModal";

export const JsonEditorConsole = () => {
	const [stringifiedJson, isValidJson] = useJsonEngineStore((state) => [
		state.stringifiedJson,
		state.isValidJson,
	]);

	const {
		isOpen: isImportJsonModalOpen,
		onOpen: openImportJsonModal,
		onClose: closeImportJsonModal,
	} = useDisclosure();
	const { theme } = useCustomTheme();

	const handleDownloadJsonClick = () => {
		downloadAsFile(
			`data:text/json;charset=utf8,${encodeURIComponent(stringifiedJson)}`,
			"json-sea.json",
		);
	};

	const iconColor = useMemo(
		() => (semanticColors[theme].primary as any).DEFAULT,
		[theme],
	);

	return (
		<>
			<ImportJsonModal
				isModalOpen={isImportJsonModalOpen}
				closeModal={closeImportJsonModal}
			/>
			<Flex
				position="absolute"
				right={0}
				bottom={0}
				width={"100%"}
				gap={0}
				padding="20px"
			>
				<Flex width="100%" gap={0} justifyContent="space-between">
					<Tooltip title="Импортировать JSON">
						<Button onClick={openImportJsonModal} variant="outlined">
							Импортировать JSON
						</Button>
					</Tooltip>

					<Tooltip title="Скачать JSON">
						<Button
							disabled={!isValidJson}
							onClick={handleDownloadJsonClick}
							variant="outlined"
						>
							Скачать JSON
						</Button>
					</Tooltip>
				</Flex>
			</Flex>
		</>
	);
};
