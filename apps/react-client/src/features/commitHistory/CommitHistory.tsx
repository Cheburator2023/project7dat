import React from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	Chip,
	CircularProgress,
} from "@mui/material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useCommitList } from "@react-client/hooks/api/useJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Card } from "@react-client/common/muiCustom/Card";

export const CommitHistory: React.FC = () => {
	const { currentGraphId } = useDataLineageStore();
	console.log(
		"🐸 Pepe said >> CommitHistory >> currentGraphId:",
		currentGraphId,
	);

	const {
		data: commitData,
		isLoading,
		error,
	} = useCommitList({
		graphId: currentGraphId || undefined,
		limit: 20,
	});

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" p={2}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={2}>
				<Typography color="error">
					Ошибка загрузки истории: {error.message}
				</Typography>
			</Box>
		);
	}

	if (!commitData?.data?.length) {
		return (
			<Box p={2}>
				<Typography color="text.secondary">История коммитов пуста</Typography>
			</Box>
		);
	}

	return (
		<List>
			{commitData.data.map((commit) => (
				<ListItem key={commit.id} sx={{ px: 0 }}>
					<Card sx={{ width: "100%", p: 2, height: "200px", overflow: "auto" }}>
						<Box display="flex" alignItems="center" gap={1} mb={1}>
							<Chip
								label={commit.hash.substring(0, 8)}
								size="small"
								variant="outlined"
							/>
							<Typography variant="caption" color="text.secondary">
								{new Date(commit.createdAt).toLocaleString("ru-RU")}
							</Typography>
						</Box>
						<Typography variant="body1" gutterBottom>
							{commit.message}
						</Typography>
						{commit.diff && (
							<Box sx={{ mt: 1 }}>
								<ReactDiffViewer
									oldValue={JSON.stringify(commit.diff.left, null, 2)}
									newValue={JSON.stringify(commit.diff.right, null, 2)}
									splitView={true}
									compareMethod={DiffMethod.WORDS}
									leftTitle="Original"
									rightTitle="After Changes"
									styles={{
										variables: {
											light: {
												diffViewerBackground: "#fafafa",
												diffViewerColor: "#212121",
												addedBackground: "#e8f5e8",
												addedColor: "#24292e",
												removedBackground: "#ffecec",
												removedColor: "#24292e",
												wordAddedBackground: "#acf2bd",
												wordRemovedBackground: "#fdb8c0",
												addedGutterBackground: "#cdffd8",
												removedGutterBackground: "#fdbdcc",
												gutterBackground: "#f7f7f7",
												gutterBackgroundDark: "#f3f1f1",
												highlightBackground: "#fffbdd",
												highlightGutterBackground: "#ffcd3c",
												codeFoldGutterBackground: "#dbedff",
												codeFoldBackground: "#f1f8ff",
												emptyLineBackground: "#fafbfc",
												gutterColor: "#212121",
												addedGutterColor: "#212121",
												removedGutterColor: "#212121",
												codeFoldContentColor: "#212121",
												diffViewerTitleBackground: "#fafbfc",
												diffViewerTitleColor: "#212121",
												diffViewerTitleBorderColor: "#eee",
											},
										},
									}}
								/>
							</Box>
						)}
					</Card>
				</ListItem>
			))}
		</List>
	);
};
