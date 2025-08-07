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
	IconButton,
	Stack,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Clear as ClearIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useCommitList, useCommitSearch } from "@react-client/api/hooks";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Card } from "@react-client/common/muiCustom/Card";
import { fastStringify } from "@data-lineage/shared";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useQueryClient } from "@tanstack/react-query";

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
	const { currentGraphId, hasUnsavedChanges } = useDataLineageStore();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [userFilter, setUserFilter] = useState("");
	const [dateFrom, setDateFrom] = useState<Date | null>(null);
	const [dateTo, setDateTo] = useState<Date | null>(null);
	const [prevHasUnsavedChanges, setPrevHasUnsavedChanges] =
		useState(hasUnsavedChanges);

	const hasActiveFilters = searchQuery || userFilter || dateFrom || dateTo;

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
		searchQuery.trim() || userFilter.trim() || dateFrom || dateTo,
	);

	const searchParams = useMemo(
		() => ({
			query: searchQuery.trim() || undefined,
			user: userFilter.trim() || undefined,
			dateFrom: dateFrom?.toISOString(),
			dateTo: dateTo?.toISOString(),
			enabled: Boolean(hasActiveFilters && currentGraphId),
		}),
		[
			searchQuery,
			userFilter,
			dateFrom,
			dateTo,
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
		setDateFrom(null);
		setDateTo(null);
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
			<SearchContainer>
				<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
					<Box sx={{ minWidth: 200, flex: 1 }}>
						<TextField
							placeholder="Поиск коммитов"
							value={searchQuery}
							onChange={(e) => {
								console.log("🐸 Pepe said >> e:", e);

								return setSearchQuery(e.target.value);
							}}
							variant="outlined"
							size="small"
							fullWidth
						/>
					</Box>
					<Box sx={{ minWidth: 150, flex: 1 }}>
						<TextField
							placeholder="Пользователь"
							value={userFilter}
							onChange={(e) => setUserFilter(e.target.value)}
							variant="outlined"
							size="small"
							fullWidth
						/>
					</Box>
					<Box sx={{ minWidth: 150 }}>
						<DatePicker
							label="Дата от"
							value={dateFrom}
							onChange={(newValue) => setDateFrom(newValue)}
							slotProps={{
								textField: {
									fullWidth: true,
									size: "small",
								},
							}}
						/>
					</Box>
					<Box sx={{ minWidth: 150 }}>
						<DatePicker
							label="Дата до"
							value={dateTo}
							onChange={(newValue) => setDateTo(newValue)}
							slotProps={{
								textField: {
									fullWidth: true,
									size: "small",
								},
							}}
						/>
					</Box>
					{hasActiveFilters && (
						<Box>
							<IconButton
								size="small"
								onClick={handleClearSearch}
								title="Очистить фильтры"
								color="primary"
							>
								<ClearIcon />
							</IconButton>
						</Box>
					)}
				</Stack>
			</SearchContainer>

			<Spacer space={16} />

			<List sx={{ p: 0 }}>
				{data?.data?.length ? (
					data.data.map((commit) => (
						<CommitItem key={commit.id} commit={commit} />
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
		</Wrapper>
	);
});

const SearchContainer = styled(Box)({
	marginBottom: "16px",
});
const Wrapper = styled("div")({
	padding: "10px",
});
