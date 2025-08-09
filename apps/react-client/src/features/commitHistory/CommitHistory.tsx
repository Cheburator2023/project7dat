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
	InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import {
	useCommitList,
	useCommitSearch,
	useSnapshotList,
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
import { CommitDetailsDialog } from "./CommitDetailsDialog";

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
	const { currentGraphId, hasUnsavedChanges, currentGraph } =
		useDataLineageStore();
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

	const { data: snapshotsData } = useSnapshotList({
		page: 1,
		limit: 10,
	});

	const latestSnapshot = snapshotsData?.data[0]?.data;

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
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "1fr 1fr",
						md: "1fr 1fr 1fr",
					},
					gap: 1,
					mb: hasActiveFilters ? 2 : 0,
				}}
			>
				<TextField
					placeholder="Включает текст"
					value={searchQuery}
					onChange={(e) => {
						return setSearchQuery(e.target.value);
					}}
					variant="outlined"
					size="small"
					fullWidth
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						},
					}}
				/>

				<TextField
					placeholder="Пользователь"
					value={userFilter}
					onChange={(e) => setUserFilter(e.target.value)}
					variant="outlined"
					size="small"
					fullWidth
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<PersonIcon fontSize="small" />
								</InputAdornment>
							),
						},
					}}
				/>

				<Box
					sx={{
						gridColumn: {
							xs: "1",
							sm: "1 / -1",
							md: "3",
						},
					}}
				>
					<DateRangePicker
						value={dateRange}
						onChange={setDateRange}
						placeholder="Выберите период дата/время"
						size="small"
						fullWidth
					/>
				</Box>
			</Box>

			{hasActiveFilters && (
				<Box sx={{ mb: 2 }}>
					<Button size="small" onClick={handleClearSearch} variant="contained">
						Очистить фильтры
					</Button>
				</Box>
			)}

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

			<CommitDetailsDialog
				open={isDialogOpen}
				onClose={handleCloseDialog}
				selectedCommitId={selectedCommitId}
				currentGraph={latestSnapshot}
			/>
		</Wrapper>
	);
});

const Wrapper = styled("div")({
	padding: "10px",
});
