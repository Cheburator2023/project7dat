/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: forEach with early returns */
import { memo, useCallback, useMemo, useState, useRef } from "react";
import { Box } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns/esm";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	RowClickedEvent,
	RowDoubleClickedEvent,
	CellContextMenuEvent,
	GridReadyEvent,
	GridApi,
	SortChangedEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { usePaginatedEntities } from "@react-client/api/hooks";
import { PaginationToolbar } from "@react-client/common/grid/PaginationToolbar";
import { buildEntitiesSearch } from "@react-client/api/hooks/buildEntitiesSearch";

import { useEntitiesStore } from "../stores";
import { TypeChip } from "../atoms";
import { HIGHLIGHT_COLORS } from "../constants";
import { EntityContextMenu, type EntityContextMenuState } from "../molecules";
import type { EntityRow } from "../types";

ModuleRegistry.registerModules([AllCommunityModule]);

export const EntitiesPanel = memo(
	({
		allowedEntityTypes: _allowedEntityTypes,
	}: {
		allowedEntityTypes?: (
			| "graph"
			| "table"
			| "json"
			| "unresolved"
			| "input_vector"
			| "rdd"
		)[];
	}) => {
		const { mode } = useColorScheme();
		const isDark = mode === "dark";
		const navigate = useNavigate();

		const {
			selectedEntityId,
			upstreamEntities,
			downstreamEntities,
			globalSearchQuery,
			hideTempTables,
			selectEntity,
			entitiesPage,
			entitiesPageSize,
			setEntitiesPage,
			setEntitiesPageSize,
			entitiesSortBy,
			entitiesSortOrder,
			setEntitiesSort,
		} = useEntitiesStore();

		// Backend pagination
		const {
			data: paginatedData,
			isLoading,
			isFetching,
			isPending,
		} = usePaginatedEntities({
			page: entitiesPage,
			limit: entitiesPageSize,
			search: buildEntitiesSearch({
				uiSearch: globalSearchQuery || undefined,
				hideTempTables,
			}),
			sortBy: entitiesSortBy,
			sortOrder: entitiesSortOrder,
		});

		const totalPages = paginatedData?.totalPages ?? 1;
		const totalEntities = paginatedData?.total ?? 0;

		// Transform backend entities to EntityRow[]
		const entities: EntityRow[] = useMemo(() => {
			if (!paginatedData?.entities) return [];

			return paginatedData.entities.map((entity) => ({
				id: entity.id,
				graphId: "",
				system_code: entity.system_code,
				name: entity.name ?? entity.id,
				type: entity.type,
				namespace: entity.namespace ?? "",
				description: entity.description ?? "",
				entity_change: entity.entity_change ?? "",
				attributeCount: entity.attrSeq?.length ?? 0,
				upstreamCount: 0,
				downstreamCount: 0,
				isDataMart: false,
				isSource: false,
				modified: entity.modified ?? false,
			}));
		}, [paginatedData]);

		// Navigate to entity page
		const handleNavigateToEntity = useCallback(
			(data: EntityRow) => {
				const encodedId = encodeURIComponent(data.id);
				navigate(`/entity/${encodedId}`);
			},
			[navigate],
		);

		// Column definitions
		const columnDefs: ColDef<EntityRow>[] = useMemo(
			() => [
				{
					field: "namespace",
					headerName: "База данных",
					flex: 1,
				},
				{
					field: "system_code",
					headerName: "Система",
					width: 120,
					cellRenderer: ({ value }: { value?: string }) => value || "—",
				},
				{
					field: "name",
					headerName: "Наименование",
					flex: 2,
					minWidth: 180,
				},
				{
					field: "type",
					headerName: "Тип",
					width: 100,
					cellRenderer: ({ value }: { value: string }) => (
						<TypeChip type={value} />
					),
				},
				{
					field: "description",
					headerName: "Описание",
					flex: 1,
				},
				{
					field: "entity_change",
					headerName: "Изменено",
					flex: 1,
					cellRenderer: ({ value }: { value: string }) => {
						if (!value) return "";
						try {
							return format(parseISO(value), "dd.MM.yyyy, HH:mm");
						} catch {
							return value;
						}
					},
				},
			],
			[],
		);

		const handleRowClicked = useCallback(
			(event: RowClickedEvent<EntityRow>) => {
				if (event.data) {
					selectEntity(event.data.id, event.data.graphId);
				}
			},
			[selectEntity],
		);

		const handleRowDoubleClicked = useCallback(
			(event: RowDoubleClickedEvent<EntityRow>) => {
				if (event.data) {
					handleNavigateToEntity(event.data);
				}
			},
			[handleNavigateToEntity],
		);

		// Context menu state
		const [contextMenu, setContextMenu] =
			useState<EntityContextMenuState | null>(null);

		const handleCellContextMenu = useCallback(
			(event: CellContextMenuEvent<EntityRow>) => {
				event.event?.preventDefault();
				if (event.data) {
					const mouseEvent = event.event as MouseEvent;
					setContextMenu({
						entityId: event.data.id,
						entityName: event.data.name,
						entityType: event.data.type,
						x: mouseEvent.clientX,
						y: mouseEvent.clientY,
					});
				}
			},
			[],
		);

		const handleCloseContextMenu = useCallback(() => {
			setContextMenu(null);
		}, []);

		const gridApiRef = useRef<GridApi<EntityRow> | null>(null);

		const handleGridReady = useCallback((event: GridReadyEvent<EntityRow>) => {
			gridApiRef.current = event.api;
		}, []);

		const handleSortChanged = useCallback(
			(event: SortChangedEvent<EntityRow>) => {
				const colState = event.api.getColumnState();
				console.log("🐸 Pepe said >> event:", event);

				const sorted = colState.find((c) => c.sort);
				if (sorted) {
					setEntitiesSort(sorted.colId, sorted.sort as "asc" | "desc");
				} else {
					setEntitiesSort(undefined, undefined);
				}
			},
			[setEntitiesSort],
		);

		const getRowStyle = useCallback(
			(params: { data?: EntityRow }) => {
				const entityId = params.data?.id;
				if (!entityId) return undefined;

				if (entityId === selectedEntityId) {
					return { backgroundColor: `${HIGHLIGHT_COLORS.selected}40` };
				}
				if (upstreamEntities.has(entityId)) {
					return { backgroundColor: `${HIGHLIGHT_COLORS.upstream}20` };
				}
				if (downstreamEntities.has(entityId)) {
					return { backgroundColor: `${HIGHLIGHT_COLORS.downstream}20` };
				}
				return undefined;
			},
			[selectedEntityId, upstreamEntities, downstreamEntities],
		);

		return (
			<Box
				sx={{
					height: "100%",
					width: "100%",
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box sx={{ flex: 1, minHeight: 0 }}>
					<AgGridReact
						rowData={entities}
						columnDefs={columnDefs}
						theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
						onGridReady={handleGridReady}
						onRowClicked={handleRowClicked}
						onRowDoubleClicked={handleRowDoubleClicked}
						onCellContextMenu={handleCellContextMenu}
						onSortChanged={handleSortChanged}
						preventDefaultOnContextMenu
						getRowStyle={getRowStyle}
						rowSelection="single"
						suppressCellFocus
						animateRows
						rowHeight={28}
						headerHeight={32}
						loading={isLoading || isFetching || isPending}
						overlayNoRowsTemplate="Нет данных"
						overlayLoadingTemplate="Загрузка"
					/>
				</Box>

				<PaginationToolbar
					page={entitiesPage}
					totalPages={totalPages}
					totalItems={totalEntities}
					pageSize={entitiesPageSize}
					onPageChange={setEntitiesPage}
					onPageSizeChange={setEntitiesPageSize}
					isFetching={isFetching}
					itemLabel="сущностей"
					extraInfo={
						globalSearchQuery ? `(поиск: "${globalSearchQuery}")` : undefined
					}
				/>

				<EntityContextMenu
					contextMenu={contextMenu}
					onClose={handleCloseContextMenu}
					entity={null}
					connections={[]}
				/>
			</Box>
		);
	},
);

EntitiesPanel.displayName = "EntitiesPanel";
