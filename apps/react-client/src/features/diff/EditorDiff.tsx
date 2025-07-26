import { Typography, useColorScheme, Stack } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

export const EditorDiff = () => {
	const { currentGraph, originalGraph, hasUnsavedChanges } =
		useDataLineageStore();

	const { mode } = useColorScheme();

	return (
		<Stack height="100%" width="100%" overflow={"auto"}>
			{hasUnsavedChanges && currentGraph && originalGraph ? (
				<ReactDiffViewer
					oldValue={JSON.stringify(originalGraph, null, 2)}
					newValue={JSON.stringify(currentGraph, null, 2)}
					splitView={true}
					compareMethod={DiffMethod.CHARS}
					useDarkTheme={mode === "dark"}
					showDiffOnly
					leftTitle="Исходная версия"
					rightTitle="Текущая версия"
				/>
			) : (
				<Flex
					width="100%"
					height="100%"
					alignItems="center"
					justifyContent="center"
				>
					<Typography>
						{hasUnsavedChanges
							? "Загрузка изменений..."
							: "Нет несохранённых изменений"}
					</Typography>
				</Flex>
			)}
		</Stack>
	);
};
