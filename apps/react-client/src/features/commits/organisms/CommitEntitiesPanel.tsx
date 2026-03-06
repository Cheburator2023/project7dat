import { memo, useMemo, useCallback, useRef } from "react";
import { Box, Chip, TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	GridApi,
	GridReadyEvent,
	RowClickedEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import {
	useCommitMergeStore,
	extractCommitEntities,
	type CommitEntity,
} from "../stores/commitMergeStore";
import { AgGridStateControls } from "@react-client/common/grid/AgGridStateControls";
import { useAgGridPersistence } from "@react-client/common/grid/hooks/useAgGridPersistence";

export const CommitEntitiesPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";

	const { commit, entitySearch, setEntitySearch, setSelectedEntityId } =
		useCommitMergeStore();

	const entities = useMemo(() => extractCommitEntities(commit), [commit]);

	const filteredEntities = useMemo(() => {
		if (!entitySearch.trim()) return entities;
		const q = entitySearch.toLowerCase();
		return entities.filter(
			(e) =>
				e.id?.toLowerCase().includes(q) ||
				e.name?.toLowerCase().includes(q) ||
				e.namespace?.toLowerCase().includes(q),
		);
	}, [entities, entitySearch]);

	const columnDefs: ColDef<CommitEntity>[] = useMemo(
		() => [
			{
				field: "id",
				headerName: "ID",
				flex: 1,
				minWidth: 120,
				cellStyle: { fontFamily: "monospace", fontSize: 11 },
			},
			{
				field: "name",
				headerName: "Имя",
				flex: 2,
				minWidth: 150,
				cellRenderer: ({ value }: { value?: string | null }) => value || "—",
			},
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value?: string }) =>
					value ? <Chip label={value} size="small" variant="outlined" /> : "—",
			},
			{
				field: "namespace",
				headerName: "Namespace",
				flex: 1,
				minWidth: 120,
				cellRenderer: ({ value }: { value?: string }) => value || "—",
			},
			{
				headerName: "Атрибуты",
				width: 90,
				valueGetter: (params: { data?: CommitEntity }) =>
					params.data?.attrSeq?.length ?? 0,
			},
			{
				field: "modified",
				headerName: "Статус",
				width: 110,
				cellRenderer: ({ value }: { value?: boolean }) =>
					value ? (
						<Chip label="Изменён" size="small" color="warning" />
					) : (
						<Chip
							label="Источник"
							size="small"
							color="default"
							variant="outlined"
						/>
					),
			},
		],
		[],
	);

	const getRowStyle = useCallback((params: { data?: CommitEntity }) => {
		if (params.data?.modified) {
			return { backgroundColor: "rgba(255, 152, 0, 0.08)" };
		}
		return undefined;
	}, []);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<CommitEntity>) => {
			if (event.data) {
				setSelectedEntityId(event.data.id);
			}
		},
		[setSelectedEntityId],
	);

	const gridApiRef = useRef<GridApi | null>(null);
	const gridPersistence = useAgGridPersistence({
		gridId: "commit-entities",
		gridName: "Коммит: сущности",
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
					placeholder="Поиск по ID, имени, namespace..."
					value={entitySearch}
					onChange={(e) => setEntitySearch(e.target.value)}
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
			<Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
				<AgGridStateControls onReset={gridPersistence.resetGridState} />
				<AgGridReact
					rowData={filteredEntities}
					columnDefs={columnDefs}
					theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
					onGridReady={handleGridReady}
					onColumnMoved={gridPersistence.onColumnMoved}
					onColumnPinned={gridPersistence.onColumnPinned}
					onColumnResized={gridPersistence.onColumnResized}
					onColumnVisible={gridPersistence.onColumnVisible}
					onRowClicked={handleRowClicked}
					getRowStyle={getRowStyle}
					rowSelection="single"
					suppressCellFocus
					animateRows
					rowHeight={28}
					headerHeight={32}
					overlayNoRowsTemplate="Нет сущностей в коммите"
					onSortChanged={gridPersistence.onSortChanged}
				/>
			</Box>
		</Box>
	);
});

CommitEntitiesPanel.displayName = "CommitEntitiesPanel";
