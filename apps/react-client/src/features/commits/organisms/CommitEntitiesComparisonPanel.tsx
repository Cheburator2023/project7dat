import { memo, useMemo, useCallback, useState, useRef } from "react";
import { Box, Chip, TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { AgGridReact, type CustomCellRendererProps } from "ag-grid-react";
import type {
	ColDef,
	GridApi,
	GridReadyEvent,
	RowClickedEvent,
	RowDoubleClickedEvent,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { usePaginatedEntities } from "@react-client/api/hooks";
import { PaginationToolbar } from "@react-client/common/grid/PaginationToolbar";
import { TypeChip } from "@react-client/features/entities/atoms";
import { HIGHLIGHT_COLORS } from "@react-client/features/entities/constants";
import { AgGridStateControls } from "@react-client/common/grid/AgGridStateControls";
import { useAgGridPersistence } from "@react-client/common/grid/hooks/useAgGridPersistence";
import {
	useCommitMergeStore,
	extractCommitEntities,
} from "../stores/commitMergeStore";
import { Spacer } from "@react-client/common/primitives/Spacer";

ModuleRegistry.registerModules([AllCommunityModule]);

interface CommitEntityRow {
	id: string;
	name: string;
	type: string;
	namespace?: string;
	system_code?: string;
	description?: string;
	attributeCount: number;
	isFromCommit: boolean;
	isModified: boolean;
}

export const CommitEntitiesComparisonPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const { commit, selectedEntityId, setSelectedEntityId } =
		useCommitMergeStore();

	const commitEntities = useMemo(() => extractCommitEntities(commit), [commit]);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: entitiesData, isLoading } = usePaginatedEntities({
		page,
		limit: pageSize,
		search: searchQuery,
	});

	const currentEntities = entitiesData?.entities ?? [];
	const totalCount = entitiesData?.total ?? 0;

	const commitEntityIds = useMemo(
		() => new Set(commitEntities.map((e) => e.id)),
		[commitEntities],
	);

	const mergedRows: CommitEntityRow[] = useMemo(() => {
		const commitRows: CommitEntityRow[] = commitEntities.map((e) => ({
			id: e.id,
			name: e.name ?? e.id,
			type: e.type ?? "unknown",
			namespace: e.namespace,
			system_code: e.system_code,
			description: e.description,
			attributeCount: e.attrSeq?.length ?? 0,
			isFromCommit: true,
			isModified: e.modified ?? false,
		}));

		const currentRows: CommitEntityRow[] = currentEntities
			.filter((e) => !commitEntityIds.has(e.id))
			.map((e) => ({
				id: e.id,
				name: e.name ?? e.id,
				type: e.type ?? "unknown",
				namespace: e.namespace,
				system_code: e.system_code,
				description: e.description,
				attributeCount: e.attrSeq?.length ?? 0,
				isFromCommit: false,
				isModified: false,
			}));

		return [...commitRows, ...currentRows];
	}, [commitEntities, currentEntities, commitEntityIds]);

	const columnDefs: ColDef<CommitEntityRow>[] = useMemo(
		() => [
			{
				field: "id",
				headerName: "ID",
				flex: 1,
				minWidth: 120,
				cellStyle: { fontFamily: "monospace", fontSize: 11 },
				cellRenderer: (params: CustomCellRendererProps<CommitEntityRow>) => {
					const isFromCommit = params.data?.isFromCommit;
					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							{params.value}
							{isFromCommit && (
								<Chip
									label="NEW"
									size="small"
									color="success"
									sx={{ height: 16, fontSize: 9 }}
								/>
							)}
						</Box>
					);
				},
			},
			{
				field: "name",
				headerName: "Имя",
				flex: 2,
				minWidth: 150,
			},
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: (params: CustomCellRendererProps<CommitEntityRow>) => (
					<TypeChip type={params.value} />
				),
			},
			{
				field: "namespace",
				headerName: "Namespace",
				flex: 1,
				minWidth: 120,
				cellRenderer: (params: CustomCellRendererProps<CommitEntityRow>) =>
					params.value || "—",
			},
			{
				field: "attributeCount",
				headerName: "Атрибуты",
				width: 90,
			},
			{
				headerName: "Статус",
				width: 110,
				cellRenderer: (params: CustomCellRendererProps<CommitEntityRow>) => {
					if (params.data?.isModified) {
						return <Chip label="Изменён" size="small" color="warning" />;
					}
					if (params.data?.isFromCommit) {
						return <Chip label="Из коммита" size="small" color="success" />;
					}
					return <Chip label="Текущий" size="small" variant="outlined" />;
				},
			},
		],
		[],
	);

	const getRowStyle = useCallback(
		(params: { data?: CommitEntityRow }) => {
			const style: Record<string, string | number> = {};
			if (params.data?.isFromCommit) {
				style.backgroundColor = "rgba(76, 175, 80, 0.08)";
				style.fontWeight = 500;
			} else if (params.data?.id === selectedEntityId) {
				style.backgroundColor = HIGHLIGHT_COLORS.selected;
			}
			return style;
		},
		[selectedEntityId],
	);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<CommitEntityRow>) => {
			if (event.data) {
				setSelectedEntityId(event.data.id);
			}
		},
		[setSelectedEntityId],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<CommitEntityRow>) => {
			if (event.data) {
				navigate(`/entity/${event.data.id}`);
			}
		},
		[navigate],
	);

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);

	const handlePageSizeChange = useCallback((size: number) => {
		setPageSize(size);
		setPage(1);
	}, []);

	const gridApiRef = useRef<GridApi | null>(null);
	const gridPersistence = useAgGridPersistence({
		gridId: "commit-entities-comparison",
		gridName: "Коммит: сравнение сущностей",
		apiRef: gridApiRef,
	});

	const handleGridReady = useCallback(
		(event: GridReadyEvent) => {
			gridPersistence.onGridReady(event as unknown as GridReadyEvent);
			gridApiRef.current = event.api;
		},
		[gridPersistence],
	);

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box sx={{ p: 1, pb: 0 }}>
				<TextField
					size="small"
					placeholder="Поиск..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
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
			</Box>
			<Spacer />
			<Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
				<AgGridStateControls onReset={gridPersistence.resetGridState} />
				<AgGridReact
					rowData={mergedRows}
					columnDefs={columnDefs}
					theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
					onGridReady={handleGridReady}
					onColumnMoved={gridPersistence.onColumnMoved}
					onColumnPinned={gridPersistence.onColumnPinned}
					onColumnResized={gridPersistence.onColumnResized}
					onColumnVisible={gridPersistence.onColumnVisible}
					onRowClicked={handleRowClicked}
					onRowDoubleClicked={handleRowDoubleClicked}
					getRowStyle={getRowStyle}
					rowSelection="single"
					suppressCellFocus
					animateRows
					rowHeight={28}
					headerHeight={32}
					loading={isLoading}
					overlayNoRowsTemplate="Нет сущностей"
					overlayLoadingTemplate="Загрузка"
					onSortChanged={gridPersistence.onSortChanged}
				/>
			</Box>
			<PaginationToolbar
				page={page}
				pageSize={pageSize}
				totalItems={totalCount + commitEntities.length}
				totalPages={Math.ceil((totalCount + commitEntities.length) / pageSize)}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
			/>
		</Box>
	);
});

CommitEntitiesComparisonPanel.displayName = "CommitEntitiesComparisonPanel";
