import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	styled,
	TextField,
	Button,
	InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import {
	useCommitList,
	useCommitSearch,
	useSnapshotList,
} from "@react-client/api/hooks";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useQueryClient } from "@tanstack/react-query";
import {
	DateRangePicker,
	type DateRange,
} from "@react-client/common/muiCustom/DateRangePicker";
import { CommitDetailsDialog } from "./CommitDetailsDialog";
import { CommitList } from "../commits/components/CommitList";

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
	} = useCommitSearch(currentGraphId || "", {
		...searchParams,
		enabled: Boolean(searchParams.enabled),
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

			<CommitList
				commits={data?.data || []}
				isLoading={isLoadingList || isLoadingSearch}
				emptyMessage={
					hasNonEmptyFilters ? "Коммиты не найдены" : "История коммитов пуста"
				}
				onCommitClick={handleCommitClick}
				showDiff={true}
			/>

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
