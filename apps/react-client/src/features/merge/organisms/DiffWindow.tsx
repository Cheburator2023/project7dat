import React, { useMemo } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
	useColorScheme,
	Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useMergeStore } from "../../../stores/mergeStore";
import { fastStringify } from "@react-client/shared/src";

export const DiffWindow: React.FC = () => {
	const { isDiffWindowOpen, closeDiffWindow, mergeData } = useMergeStore();

	const { mode } = useColorScheme();

	const { oldValue, newValue } = useMemo(() => {
		if (!mergeData?.diffJson) {
			return {
				oldValue: "",
				newValue: "",
			};
		}

		const left = mergeData.diffJson.left ?? {};
		const right = mergeData.diffJson.right ?? {};

		return {
			oldValue: fastStringify(left, { space: 2 }),
			newValue: fastStringify(right, { space: 2 }),
		};
	}, [mergeData]);

	const handleClose = () => {
		closeDiffWindow();
	};

	if (!mergeData) {
		return null;
	}

	return (
		<Dialog
			open={isDiffWindowOpen}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					height: "80vh",
					maxHeight: "80vh",
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pb: 1,
				}}
			>
				<Typography variant="h6">Diff - Изменения</Typography>
				<IconButton
					onClick={handleClose}
					size="small"
					sx={{ color: "grey.500" }}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ p: 0 }}>
				<Stack height="100%" width="100%" overflow="auto">
					<Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
						<Typography variant="body2" color="text.secondary">
							Демонстрация react-diff-viewer-continued - сравнение JSON объектов
						</Typography>
					</Box>
					<Box sx={{ flex: 1, overflow: "hidden" }}>
						<ReactDiffViewer
							oldValue={oldValue}
							newValue={newValue}
							splitView={true}
							compareMethod={DiffMethod.CHARS}
							useDarkTheme={mode === "dark"}
							showDiffOnly={false}
							leftTitle="Оригинальная версия"
							rightTitle="Измененная версия"
							styles={{
								variables: {
									light: {
										diffViewerBackground: "#fff",
										addedBackground: "#e6ffed",
										addedColor: "#24292e",
										removedBackground: "#ffeef0",
										removedColor: "#24292e",
										wordAddedBackground: "#acf2bd",
										wordRemovedBackground: "#fdb8c0",
										addedGutterBackground: "#cdffd8",
										removedGutterBackground: "#fdbdbe",
										gutterBackground: "#f7f7f7",
										gutterBackgroundDark: "#f3f1f1",
										highlightBackground: "#fffbdd",
										highlightGutterBackground: "#fff5b4",
									},
									dark: {
										diffViewerBackground: "#2e3440",
										addedBackground: "#144620",
										addedColor: "#e6ffed",
										removedBackground: "#461a20",
										removedColor: "#ffeef0",
										wordAddedBackground: "#176f2c",
										wordRemovedBackground: "#b93a46",
										addedGutterBackground: "#034509",
										removedGutterBackground: "#632b30",
										gutterBackground: "#2c2f3a",
										gutterBackgroundDark: "#262933",
										highlightBackground: "#2a2e39",
										highlightGutterBackground: "#2d323e",
									},
								},
							}}
						/>
					</Box>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={handleClose} variant="outlined">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
