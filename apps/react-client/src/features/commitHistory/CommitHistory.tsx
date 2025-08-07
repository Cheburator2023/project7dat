import React, { memo, useMemo } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	Chip,
	CircularProgress,
	useColorScheme,
	styled,
	TextField,
} from "@mui/material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useCommitList } from "@react-client/api/hooks";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Card } from "@react-client/common/muiCustom/Card";
import { fastStringify } from "@data-lineage/shared";
import { Spacer } from "@react-client/common/primitives/Spacer";

const CommitItem = memo(({ commit }: { commit: any }) => {
	const theme = useColorScheme();
	const oldValue = useMemo(
		() => (commit.diff ? fastStringify(commit.diff.left, { space: 2 }) : ""),
		[commit.diff],
	);

	const newValue = useMemo(
		() => (commit.diff ? fastStringify(commit.diff.right, { space: 2 }) : ""),
		[commit.diff],
	);

	return (
		<ListItem key={commit.id} sx={{ px: 0, p: 0 }}>
			<Card
				sx={{ width: "100%", p: 2 }}
				zoom={0.7}
				uuid={"card_commit_hist_" + commit.id}
			>
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

				{commit.diff &&
					commit.diff.left &&
					Object.keys(commit.diff.left).length > 0 && (
						<Box sx={{ mt: 1, height: "200px", overflow: "auto" }}>
							<ReactDiffViewer
								oldValue={oldValue}
								newValue={newValue}
								splitView={true}
								compareMethod={DiffMethod.WORDS}
								leftTitle="Старая версия"
								rightTitle="Новая версия"
								useDarkTheme={theme.mode === "dark"}
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
				{commit.diff &&
					(!commit.diff.left || Object.keys(commit.diff.left).length === 0) && (
						<Card>
							<Typography variant="body2" fontStyle="italic">
								Начальный коммит - нет предыдущей версии для сравнения
							</Typography>
						</Card>
					)}
			</Card>
		</ListItem>
	);
});

export const CommitHistory: React.FC = memo(() => {
	const { currentGraphId } = useDataLineageStore();

	const {
		data: commitData,
		isLoading,
		error,
	} = useCommitList({
		graphId: currentGraphId || undefined,
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
		<Wrapper>
			<SearchField
				placeholder="Поиск в истории..."
				// value={searchQuery}
				// onChange={handleSearchChange}
				variant="outlined"
				size="small"
			/>

			<Spacer space={8} />

			<List sx={{ p: 0 }}>
				{commitData.data.map((commit) => (
					<CommitItem key={commit.id} commit={commit} />
				))}
			</List>
		</Wrapper>
	);
});

const SearchField = styled(TextField)({});
const Wrapper = styled("div")({
	padding: "10px",
});
