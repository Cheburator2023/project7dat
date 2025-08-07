import React, { memo, useMemo, useState, useCallback, useEffect } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	Chip,
	useColorScheme,
	styled,
	TextField,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import {
	useCommitList,
	useCommitSearch,
	useCumulativeCommitData,
} from "@react-client/api/hooks";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Card } from "@react-client/common/muiCustom/Card";
import { fastStringify } from "@data-lineage/shared";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useQueryClient } from "@tanstack/react-query";
import {
	DateRangePicker,
	type DateRange,
} from "@react-client/common/muiCustom/DateRangePicker";
import { Flex } from "@react-client/common/primitives/Flex";

const CommitItem = memo(
	({
		commit,
		onCommitClick,
	}: {
		commit: any;
		onCommitClick: (commitId: string) => void;
	}) => {
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
					sx={{
						width: "100%",
						p: 2,
						cursor: "pointer",
						"&:hover": {
							backgroundColor: "action.hover",
						},
					}}
					zoom={0.7}
					uuid={"card_commit_hist_" + commit.id}
					onClick={() => onCommitClick(commit.id)}
				>
					<Box display="flex" alignItems="center" gap={1} mb={1}>
						<Chip label={commit.short_id} size="small" variant="outlined" />
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
						(!commit.diff.left ||
							Object.keys(commit.diff.left).length === 0) && (
							<Card>
								<Typography variant="body2" fontStyle="italic">
									Начальный коммит - нет предыдущей версии для сравнения
								</Typography>
							</Card>
						)}
				</Card>
			</ListItem>
		);
	},
);

export const CommitHistory: React.FC = memo(() => {
	const { currentGraphId, hasUnsavedChanges } = useDataLineageStore();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [userFilter, setUserFilter] = useState("");
	const [dateRange, setDateRange] = useState<DateRange>({
		from: null,
		to: null,
	});
	const [prevHasUnsavedChanges, setPrevHasUnsavedChanges] =
		useState(hasUnsavedChanges);
	const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const hasActiveFilters =
		searchQuery || userFilter || dateRange.from || dateRange.to;

	useEffect(() => {
		if (prevHasUnsavedChanges && !hasUnsavedChanges && currentGraphId) {
			queryClient.invalidateQueries({
				queryKey: ["jsonData", "commitList"],
			});
			queryClient.invalidateQueries({
				queryKey: ["jsonData", "commitSearch"],
			});
		}
		setPrevHasUnsavedChanges(hasUnsavedChanges);
	}, [hasUnsavedChanges, prevHasUnsavedChanges, currentGraphId, queryClient]);

	const hasNonEmptyFilters = Boolean(
		searchQuery.trim() || userFilter.trim() || dateRange.from || dateRange.to,
	);

	const searchParams = useMemo(
		() => ({
			query: searchQuery.trim() || undefined,
			user: userFilter.trim() || undefined,
			dateFrom: dateRange.from?.toISOString(),
			dateTo: dateRange.to?.toISOString(),
			enabled: Boolean(hasActiveFilters && currentGraphId),
		}),
		[
			searchQuery,
			userFilter,
			dateRange.from,
			dateRange.to,
			hasActiveFilters,
			currentGraphId,
		],
	);

	const {
		data: commitData,
		isLoading: isLoadingList,
		error: listError,
	} = useCommitList({
		graphId: currentGraphId || undefined,
		enabled: Boolean(currentGraphId),
	});

	const {
		data: searchData,
		isLoading: isLoadingSearch,
		error: searchError,
	} = useCommitSearch(currentGraphId || "", searchParams);

	const {
		data: cumulativeData,
		isLoading: isLoadingCumulative,
		error: cumulativeError,
	} = useCumulativeCommitData(selectedCommitId || "", {
		enabled: Boolean(selectedCommitId),
	});

	const handleClearSearch = useCallback(() => {
		setSearchQuery("");
		setUserFilter("");
		setDateRange({ from: null, to: null });
	}, []);

	const handleCommitClick = useCallback((commitId: string) => {
		setSelectedCommitId(commitId);
		setIsDialogOpen(true);
	}, []);

	const handleCloseDialog = useCallback(() => {
		setIsDialogOpen(false);
		setSelectedCommitId(null);
	}, []);

	const error = hasNonEmptyFilters ? searchError : listError;
	const data = hasNonEmptyFilters ? searchData : commitData;

	if (error) {
		return (
			<Box p={2}>
				<Typography color="error">
					Ошибка загрузки истории: {error.message}
				</Typography>
			</Box>
		);
	}

	return (
		<Wrapper>
			<Flex gap={4} wrap="wrap">
				<TextField
					placeholder="Включает текст"
					value={searchQuery}
					onChange={(e) => {
						console.log("🐸 Pepe said >> e:", e);

						return setSearchQuery(e.target.value);
					}}
					variant="outlined"
					size="small"
					fullWidth
				/>

				<TextField
					placeholder="Пользователь"
					value={userFilter}
					onChange={(e) => setUserFilter(e.target.value)}
					variant="outlined"
					size="small"
					fullWidth
				/>

				<DateRangePicker
					value={dateRange}
					onChange={setDateRange}
					placeholder="Выберите период дата/время"
					size="small"
					fullWidth
				/>

				{hasActiveFilters && (
					<Button size="small" onClick={handleClearSearch} variant="contained">
						Очистить фильтры
					</Button>
				)}
			</Flex>

			<Spacer space={16} />

			<List sx={{ p: 0 }}>
				{data?.data?.length ? (
					data.data.map((commit) => (
						<CommitItem
							key={commit.id}
							commit={commit}
							onCommitClick={handleCommitClick}
						/>
					))
				) : (
					<Box p={2}>
						<Typography color="text.secondary">
							{hasNonEmptyFilters
								? "Коммиты не найдены"
								: "История коммитов пуста"}
						</Typography>
					</Box>
				)}
			</List>

			<Dialog
				open={isDialogOpen}
				onClose={handleCloseDialog}
				maxWidth="lg"
				fullWidth
				PaperProps={{
					sx: { height: "90vh" },
				}}
			>
				<DialogTitle>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography variant="h6">
							Полные данные на коммите {cumulativeData?.targetCommit?.short_id}
						</Typography>
						<IconButton onClick={handleCloseDialog}>
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
							<Typography variant="h6" gutterBottom>
								Полные данные:
							</Typography>
							<Box sx={{ mb: 3, maxHeight: "300px", overflow: "auto" }}>
								<pre
									style={{
										backgroundColor: "#f5f5f5",
										padding: "16px",
										borderRadius: "4px",
										fontSize: "12px",
										lineHeight: "1.4",
									}}
								>
									{fastStringify(cumulativeData.fullData, { space: 2 })}
								</pre>
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
					<Button onClick={handleCloseDialog}>Закрыть</Button>
				</DialogActions>
			</Dialog>
		</Wrapper>
	);
});

const Wrapper = styled("div")({
	padding: "10px",
});
