import React from "react";
import {
	Box,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	useColorScheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useCumulativeCommitData } from "@react-client/api/hooks";
import { fastStringify } from "@data-lineage/shared";

interface CommitDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	selectedCommitId: string | null;
	currentGraph: any;
}

export const CommitDetailsDialog: React.FC<CommitDetailsDialogProps> = ({
	open,
	onClose,
	selectedCommitId,
	currentGraph,
}) => {
	const { mode } = useColorScheme();

	const {
		data: cumulativeData,
		isLoading: isLoadingCumulative,
		error: cumulativeError,
	} = useCumulativeCommitData(selectedCommitId || "", {
		enabled: Boolean(selectedCommitId),
	});

	const oldValue = currentGraph
		? fastStringify(currentGraph, { space: 2 })
		: "";

	const newValue = cumulativeData?.fullData
		? fastStringify(cumulativeData.fullData, { space: 2 })
		: "";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: { height: "90vh" },
			}}
		>
			<DialogTitle>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">
						Полные данные на коммите {cumulativeData?.targetCommit?.short_id}
					</Typography>
					<IconButton onClick={onClose}>
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				{isLoadingCumulative && <Typography>Загрузка...</Typography>}
				{cumulativeError && (
					<Typography color="error">
						Ошибка загрузки данных: {cumulativeError.message}
					</Typography>
				)}
				{cumulativeData && (
					<Box>
						<Box sx={{ mb: 3, maxHeight: "300px", overflow: "auto" }}>
							<ReactDiffViewer
								oldValue={oldValue}
								newValue={newValue}
								splitView={true}
								compareMethod={DiffMethod.CHARS}
								useDarkTheme={mode === "dark"}
								showDiffOnly
								leftTitle="Версия последнего снепшота"
								rightTitle="Выбранный коммит"
							/>
						</Box>

						<Typography variant="h6" gutterBottom>
							История изменений ({cumulativeData.commits.length} коммитов):
						</Typography>
						<Box sx={{ maxHeight: "400px", overflow: "auto" }}>
							{cumulativeData.commits.map((commit, _index) => (
								<Box
									key={commit.id}
									sx={{ mb: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
								>
									<Box
										sx={{
											p: 1,
											backgroundColor: "#f9f9f9",
											borderBottom: "1px solid #e0e0e0",
										}}
									>
										<Typography variant="subtitle2">
											{commit.short_id} - {commit.message}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{new Date(commit.createdAt).toLocaleString()}
										</Typography>
									</Box>
									{commit.diff && (
										<Box sx={{ fontSize: "12px" }}>
											<ReactDiffViewer
												oldValue={fastStringify(commit.diff.left, {
													space: 2,
												})}
												newValue={fastStringify(commit.diff.right, {
													space: 2,
												})}
												splitView={true}
												compareMethod={DiffMethod.WORDS}
												hideLineNumbers={false}
												showDiffOnly={false}
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
															gutterBackgroundDark: "#f7f7f7",
															highlightBackground: "#fffbdd",
															highlightGutterBackground: "#fff5b4",
														},
													},
												}}
											/>
										</Box>
									)}
								</Box>
							))}
						</Box>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
};
