import { Typography, useColorScheme, Stack, Box } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { memo, useMemo } from "react";
import { fastStringify } from "@react-client/shared/src";

export const EditorDiff = memo(() => {
	const { currentGraph, originalGraph, hasUnsavedChanges } =
		useDataLineageStore();

	const { mode } = useColorScheme();

	const oldValue = useMemo(
		() => (originalGraph ? fastStringify(originalGraph, { space: 2 }) : ""),
		[originalGraph],
	);

	const newValue = useMemo(
		() => (currentGraph ? fastStringify(currentGraph, { space: 2 }) : ""),
		[currentGraph],
	);

	return (
		<Stack height="100%" width="100%" overflow={"auto"}>
			{hasUnsavedChanges && currentGraph && originalGraph ? (
				originalGraph && Object.keys(originalGraph).length > 0 ? (
					<ReactDiffViewer
						oldValue={oldValue}
						newValue={newValue}
						splitView={true}
						compareMethod={DiffMethod.CHARS}
						useDarkTheme={mode === "dark"}
						showDiffOnly
						leftTitle="Исходная версия"
						rightTitle="Текущая версия"
					/>
				) : (
					<Box
						display="flex"
						alignItems="center"
						justifyContent="center"
						height="100%"
						width="100%"
					>
						<Typography color="text.secondary">
							Начальная версия - нет предыдущей версии для сравнения
						</Typography>
					</Box>
				)
			) : (
				<Flex
					width="100%"
					height="100%"
					alignItems="center"
					justifyContent="center"
				>
					<Typography>
						{hasUnsavedChanges ? "Загрузка изменений..." : "Нет изменений"}
					</Typography>
				</Flex>
			)}
		</Stack>
	);
});
