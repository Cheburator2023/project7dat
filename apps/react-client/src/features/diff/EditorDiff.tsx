import { Typography, useColorScheme } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { useEditor } from "@react-client/features/json4u/stores/editorStore";
import { useTreeVersion } from "@react-client/features/json4u/stores/treeStore";
import { useEffect, useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

export const EditorDiff = () => {
	const main = useEditor("main");
	const treeVersion = useTreeVersion();
	const { mode } = useColorScheme();
	const [newDataSet, setNewData] = useState<string>();
	const [originalData, setOriginalData] = useState<string>();

	const oldText = originalData || "";

	useEffect(() => {
		if (main?.tree.text && originalData) {
			setNewData(main?.tree.text);
		}
	}, [main?.tree.text]);

	useEffect(() => {
		if (main?.tree.text && !originalData) {
			setOriginalData(main?.tree.text);
		}
	}, [main?.tree.text, originalData]);

	return (
		<div>
			{newDataSet ? (
				<ReactDiffViewer
					oldValue={oldText}
					newValue={newDataSet}
					splitView={true}
					compareMethod={DiffMethod.CHARS}
					useDarkTheme={mode === "dark"}
					showDiffOnly
					leftTitle="old"
					rightTitle="new"
				/>
			) : (
				<Flex
					width="100%"
					height="100%"
					alignItems="center"
					justifyContent="center"
				>
					<Typography>Введите изменения</Typography>
				</Flex>
			)}
		</div>
	);
};
