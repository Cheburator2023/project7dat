/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import {
	Box,
	Typography,
	Chip,
	TextField,
	InputAdornment,
	IconButton,
	Alert,
	CircularProgress,
	Divider,
	Tooltip,
	Paper,
	Popper,
	ClickAwayListener,
	FormControlLabel,
	Checkbox,
	Select,
	MenuItem,
	Button,
	Badge,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import {
	Search as SearchIcon,
	Close as CloseIcon,
	AccountTree as GraphIcon,
	Hub as HubIcon,
	FilterList as FilterListIcon,
	Download as DownloadIcon,
	FileUpload as FileUploadIcon,
	Refresh as RefreshIcon,
	Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Layout, Model, TabNode, Action, IJsonModel } from "flexlayout-react";
import { create } from "zustand";
import {
	ReactFlow,
	Node,
	Edge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
	NodeProps,
	MarkerType,
	Panel,
	useReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";

import dagre from "@dagrejs/dagre";

// Import existing components
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import { AgGridReact } from "ag-grid-react";
import {
	ColDef,
	RowClickedEvent,
	RowDoubleClickedEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import type {
	DataLineageEntity,
	DataLineageSchema,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import {
	CodeJsonEditor,
	useJsonEditorStore,
} from "@react-client/features/codeEditor/CodeJsonEditor";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useEditorStore } from "@react-client/stores/editorStore";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { EntityPreviewNavigationButton } from "@react-client/features/entityPreview/EntityPreviewNavigationButton";
import {
	useCurrentDataLineageGraph,
	useCommitList,
	useInitializeJsonGraph,
	DATA_LINEAGE_QUERY_KEYS,
} from "@react-client/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";
import type { DataLineageGraph } from "@react-client/types/dataLineage";
import {
	useProcessesStore,
	type Process,
} from "@react-client/stores/processesStore";

// ============================================================================
// Cross-Panel Selection Store (Zustand)
// ============================================================================

interface FilterState {
	entityTypes: string[];
	modifiedOnly: boolean;
	namespaces: string[];
	hasUpstream: "any" | "yes" | "no";
	hasDownstream: "any" | "yes" | "no";
	attrCountMin: string;
	attrCountMax: string;
}

const initialFilters: FilterState = {
	entityTypes: [],
	modifiedOnly: false,
	namespaces: [],
	hasUpstream: "any",
	hasDownstream: "any",
	attrCountMin: "",
	attrCountMax: "",
};

interface SelectionState {
	// Selected entity/model/object IDs
	selectedEntityId: string | null;
	selectedGraphId: string | null;
	selectedAttributeName: string | null;

	// Highlight sets for different panels
	highlightedEntities: Set<string>;
	highlightedRows: Set<string>;
	highlightedCodeLines: Set<number>;

	// Filter state
	globalSearchQuery: string;
	filters: FilterState;

	// Actions
	selectEntity: (entityId: string | null, graphId?: string | null) => void;
	selectAttribute: (attrName: string | null) => void;
	highlightEntity: (entityId: string) => void;
	clearHighlights: () => void;
	setGlobalSearch: (query: string) => void;
	setFilters: (filters: FilterState) => void;
	updateFilter: <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
	) => void;
	resetFilters: () => void;

	// Computed upstream/downstream
	upstreamEntities: Set<string>;
	downstreamEntities: Set<string>;
	setUpstreamDownstream: (
		upstream: Set<string>,
		downstream: Set<string>,
	) => void;
}

export const useDashboardStore = create<SelectionState>((set) => ({
	selectedEntityId: null,
	selectedGraphId: null,
	selectedAttributeName: null,
	highlightedEntities: new Set(),
	highlightedRows: new Set(),
	highlightedCodeLines: new Set(),
	globalSearchQuery: "",
	upstreamEntities: new Set(),
	downstreamEntities: new Set(),

	selectEntity: (entityId, graphId = null) =>
		set((state) => ({
			selectedEntityId: entityId,
			selectedGraphId: graphId ?? state.selectedGraphId,
			selectedAttributeName: null,
			highlightedEntities: entityId ? new Set([entityId]) : new Set(),
		})),

	selectAttribute: (attrName) => set({ selectedAttributeName: attrName }),

	highlightEntity: (entityId) =>
		set((state) => ({
			highlightedEntities: new Set([...state.highlightedEntities, entityId]),
		})),

	clearHighlights: () =>
		set({
			selectedEntityId: null,
			selectedAttributeName: null,
			highlightedEntities: new Set(),
			highlightedRows: new Set(),
			highlightedCodeLines: new Set(),
			upstreamEntities: new Set(),
			downstreamEntities: new Set(),
		}),

	setGlobalSearch: (query) => set({ globalSearchQuery: query }),

	filters: initialFilters,
	setFilters: (filters) => set({ filters }),
	updateFilter: (key, value) =>
		set((state) => ({
			filters: { ...state.filters, [key]: value },
		})),
	resetFilters: () => set({ filters: initialFilters }),

	setUpstreamDownstream: (upstream, downstream) =>
		set({ upstreamEntities: upstream, downstreamEntities: downstream }),
}));

// ============================================================================
// Type Definitions
// ============================================================================

interface EntityRow {
	id: string;
	graphId: string;
	name: string;
	type: string;
	namespace: string;
	attributeCount: number;
	upstreamCount: number;
	downstreamCount: number;
	isDataMart: boolean;
	isSource: boolean;
	modified: boolean;
}

interface ObjectRow {
	id: string;
	graphId: string;
	name: string;
	objectType: "Источник" | "Витрина" | "Признак";
	parentEntity: string;
	dataType?: string;
	description: string;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	table: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	view: { bg: "#f3e5f5", border: "#7b1fa2", text: "#6a1b9a" },
	rdd: { bg: "#fff3e0", border: "#f57c00", text: "#e65100" },
	unresolved: { bg: "#fce4ec", border: "#c2185b", text: "#ad1457" },
};

const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
};

// ============================================================================
// Entities Panel Component (Connected Table)
// ============================================================================

const EntitiesPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const {
		selectedEntityId,
		upstreamEntities,
		downstreamEntities,
		globalSearchQuery,
		selectEntity,
		filters,
	} = useDashboardStore();

	const { data: jsonDataList, isLoading, error } = useJsonDataList();

	// Transform data to entity rows
	const entities: EntityRow[] = useMemo(() => {
		if (!jsonDataList) return [];

		const rows: EntityRow[] = [];
		const upstreamMap = new Map<string, Set<string>>();
		const downstreamMap = new Map<string, Set<string>>();

		// First pass: build connection maps
		jsonDataList.forEach((item: JsonDataItem) => {
			const mappings = item.data?.mappings ?? [];
			mappings.forEach((mapping) => {
				if (!mapping.entityId || !mapping.deps) return;
				mapping.deps.forEach((dep) => {
					if (!dep.entityId) return;
					// target has source as upstream
					if (!upstreamMap.has(mapping.entityId)) {
						upstreamMap.set(mapping.entityId, new Set());
					}
					upstreamMap.get(mapping.entityId)!.add(dep.entityId);
					// source has target as downstream
					if (!downstreamMap.has(dep.entityId)) {
						downstreamMap.set(dep.entityId, new Set());
					}
					downstreamMap.get(dep.entityId)!.add(mapping.entityId);
				});
			});
		});

		// Second pass: create rows
		jsonDataList.forEach((item: JsonDataItem) => {
			const localEntities = item.data?.entities ?? [];
			localEntities.forEach((entity: DataLineageEntity) => {
				const upCount = upstreamMap.get(entity.id)?.size ?? 0;
				const downCount = downstreamMap.get(entity.id)?.size ?? 0;

				rows.push({
					id: entity.id,
					graphId: item.id,
					name: entity.name ?? entity.id,
					type: entity.type,
					namespace: entity.namespace ?? "",
					attributeCount: entity.attrSeq?.length ?? 0,
					upstreamCount: upCount,
					downstreamCount: downCount,
					isDataMart: upCount > 0 && downCount === 0,
					isSource: upCount === 0 && downCount > 0,
					modified: entity.modified ?? false,
				});
			});
		});

		return rows;
	}, [jsonDataList]);

	// Filter entities based on search and advanced filters
	const filteredEntities = useMemo(() => {
		let result = entities;

		// Text search filter
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			result = result.filter(
				(e) =>
					e.name.toLowerCase().includes(q) ||
					e.namespace.toLowerCase().includes(q) ||
					e.type.toLowerCase().includes(q),
			);
		}

		// Entity type filter
		if (filters.entityTypes.length > 0) {
			result = result.filter((e) => filters.entityTypes.includes(e.type));
		}

		// Namespace filter
		if (filters.namespaces.length > 0) {
			result = result.filter((e) => filters.namespaces.includes(e.namespace));
		}

		// Modified only filter
		if (filters.modifiedOnly) {
			result = result.filter((e) => e.modified);
		}

		// Has upstream filter
		if (filters.hasUpstream !== "any") {
			result = result.filter((e) =>
				filters.hasUpstream === "yes"
					? e.upstreamCount > 0
					: e.upstreamCount === 0,
			);
		}

		// Has downstream filter
		if (filters.hasDownstream !== "any") {
			result = result.filter((e) =>
				filters.hasDownstream === "yes"
					? e.downstreamCount > 0
					: e.downstreamCount === 0,
			);
		}

		// Attribute count filter
		if (filters.attrCountMin || filters.attrCountMax) {
			const min = filters.attrCountMin
				? Number.parseInt(filters.attrCountMin, 10)
				: 0;
			const max = filters.attrCountMax
				? Number.parseInt(filters.attrCountMax, 10)
				: Number.POSITIVE_INFINITY;
			result = result.filter(
				(e) => e.attributeCount >= min && e.attributeCount <= max,
			);
		}

		return result;
	}, [entities, globalSearchQuery, filters]);

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
			// {
			// 	headerName: "",
			// 	field: "id",
			// 	width: 50,
			// 	pinned: "left",
			// 	sortable: false,
			// 	filter: false,
			// 	cellRenderer: (params: any) => (
			// 		<Tooltip title="Открыть карточку">
			// 			<IconButton
			// 				size="small"
			// 				color="primary"
			// 				onClick={(e) => {
			// 					e.stopPropagation();
			// 					handleNavigateToEntity(params.data);
			// 				}}
			// 			>
			// 				<VisibilityIcon fontSize="small" />
			// 			</IconButton>
			// 		</Tooltip>
			// 	),
			// },
			{
				field: "name",
				headerName: "Сущность",
				flex: 2,
				width: 180,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				field: "isDataMart",
				headerName: "Метки",
				width: 90,

				cellRenderer: ({ data }: { data: EntityRow }) => (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						{data.isDataMart && (
							<Chip
								label="витрина"
								size="small"
								sx={{
									bgcolor: "#9c27b0",
									color: "#fff",
									height: 18,
									fontSize: 10,
								}}
							/>
						)}
						{data.isSource && (
							<Chip
								label="источник"
								size="small"
								sx={{
									bgcolor: "#00897b",
									color: "#fff",
									height: 18,
									fontSize: 10,
								}}
							/>
						)}
						{data.modified && (
							<Chip
								label="изм."
								size="small"
								sx={{
									bgcolor: "#ff9800",
									color: "#fff",
									height: 18,
									fontSize: 10,
								}}
							/>
						)}
					</Box>
				),
			},
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => {
					const colors = TYPE_COLORS[value] || TYPE_COLORS.table;
					return (
						<Chip
							label={value}
							size="small"
							sx={{
								bgcolor: colors.bg,
								color: colors.text,
								border: `1px solid ${colors.border}`,
							}}
						/>
					);
				},
			},
			{
				field: "namespace",
				headerName: "Namespace",
				flex: 1,
			},
			{
				field: "attributeCount",
				headerName: "Атр.",
				width: 70,
				cellRenderer: ({ value }: { value: number }) => (
					<Chip label={value} size="small" variant="outlined" />
				),
			},
			{
				field: "upstreamCount",
				headerName: "↑",
				width: 60,
				cellRenderer: ({ value }: { value: number }) =>
					value > 0 ? (
						<Typography
							sx={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}
						>
							{value}
						</Typography>
					) : null,
			},
			{
				field: "downstreamCount",
				headerName: "↓",
				width: 60,
				cellRenderer: ({ value }: { value: number }) =>
					value > 0 ? (
						<Typography
							sx={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
						>
							{value}
						</Typography>
					) : null,
			},
		],
		[handleNavigateToEntity],
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

	const getRowStyle = useCallback(
		(params: any) => {
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

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ m: 2 }}>
				Ошибка загрузки: {error.message}
			</Alert>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<AgGridReact
				rowData={filteredEntities}
				columnDefs={columnDefs}
				theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
				onRowClicked={handleRowClicked}
				onRowDoubleClicked={handleRowDoubleClicked}
				getRowStyle={getRowStyle}
				rowSelection="single"
				suppressCellFocus
				animateRows
				rowHeight={28}
				headerHeight={32}
			/>
		</Box>
	);
});

// ============================================================================
// Objects Panel Component (Attributes Table)
// ============================================================================

const ObjectsPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const {
		selectedEntityId,
		selectedAttributeName,
		selectAttribute,
		globalSearchQuery,
	} = useDashboardStore();

	const { data: jsonDataList, isLoading } = useJsonDataList();

	// Transform data to object rows
	const objects: ObjectRow[] = useMemo(() => {
		if (!jsonDataList) return [];

		const rows: ObjectRow[] = [];
		jsonDataList.forEach((item: JsonDataItem) => {
			const localEntities = item.data?.entities ?? [];
			localEntities.forEach((entity: DataLineageEntity) => {
				// Add entity row
				rows.push({
					id: `${item.id}::${entity.id}`,
					graphId: item.id,
					name: entity.name ?? entity.id,
					objectType: entity.modified ? "Витрина" : "Источник",
					parentEntity: entity.id,
					description: item.description ?? "",
				});

				// Add attribute rows
				entity.attrSeq?.forEach((attr) => {
					rows.push({
						id: `${item.id}::${entity.id}::${attr.name}`,
						graphId: item.id,
						name: attr.name,
						objectType: "Признак",
						parentEntity: entity.id,
						dataType: attr.type,
						description: attr.comment ?? "",
					});
				});
			});
		});

		return rows;
	}, [jsonDataList]);

	// Filter by selected entity and search
	const filteredObjects = useMemo(() => {
		let filtered = objects;

		// Filter by selected entity
		if (selectedEntityId) {
			filtered = filtered.filter((o) => o.parentEntity === selectedEntityId);
		}

		// Filter by search
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(o) =>
					o.name.toLowerCase().includes(q) ||
					o.description.toLowerCase().includes(q) ||
					(o.dataType && o.dataType.toLowerCase().includes(q)),
			);
		}

		return filtered;
	}, [objects, selectedEntityId, globalSearchQuery]);

	// Navigate to object page
	const handleNavigateToObject = useCallback(
		(data: ObjectRow) => {
			const objectId = encodeURIComponent(data.id);
			navigate(`/objects/${objectId}`);
		},
		[navigate],
	);

	const columnDefs: ColDef<ObjectRow>[] = useMemo(
		() => [
			// {
			// 	headerName: "",
			// 	field: "id",
			// 	width: 50,
			// 	pinned: "left",
			// 	sortable: false,
			// 	filter: false,
			// 	cellRenderer: (params: any) => (
			// 		<Tooltip title="Открыть карточку">
			// 			<IconButton
			// 				size="small"
			// 				color="primary"
			// 				onClick={(e) => {
			// 					e.stopPropagation();
			// 					handleNavigateToObject(params.data);
			// 				}}
			// 			>
			// 				<VisibilityIcon fontSize="small" />
			// 			</IconButton>
			// 		</Tooltip>
			// 	),
			// },
			{
				field: "name",
				headerName: "Объект",
				flex: 2,
			},
			{
				field: "objectType",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => {
					const colors =
						value === "Источник"
							? { bg: "#e0f2f1", color: "#00897b" }
							: value === "Витрина"
								? { bg: "#f3e5f5", color: "#9c27b0" }
								: { bg: "#e3f2fd", color: "#1976d2" }; // Признак
					return (
						<Chip
							label={value}
							size="small"
							sx={{ bgcolor: colors.bg, color: colors.color }}
						/>
					);
				},
			},
			{
				field: "dataType",
				headerName: "Тип данных",
				width: 120,
				cellRenderer: ({ value }: { value?: string }) =>
					value ? <Chip label={value} size="small" variant="outlined" /> : null,
			},
			{
				field: "description",
				headerName: "Описание",
				flex: 1,
			},
		],
		[handleNavigateToObject],
	);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<ObjectRow>) => {
			if (event.data?.objectType === "Признак") {
				selectAttribute(event.data.name);
			}
		},
		[selectAttribute],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<ObjectRow>) => {
			if (event.data) {
				handleNavigateToObject(event.data);
			}
		},
		[handleNavigateToObject],
	);

	const getRowStyle = useCallback(
		(params: { data?: ObjectRow }) => {
			if (params.data?.name === selectedAttributeName) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.selected}40` };
			}
			return undefined;
		},
		[selectedAttributeName],
	);

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{selectedEntityId && (
				<Box
					sx={{
						p: 1,
						bgcolor: "action.hover",
						borderBottom: 1,
						borderColor: "divider",
					}}
				>
					<Typography variant="caption">
						Показаны объекты для: <strong>{selectedEntityId}</strong>
					</Typography>
				</Box>
			)}
			<Box sx={{ flex: 1 }}>
				<AgGridReact
					rowData={filteredObjects}
					columnDefs={columnDefs}
					theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
					onRowClicked={handleRowClicked}
					onRowDoubleClicked={handleRowDoubleClicked}
					getRowStyle={getRowStyle}
					rowSelection="single"
					suppressCellFocus
					animateRows
					rowHeight={28}
					headerHeight={32}
				/>
			</Box>
		</Box>
	);
});

// ============================================================================
// Processes Panel Component
// ============================================================================

const ProcessesPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const { filteredProcesses, isLoading, loadProcesses } = useProcessesStore();

	useEffect(() => {
		loadProcesses();
	}, [loadProcesses]);

	const columnDefs: ColDef<Process>[] = useMemo(
		() => [
			{
				field: "name",
				headerName: "Название",
				flex: 2,
				minWidth: 150,
			},
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => (
					<Chip label={value} size="small" color="primary" variant="outlined" />
				),
			},
			{
				field: "status",
				headerName: "Статус",
				width: 100,
				cellRenderer: ({ value }: { value: Process["status"] }) => (
					<Chip
						label={
							value === "active"
								? "Активен"
								: value === "inactive"
									? "Неактивен"
									: "Ошибка"
						}
						size="small"
						color={
							value === "active"
								? "success"
								: value === "error"
									? "error"
									: "default"
						}
						variant="outlined"
					/>
				),
			},
			{
				field: "owner",
				headerName: "Владелец",
				width: 120,
			},
		],
		[],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<Process>) => {
			if (event.data) {
				navigate(`/processes/${event.data.id}/graph`);
			}
		},
		[navigate],
	);

	if (isLoading) {
		return (
			<Box
				sx={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress size={24} />
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<AgGridReact
				rowData={filteredProcesses}
				columnDefs={columnDefs}
				theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
				onRowDoubleClicked={handleRowDoubleClicked}
				rowSelection="single"
				suppressCellFocus
				animateRows
				rowHeight={28}
				headerHeight={32}
			/>
		</Box>
	);
});

// ============================================================================
// Graph Constants & Types
// ============================================================================

const NODE_WIDTH = 280;
const NODE_HEADER_HEIGHT = 60;
const ATTR_ROW_HEIGHT = 22;
const MAX_VISIBLE_ATTRS = 4;

interface EntityNodeData {
	entity: DataLineageEntity;
	highlightType: "none" | "selected" | "upstream" | "downstream";
	onNodeClick: (id: string) => void;
	onNodeDoubleClick: (id: string, graphId: string) => void;
	graphId: string;
	upstreamCount: number;
	downstreamCount: number;
	[key: string]: unknown;
}

type EntityNode = Node<EntityNodeData, "entityNode">;

// ============================================================================
// Entity Node Component (Full Graph Node)
// ============================================================================

const EntityNodeComponent = memo(({ data, id }: NodeProps<EntityNode>) => {
	const {
		entity,
		highlightType,
		onNodeClick,
		onNodeDoubleClick,
		graphId,
		upstreamCount,
		downstreamCount,
	} = data;
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
	const attrs = entity.attrSeq || [];
	const visibleAttrs = attrs.slice(0, MAX_VISIBLE_ATTRS);
	const moreCount = attrs.length - MAX_VISIBLE_ATTRS;

	const isDataMart = upstreamCount > 0 && downstreamCount === 0;
	const isSource = upstreamCount === 0 && downstreamCount > 0;

	const borderColor =
		highlightType !== "none"
			? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
			: colors.border;
	const borderWidth = highlightType !== "none" ? 13 : 3;

	return (
		<div
			style={{
				background: "#fff",
				border: `${borderWidth}px solid ${borderColor}`,
				borderRadius: 8,
				width: NODE_WIDTH,
				boxShadow:
					highlightType !== "none"
						? `0 4px 20px ${borderColor}40`
						: "0 2px 8px rgba(0,0,0,0.1)",
				overflow: "hidden",
				cursor: "pointer",
				transition: "all 0.2s ease",
			}}
			onClick={() => onNodeClick(id)}
			onDoubleClick={() => onNodeDoubleClick(id, graphId)}
		>
			{/* Header */}
			<div
				style={{
					background: colors.bg,
					padding: "8px 12px",
					borderBottom: `1px solid ${colors.border}`,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
					}}
				>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								fontSize: 11,
								color: colors.text,
								opacity: 0.8,
								textTransform: "uppercase",
								letterSpacing: "0.5px",
								marginBottom: 2,
							}}
						>
							{entity.type}
							{entity.modified && (
								<span
									style={{
										marginLeft: 6,
										background: "#ff9800",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
								>
									изм.
								</span>
							)}
							{isDataMart && (
								<span
									style={{
										marginLeft: 6,
										background: "#9c27b0",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
									title="Витрина данных"
								>
									витрина
								</span>
							)}
							{isSource && (
								<span
									style={{
										marginLeft: 6,
										background: "#00897b",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
									title="Источник данных"
								>
									источник
								</span>
							)}
						</div>
						<div
							style={{
								fontWeight: 600,
								fontSize: 13,
								color: "#333",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
							title={entity.name || entity.id}
						>
							{entity.name || entity.id}
						</div>
						{entity.namespace && (
							<div
								style={{
									fontSize: 10,
									color: "#666",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
								title={entity.namespace}
							>
								{entity.namespace}
							</div>
						)}
					</div>
				</div>
				<div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10 }}>
					{upstreamCount > 0 && (
						<span style={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}>
							← {upstreamCount}
						</span>
					)}
					{downstreamCount > 0 && (
						<span
							style={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
						>
							→ {downstreamCount}
						</span>
					)}
					<span style={{ color: "#888", marginLeft: "auto" }}>
						{attrs.length} атр.
					</span>
				</div>
			</div>

			{/* Preview attributes */}
			{visibleAttrs.length > 0 && (
				<div>
					{visibleAttrs.map((attr, idx) => (
						<div
							key={attr.name}
							style={{
								display: "flex",
								justifyContent: "space-between",
								padding: "3px 12px",
								fontSize: 10,
								borderBottom:
									idx < visibleAttrs.length - 1 ? "1px solid #f5f5f5" : "none",
								background: idx % 2 === 0 ? "#fafafa" : "#fff",
							}}
						>
							<span
								style={{
									color: "#555",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									flex: 1,
								}}
							>
								{attr.name}
							</span>
							<span style={{ color: "#999", marginLeft: 8, fontSize: 9 }}>
								{attr.type}
							</span>
						</div>
					))}
					{moreCount > 0 && (
						<div
							style={{
								padding: "4px 12px",
								fontSize: 10,
								color: "#1976d2",
								background: "#f8f9fa",
								textAlign: "center",
							}}
						>
							+{moreCount} ещё...
						</div>
					)}
				</div>
			)}

			{/* Handles */}
			<Handle
				type="target"
				position={Position.Left}
				style={{
					background: colors.border,
					width: 10,
					height: 10,
					border: "2px solid #fff",
				}}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{
					background: colors.border,
					width: 10,
					height: 10,
					border: "2px solid #fff",
				}}
			/>
		</div>
	);
});

EntityNodeComponent.displayName = "EntityNodeComponent";

const graphNodeTypes = { entityNode: EntityNodeComponent };

// ============================================================================
// Graph Layout Utilities
// ============================================================================

const getLayoutedElements = (
	nodes: EntityNode[],
	edges: Edge[],
	direction: "LR" | "TB" = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 80,
		ranksep: 150,
		marginx: 50,
		marginy: 50,
	});

	nodes.forEach((node) => {
		const attrCount = node.data.entity.attrSeq?.length || 0;
		const visibleAttrs = Math.min(attrCount, MAX_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrs * ATTR_ROW_HEIGHT +
			(attrCount > MAX_VISIBLE_ATTRS ? 24 : 0);
		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});
	dagre.layout(dagreGraph);

	return {
		nodes: nodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			const attrCount = node.data.entity.attrSeq?.length || 0;
			const visibleAttrs = Math.min(attrCount, MAX_VISIBLE_ATTRS);
			const height =
				NODE_HEADER_HEIGHT +
				visibleAttrs * ATTR_ROW_HEIGHT +
				(attrCount > MAX_VISIBLE_ATTRS ? 24 : 0);
			return {
				...node,
				position: {
					x: nodeWithPosition.x - NODE_WIDTH / 2,
					y: nodeWithPosition.y - height / 2,
				},
			};
		}),
		edges,
	};
};

// ============================================================================
// Build Lineage Graph Utilities
// ============================================================================

const buildLineageGraph = (mappings: DataLineageMapping[]) => {
	const upstream = new Map<string, Set<string>>();
	const downstream = new Map<string, Set<string>>();

	mappings.forEach((mapping) => {
		if (!mapping.deps) return;
		mapping.deps.forEach((dep) => {
			if (!upstream.has(mapping.entityId))
				upstream.set(mapping.entityId, new Set());
			upstream.get(mapping.entityId)!.add(dep.entityId);
			if (!downstream.has(dep.entityId))
				downstream.set(dep.entityId, new Set());
			downstream.get(dep.entityId)!.add(mapping.entityId);
		});
	});

	return { upstream, downstream };
};

const getUpstreamNodes = (
	nodeId: string,
	upstreamGraph: Map<string, Set<string>>,
	visited = new Set<string>(),
): Set<string> => {
	if (visited.has(nodeId)) return visited;
	visited.add(nodeId);
	const parents = upstreamGraph.get(nodeId);
	if (parents)
		parents.forEach((parent) =>
			getUpstreamNodes(parent, upstreamGraph, visited),
		);
	return visited;
};

const getDownstreamNodes = (
	nodeId: string,
	downstreamGraph: Map<string, Set<string>>,
	visited = new Set<string>(),
): Set<string> => {
	if (visited.has(nodeId)) return visited;
	visited.add(nodeId);
	const children = downstreamGraph.get(nodeId);
	if (children)
		children.forEach((child) =>
			getDownstreamNodes(child, downstreamGraph, visited),
		);
	return visited;
};

// ============================================================================
// Graph Panel Inner Component (with ReactFlow hooks)
// ============================================================================

interface GraphPanelInnerProps {
	data: DataLineageSchema;
	graphId: string;
	selectedEntityId: string | null;
	onSelectEntity: (id: string | null) => void;
	onNodeDoubleClick: (entityId: string, graphId: string) => void;
	onUpstreamDownstreamChange: (
		upstream: Set<string>,
		downstream: Set<string>,
	) => void;
}

const GraphPanelInner = memo<GraphPanelInnerProps>(
	({
		data,
		graphId,
		selectedEntityId,
		onSelectEntity,
		onNodeDoubleClick,
		onUpstreamDownstreamChange,
	}) => {
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
		const { fitView } = useReactFlow();

		const lineageGraph = useMemo(
			() => buildLineageGraph(data.mappings || []),
			[data.mappings],
		);

		// Calculate upstream/downstream counts for each entity
		const { upstreamCounts, downstreamCounts } = useMemo(() => {
			const upCounts = new Map<string, number>();
			const downCounts = new Map<string, number>();
			for (const entity of data.entities || []) {
				const upNodes = getUpstreamNodes(entity.id, lineageGraph.upstream);
				upNodes.delete(entity.id);
				upCounts.set(entity.id, upNodes.size);
				const downNodes = getDownstreamNodes(
					entity.id,
					lineageGraph.downstream,
				);
				downNodes.delete(entity.id);
				downCounts.set(entity.id, downNodes.size);
			}
			return { upstreamCounts: upCounts, downstreamCounts: downCounts };
		}, [data.entities, lineageGraph]);

		// Calculate upstream/downstream for selected node
		const { upstreamNodes, downstreamNodes } = useMemo(() => {
			if (!selectedEntityId)
				return {
					upstreamNodes: new Set<string>(),
					downstreamNodes: new Set<string>(),
				};
			const upstream = getUpstreamNodes(
				selectedEntityId,
				lineageGraph.upstream,
			);
			const downstream = getDownstreamNodes(
				selectedEntityId,
				lineageGraph.downstream,
			);
			upstream.delete(selectedEntityId);
			downstream.delete(selectedEntityId);
			return { upstreamNodes: upstream, downstreamNodes: downstream };
		}, [selectedEntityId, lineageGraph]);

		// Notify parent about upstream/downstream changes
		useEffect(() => {
			onUpstreamDownstreamChange(upstreamNodes, downstreamNodes);
		}, [upstreamNodes, downstreamNodes, onUpstreamDownstreamChange]);

		const handleNodeClick = useCallback(
			(id: string) => onSelectEntity(id),
			[onSelectEntity],
		);

		const handleNodeDblClick = useCallback(
			(entityId: string, gId: string) => onNodeDoubleClick(entityId, gId),
			[onNodeDoubleClick],
		);

		// Create nodes and edges
		const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
			const entityMap = new Map<string, DataLineageEntity>();
			for (const entity of data.entities || [])
				entityMap.set(entity.id, entity);

			const nodes: EntityNode[] = (data.entities || []).map((entity) => {
				let highlightType: EntityNodeData["highlightType"] = "none";
				if (entity.id === selectedEntityId) highlightType = "selected";
				else if (upstreamNodes.has(entity.id)) highlightType = "upstream";
				else if (downstreamNodes.has(entity.id)) highlightType = "downstream";

				return {
					id: entity.id,
					type: "entityNode",
					position: { x: 0, y: 0 },
					data: {
						entity,
						highlightType,
						onNodeClick: handleNodeClick,
						onNodeDoubleClick: handleNodeDblClick,
						graphId,
						upstreamCount: upstreamCounts.get(entity.id) || 0,
						downstreamCount: downstreamCounts.get(entity.id) || 0,
					},
				};
			});

			const edges: Edge[] = [];
			const edgeSet = new Set<string>();
			(data.mappings || []).forEach((mapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					const edgeId = `${dep.entityId}->${mapping.entityId}`;
					if (edgeSet.has(edgeId)) return;
					edgeSet.add(edgeId);
					if (!entityMap.has(dep.entityId) || !entityMap.has(mapping.entityId))
						return;

					const isHighlighted =
						(upstreamNodes.has(dep.entityId) &&
							upstreamNodes.has(mapping.entityId)) ||
						(downstreamNodes.has(dep.entityId) &&
							downstreamNodes.has(mapping.entityId)) ||
						dep.entityId === selectedEntityId ||
						mapping.entityId === selectedEntityId;

					edges.push({
						id: edgeId,
						source: dep.entityId,
						target: mapping.entityId,
						type: "smoothstep",
						animated: isHighlighted,
						style: {
							stroke: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
							strokeWidth: isHighlighted ? 2 : 1,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
						},
					});
				});
			});

			return { nodes, edges };
		}, [
			data,
			graphId,
			selectedEntityId,
			upstreamNodes,
			downstreamNodes,
			handleNodeClick,
			handleNodeDblClick,
			upstreamCounts,
			downstreamCounts,
		]);

		// Apply layout
		const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
			() => getLayoutedElements(initialNodes, initialEdges, layoutDirection),
			[initialNodes, initialEdges, layoutDirection],
		);

		const [nodes, setNodes, onNodesChange] = useNodesState(
			layoutedNodes as Node[],
		);
		const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

		useEffect(() => {
			setNodes(layoutedNodes as Node[]);
			setEdges(layoutedEdges);
		}, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

		useEffect(() => {
			const timer = setTimeout(
				() => fitView({ padding: 0.1, duration: 300 }),
				100,
			);
			return () => clearTimeout(timer);
		}, [layoutDirection, fitView, data]);

		return (
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={graphNodeTypes}
				fitView
				minZoom={0.1}
				maxZoom={2}
				defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background color="#e0e0e0" gap={20} />
				<Controls />
				<MiniMap
					nodeColor={(node) => {
						const entityNode = node as unknown as EntityNode;
						if (entityNode.data.highlightType === "selected")
							return HIGHLIGHT_COLORS.selected;
						if (entityNode.data.highlightType === "upstream")
							return HIGHLIGHT_COLORS.upstream;
						if (entityNode.data.highlightType === "downstream")
							return HIGHLIGHT_COLORS.downstream;
						return TYPE_COLORS[entityNode.data.entity.type]?.border || "#999";
					}}
					style={{
						background: "#f5f5f5",
						border: "1px solid #ddd",
						borderRadius: 8,
					}}
				/>
				<Panel position="top-left">
					<div
						style={{
							background: "#fff",
							padding: 12,
							borderRadius: 8,
							boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
						}}
					>
						<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
							{data.entities?.length || 0} сущностей
						</div>
						<button
							onClick={() =>
								setLayoutDirection(layoutDirection === "LR" ? "TB" : "LR")
							}
							style={{
								padding: "6px 12px",
								border: "1px solid #ddd",
								borderRadius: 6,
								background: "#fff",
								cursor: "pointer",
								fontSize: 11,
							}}
						>
							{layoutDirection === "LR" ? "↔ Горизонтально" : "↕ Вертикально"}
						</button>
					</div>
				</Panel>
				<Panel position="bottom-left">
					<div
						style={{
							background: "#fff",
							padding: 10,
							borderRadius: 8,
							boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
							display: "flex",
							gap: 12,
							fontSize: 10,
						}}
					>
						{Object.entries(TYPE_COLORS).map(([type, colors]) => (
							<div
								key={type}
								style={{ display: "flex", alignItems: "center", gap: 4 }}
							>
								<span
									style={{
										display: "inline-block",
										width: 10,
										height: 10,
										background: colors.bg,
										border: `2px solid ${colors.border}`,
										borderRadius: 3,
									}}
								/>
								{type}
							</div>
						))}
					</div>
				</Panel>
			</ReactFlow>
		);
	},
);

GraphPanelInner.displayName = "GraphPanelInner";

// ============================================================================
// Graph Panel Component (Connected to Dashboard Store)
// ============================================================================

const GraphPanel = memo(() => {
	const {
		selectedEntityId,
		selectedGraphId,
		selectEntity,
		setUpstreamDownstream,
	} = useDashboardStore();
	const { data: jsonDataList, isLoading } = useJsonDataList();

	// Auto-select first graph if none selected
	const effectiveGraphId = useMemo(() => {
		if (selectedGraphId) return selectedGraphId;
		if (jsonDataList && jsonDataList.length > 0) return jsonDataList[0].id;
		return null;
	}, [selectedGraphId, jsonDataList]);

	const currentSchema: DataLineageSchema | null = useMemo(() => {
		if (!jsonDataList || !effectiveGraphId) return null;
		const item = jsonDataList.find(
			(i: JsonDataItem) => i.id === effectiveGraphId,
		);
		return item?.data ?? null;
	}, [jsonDataList, effectiveGraphId]);

	const navigate = useNavigate();

	const handleSelectEntity = useCallback(
		(id: string | null) => selectEntity(id, effectiveGraphId),
		[selectEntity, effectiveGraphId],
	);

	const handleNodeDoubleClick = useCallback(
		(entityId: string, _graphId: string) => {
			const encodedId = encodeURIComponent(entityId);
			navigate(`/entity/${encodedId}`);
		},
		[navigate],
	);

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!currentSchema || !effectiveGraphId) {
		return (
			<Box sx={{ p: 4, textAlign: "center" }}>
				<GraphIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
				<Typography color="text.secondary">
					Нет данных для отображения графа
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<ReactFlowProvider>
				<GraphPanelInner
					data={currentSchema}
					graphId={effectiveGraphId}
					selectedEntityId={selectedEntityId}
					onSelectEntity={handleSelectEntity}
					onNodeDoubleClick={handleNodeDoubleClick}
					onUpstreamDownstreamChange={setUpstreamDownstream}
				/>
			</ReactFlowProvider>
		</Box>
	);
});

// ============================================================================
// Code Editor Panel (Connected to Dashboard Store)
// ============================================================================

const CodeEditorPanel = memo(() => {
	const { selectedGraphId, selectedEntityId } = useDashboardStore();
	const { data: jsonDataList, isLoading } = useJsonDataList();
	const { setCurrentGraph, setRevealPosition } = useDataLineageStore();
	const { addHighlight, clearHighlights, setExpanded } = useJsonEditorStore();

	// Auto-select first graph if none selected
	const effectiveGraphId = useMemo(() => {
		if (selectedGraphId) return selectedGraphId;
		if (jsonDataList && jsonDataList.length > 0) return jsonDataList[0].id;
		return null;
	}, [selectedGraphId, jsonDataList]);

	const currentSchema = useMemo(() => {
		if (!jsonDataList || !effectiveGraphId) return null;
		const item = jsonDataList.find(
			(i: JsonDataItem) => i.id === effectiveGraphId,
		);
		return item?.data ?? null;
	}, [jsonDataList, effectiveGraphId]);

	// Sync current schema to dataLineageStore for CodeJsonEditor
	useEffect(() => {
		if (currentSchema) {
			setCurrentGraph(currentSchema);
		}
	}, [currentSchema, setCurrentGraph]);

	// When entity is selected, trigger scroll and highlight in CodeJsonEditor
	useEffect(() => {
		if (selectedEntityId && currentSchema) {
			// Find entity index in schema
			const entityIndex = currentSchema.entities?.findIndex(
				(e: DataLineageEntity) => e.id === selectedEntityId,
			);

			if (entityIndex !== undefined && entityIndex >= 0) {
				const entityPath = `entities.${entityIndex}`;

				// Clear previous highlights and add new one
				clearHighlights();
				addHighlight(entityPath);

				// Expand parent paths
				setExpanded("entities", true);
				setExpanded(entityPath, true);

				// Trigger scroll
				setRevealPosition({ nodeId: selectedEntityId, from: "graph" });
			}
		} else {
			clearHighlights();
		}
	}, [
		selectedEntityId,
		currentSchema,
		setRevealPosition,
		addHighlight,
		clearHighlights,
		setExpanded,
	]);

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!currentSchema) {
		return (
			<Box sx={{ p: 4, textAlign: "center" }}>
				<Typography color="text.secondary">
					Нет данных для отображения
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<CodeJsonEditor initialData={currentSchema} />
		</Box>
	);
});

// ============================================================================
// Selection Info Panel
// ============================================================================

const SelectionInfoPanel = memo(() => {
	const {
		selectedEntityId,
		selectedAttributeName,
		upstreamEntities,
		downstreamEntities,
		clearHighlights,
	} = useDashboardStore();

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
			<Typography variant="h6" gutterBottom>
				Информация о выборе
			</Typography>

			{selectedEntityId ? (
				<Box>
					<Box sx={{ mb: 2 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Выбранная сущность
						</Typography>
						<Chip
							label={selectedEntityId}
							color="primary"
							onDelete={clearHighlights}
							sx={{ mt: 0.5 }}
						/>
					</Box>

					{selectedAttributeName && (
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle2" color="text.secondary">
								Выбранный атрибут
							</Typography>
							<Chip
								label={selectedAttributeName}
								color="secondary"
								sx={{ mt: 0.5 }}
							/>
						</Box>
					)}

					<Divider sx={{ my: 2 }} />

					<Box sx={{ mb: 2 }}>
						<Typography
							variant="subtitle2"
							sx={{ color: HIGHLIGHT_COLORS.upstream }}
						>
							↑ Upstream ({upstreamEntities.size})
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
							{Array.from(upstreamEntities)
								.slice(0, 10)
								.map((id) => (
									<Chip key={id} label={id} size="small" variant="outlined" />
								))}
							{upstreamEntities.size > 10 && (
								<Chip label={`+${upstreamEntities.size - 10}`} size="small" />
							)}
						</Box>
					</Box>

					<Box>
						<Typography
							variant="subtitle2"
							sx={{ color: HIGHLIGHT_COLORS.downstream }}
						>
							↓ Downstream ({downstreamEntities.size})
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
							{Array.from(downstreamEntities)
								.slice(0, 10)
								.map((id) => (
									<Chip key={id} label={id} size="small" variant="outlined" />
								))}
							{downstreamEntities.size > 10 && (
								<Chip label={`+${downstreamEntities.size - 10}`} size="small" />
							)}
						</Box>
					</Box>
				</Box>
			) : (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<HubIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
					<Typography color="text.secondary">
						Выберите сущность для просмотра информации о связях
					</Typography>
				</Box>
			)}
		</Box>
	);
});

// ============================================================================
// FlexLayout Configuration
// ============================================================================

const flexLayoutJson: IJsonModel = {
	global: {
		tabEnableClose: false,
		tabEnableRename: false,
		tabSetEnableTabStrip: true,
		tabSetEnableDrop: true,
		tabSetEnableDrag: true,
		tabSetEnableClose: false,
		tabSetEnableMaximize: true,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			// Left column: Tables
			{
				type: "row",
				weight: 35,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "📊 Сущности",
								component: "entities",
								id: "entities-tab",
							},
							// {
							// 	type: "tab",
							// 	name: "⚙️ Процессы",
							// 	component: "processes",
							// 	id: "processes-tab",
							// },
						],
					},
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "📋 Объекты",
								component: "objects",
								id: "objects-tab",
							},
						],
					},
				],
			},
			// Middle column: Graph
			{
				type: "tabset",
				weight: 40,
				children: [
					{
						type: "tab",
						name: "🔗 Граф",
						component: "graph",
						id: "graph-tab",
					},
				],
			},
			// Right column: Code Editor, Commit History, Info
			{
				type: "row",
				weight: 25,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "✏️ Редактор",
								component: "code-editor",
								id: "code-editor-tab",
							},
							{
								type: "tab",
								name: "ℹ️ Информация",
								component: "selection-info",
								id: "selection-info-tab",
							},
						],
					},
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "📜 История",
								component: "commit-history",
								id: "commit-history-tab",
							},
						],
					},
				],
			},
		],
	},
};

// ============================================================================
// Search Result Item Interface
// ============================================================================

interface SearchResultItem {
	id: string;
	graphId: string;
	name: string;
	type: string;
	namespace?: string;
	matchedField: "name" | "type" | "namespace" | "attribute";
	matchedValue: string;
	isDataMart?: boolean;
	isSource?: boolean;
	modified?: boolean;
}

// ============================================================================
// Search Dropdown Component
// ============================================================================

const _SearchDropdown = memo(
	({
		entities,
		query,
		onSelect,
		onClose,
		anchorEl,
	}: {
		entities: EntityRow[];
		query: string;
		onSelect: (entity: EntityRow) => void;
		onClose: () => void;
		anchorEl: HTMLElement | null;
	}) => {
		const open = Boolean(anchorEl) && query.length > 0;
		const q = query.toLowerCase();

		// Find matching entities with matched field info
		const results: SearchResultItem[] = useMemo(() => {
			if (!q) return [];
			const items: SearchResultItem[] = [];

			entities.forEach((entity) => {
				if (entity.name.toLowerCase().includes(q)) {
					items.push({
						...entity,
						matchedField: "name",
						matchedValue: entity.name,
					});
				} else if (entity.type.toLowerCase().includes(q)) {
					items.push({
						...entity,
						matchedField: "type",
						matchedValue: entity.type,
					});
				} else if (entity.namespace.toLowerCase().includes(q)) {
					items.push({
						...entity,
						matchedField: "namespace",
						matchedValue: entity.namespace,
					});
				}
			});

			return items.slice(0, 20); // Limit results
		}, [entities, q]);

		if (!open || results.length === 0) return null;

		return (
			<Popper
				open={open}
				anchorEl={anchorEl}
				placement="bottom-start"
				style={{ zIndex: 1300, width: anchorEl?.offsetWidth || 400 }}
			>
				<ClickAwayListener onClickAway={onClose}>
					<Paper
						elevation={8}
						sx={{
							maxHeight: 400,
							overflow: "auto",
							mt: 0.5,
							border: 1,
							borderColor: "divider",
						}}
					>
						{results.map((result, idx) => {
							const typeColor = TYPE_COLORS[result.type] || TYPE_COLORS.table;
							return (
								<Box
									key={`${result.graphId}-${result.id}-${idx}`}
									onClick={() => onSelect(result as unknown as EntityRow)}
									sx={{
										p: 1.5,
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										gap: 1,
										borderBottom: 1,
										borderColor: "divider",
										"&:hover": { bgcolor: "action.hover" },
										"&:last-child": { borderBottom: 0 },
									}}
								>
									{/* Entity type badge */}
									<Chip
										label={result.type}
										size="small"
										sx={{
											bgcolor: typeColor.bg,
											color: typeColor.text,
											fontWeight: 600,
											fontSize: 10,
											height: 20,
										}}
									/>

									{/* Entity name */}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											variant="body2"
											fontWeight={500}
											noWrap
											title={result.name}
										>
											{result.name}
										</Typography>
										{result.namespace && (
											<Typography
												variant="caption"
												color="text.secondary"
												noWrap
												component="div"
											>
												{result.namespace}
											</Typography>
										)}
									</Box>

									{/* Matched field indicator */}
									<Chip
										label={`совпадение: ${result.matchedField}`}
										size="small"
										variant="outlined"
										sx={{ fontSize: 9, height: 18 }}
									/>

									{/* Role badges */}
									{result.isDataMart && (
										<Chip
											label="витрина"
											size="small"
											sx={{
												bgcolor: "#f3e5f5",
												color: "#9c27b0",
												fontSize: 9,
												height: 18,
											}}
										/>
									)}
									{result.isSource && (
										<Chip
											label="источник"
											size="small"
											sx={{
												bgcolor: "#e0f2f1",
												color: "#00897b",
												fontSize: 9,
												height: 18,
											}}
										/>
									)}
									{result.modified && (
										<Chip
											label="изм."
											size="small"
											sx={{
												bgcolor: "#fff3e0",
												color: "#f57c00",
												fontSize: 9,
												height: 18,
											}}
										/>
									)}
								</Box>
							);
						})}
					</Paper>
				</ClickAwayListener>
			</Popper>
		);
	},
);

// ============================================================================
// Advanced Filters Panel Component
// ============================================================================

const AdvancedFiltersPanel = memo(
	({
		filterOptions,
		anchorEl,
		onClose,
	}: {
		filterOptions: { entityTypes: string[]; namespaces: string[] };
		anchorEl: HTMLElement | null;
		onClose: () => void;
	}) => {
		const { filters, updateFilter, resetFilters } = useDashboardStore();
		const open = Boolean(anchorEl);

		const activeFilterCount = useMemo(() => {
			let count = 0;
			if (filters.entityTypes.length) count++;
			if (filters.modifiedOnly) count++;
			if (filters.namespaces.length) count++;
			if (filters.hasUpstream !== "any") count++;
			if (filters.hasDownstream !== "any") count++;
			if (filters.attrCountMin || filters.attrCountMax) count++;
			return count;
		}, [filters]);

		if (!open) return null;

		return (
			<Popper
				open={open}
				anchorEl={anchorEl}
				placement="bottom-end"
				style={{ zIndex: 1300 }}
			>
				<ClickAwayListener onClickAway={onClose}>
					<Paper
						elevation={8}
						sx={{
							p: 2,
							width: "100%",
							mt: 0.5,
							border: 1,
							borderColor: "divider",
						}}
					>
						<Typography variant="subtitle2" fontWeight={600} mb={2}>
							Расширенные фильтры
						</Typography>

						{/* Entity Type Filter */}
						<Box mb={2}>
							<Typography variant="caption" color="text.secondary" mb={0.5}>
								Тип сущности
							</Typography>
							<Box display="flex" flexWrap="wrap" gap={0.5}>
								{filterOptions.entityTypes.map((type) => {
									const colors = TYPE_COLORS[type] || TYPE_COLORS.table;
									const isSelected = filters.entityTypes.includes(type);
									return (
										<Chip
											key={type}
											label={type}
											size="small"
											onClick={() => {
												const newTypes = isSelected
													? filters.entityTypes.filter((t) => t !== type)
													: [...filters.entityTypes, type];
												updateFilter("entityTypes", newTypes);
											}}
											sx={{
												bgcolor: isSelected ? colors.bg : "transparent",
												color: isSelected ? colors.text : "text.secondary",
												borderColor: isSelected ? colors.border : "divider",
												border: 1,
												fontWeight: isSelected ? 600 : 400,
												cursor: "pointer",
											}}
										/>
									);
								})}
							</Box>
						</Box>

						{/* Namespace Filter */}
						{filterOptions.namespaces.length > 0 && (
							<Box mb={2}>
								<Typography variant="caption" color="text.secondary" mb={0.5}>
									Схема / Namespace
								</Typography>
								<Box
									display="flex"
									flexWrap="wrap"
									gap={0.5}
									maxHeight={80}
									overflow="auto"
								>
									{filterOptions.namespaces.slice(0, 10).map((ns) => {
										const isSelected = filters.namespaces.includes(ns);
										return (
											<Chip
												key={ns}
												label={ns}
												size="small"
												onClick={() => {
													const newNs = isSelected
														? filters.namespaces.filter((n) => n !== ns)
														: [...filters.namespaces, ns];
													updateFilter("namespaces", newNs);
												}}
												sx={{
													bgcolor: isSelected ? "primary.light" : "transparent",
													color: isSelected
														? "primary.contrastText"
														: "text.secondary",
													border: 1,
													borderColor: isSelected ? "primary.main" : "divider",
													fontWeight: isSelected ? 600 : 400,
													cursor: "pointer",
													maxWidth: 120,
												}}
												title={ns}
											/>
										);
									})}
								</Box>
							</Box>
						)}

						{/* Modified Only */}
						<FormControlLabel
							control={
								<Checkbox
									size="small"
									checked={filters.modifiedOnly}
									onChange={(e) =>
										updateFilter("modifiedOnly", e.target.checked)
									}
								/>
							}
							label={<Typography variant="body2">Только изменённые</Typography>}
							sx={{ mb: 1 }}
						/>

						{/* Connection Filters */}
						<Box display="flex" gap={1} mb={2}>
							<Box flex={1}>
								<Typography variant="caption" color="text.secondary">
									Источники
								</Typography>
								<Select
									size="small"
									fullWidth
									value={filters.hasUpstream}
									onChange={(e) =>
										updateFilter(
											"hasUpstream",
											e.target.value as FilterState["hasUpstream"],
										)
									}
								>
									<MenuItem value="any">Любые</MenuItem>
									<MenuItem value="yes">Есть</MenuItem>
									<MenuItem value="no">Нет</MenuItem>
								</Select>
							</Box>
							<Box flex={1}>
								<Typography variant="caption" color="text.secondary">
									Потребители
								</Typography>
								<Select
									size="small"
									fullWidth
									value={filters.hasDownstream}
									onChange={(e) =>
										updateFilter(
											"hasDownstream",
											e.target.value as FilterState["hasDownstream"],
										)
									}
								>
									<MenuItem value="any">Любые</MenuItem>
									<MenuItem value="yes">Есть</MenuItem>
									<MenuItem value="no">Нет</MenuItem>
								</Select>
							</Box>
						</Box>

						{/* Attribute Count Filter */}
						<Box mb={2}>
							<Typography variant="caption" color="text.secondary">
								Кол-во атрибутов
							</Typography>
							<Box display="flex" gap={1}>
								<TextField
									size="small"
									type="number"
									placeholder="Мин"
									value={filters.attrCountMin}
									onChange={(e) => updateFilter("attrCountMin", e.target.value)}
									sx={{ flex: 1 }}
								/>
								<TextField
									size="small"
									type="number"
									placeholder="Макс"
									value={filters.attrCountMax}
									onChange={(e) => updateFilter("attrCountMax", e.target.value)}
									sx={{ flex: 1 }}
								/>
							</Box>
						</Box>

						{/* Reset Button */}
						{activeFilterCount > 0 && (
							<Button
								fullWidth
								variant="outlined"
								color="error"
								size="small"
								onClick={resetFilters}
							>
								Сбросить фильтры ({activeFilterCount})
							</Button>
						)}
					</Paper>
				</ClickAwayListener>
			</Popper>
		);
	},
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

const PERSIST_LAYOUT_TO_STORAGE = false;

export const DashboardPage = () => {
	const {
		globalSearchQuery,
		setGlobalSearch,
		clearHighlights,
		selectedEntityId,
		filters,
		selectEntity,
	} = useDashboardStore();

	// Data lineage store for commit functionality
	const {
		currentGraphId,
		currentGraph,
		hasUnsavedChanges,
		discardChanges,
		initializeGraph,
		setCurrentGraphId,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraphId: state.currentGraphId,
			currentGraph: state.currentGraph,
			hasUnsavedChanges: state.hasUnsavedChanges,
			discardChanges: state.discardChanges,
			initializeGraph: state.initializeGraph,
			setCurrentGraphId: state.setCurrentGraphId,
		})),
	);

	// Editor store for import/export
	const { importFromFile, exportToFile } = useEditorStore();

	// Commit dialog state
	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);

	// Query client and mutations
	const queryClient = useQueryClient();
	const initializeGraphMutation = useInitializeJsonGraph();
	const { refetch: refetchCurrentGraph } = useCurrentDataLineageGraph();
	const { refetch: refetchCommitList } = useCommitList({
		graphId: currentGraphId || undefined,
	});

	// Search dropdown state
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [_searchAnchorEl, setSearchAnchorEl] = useState<HTMLElement | null>(
		null,
	);
	const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
		null,
	);

	// Get all entities for search dropdown
	const { data: jsonDataList } = useJsonDataList();

	// Build entities list for search
	const allEntities: EntityRow[] = useMemo(() => {
		if (!jsonDataList) return [];
		const rows: EntityRow[] = [];

		jsonDataList.forEach((item: JsonDataItem) => {
			const schema = item.data as DataLineageSchema | undefined;
			if (!schema?.entities) return;

			// Build lineage graph for counts
			const lineageGraph = buildLineageGraph(schema.mappings || []);

			schema.entities.forEach((entity: DataLineageEntity) => {
				const upstreamNodes = getUpstreamNodes(
					entity.id,
					lineageGraph.upstream,
				);
				upstreamNodes.delete(entity.id);
				const downstreamNodes = getDownstreamNodes(
					entity.id,
					lineageGraph.downstream,
				);
				downstreamNodes.delete(entity.id);

				rows.push({
					id: entity.id,
					graphId: item.id,
					name: entity.name ?? entity.id,
					type: entity.type,
					namespace: entity.namespace ?? "",
					attributeCount: entity.attrSeq?.length ?? 0,
					upstreamCount: upstreamNodes.size,
					downstreamCount: downstreamNodes.size,
					isDataMart: upstreamNodes.size > 0 && downstreamNodes.size === 0,
					isSource: upstreamNodes.size === 0 && downstreamNodes.size > 0,
					modified: entity.modified ?? false,
				});
			});
		});

		return rows;
	}, [jsonDataList]);

	// Calculate filter options from entities
	const filterOptions = useMemo(() => {
		const entityTypes = [...new Set(allEntities.map((e) => e.type))];
		const namespaces = [
			...new Set(allEntities.map((e) => e.namespace).filter(Boolean)),
		];
		return { entityTypes, namespaces };
	}, [allEntities]);

	// Calculate active filter count
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.entityTypes.length) count++;
		if (filters.modifiedOnly) count++;
		if (filters.namespaces.length) count++;
		if (filters.hasUpstream !== "any") count++;
		if (filters.hasDownstream !== "any") count++;
		if (filters.attrCountMin || filters.attrCountMax) count++;
		return count;
	}, [filters]);

	// Handle search input focus
	const handleSearchFocus = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			setSearchAnchorEl(e.currentTarget.parentElement?.parentElement || null);
		},
		[],
	);

	// Handle search result selection
	const _handleSearchResultSelect = useCallback(
		(entity: EntityRow) => {
			selectEntity(entity.id, entity.graphId);
			setSearchAnchorEl(null);
			setGlobalSearch("");
		},
		[selectEntity, setGlobalSearch],
	);

	// Commit handlers
	const handleCommitChanges = useCallback(() => {
		setIsCommitDialogOpen(true);
	}, []);

	const handleCommitDialogClose = useCallback(() => {
		setIsCommitDialogOpen(false);
		queryClient.invalidateQueries({
			queryKey: DATA_LINEAGE_QUERY_KEYS.current(),
		});
		if (currentGraphId) {
			refetchCommitList();
		}
	}, [queryClient, currentGraphId, refetchCommitList]);

	// Import/Export handlers
	const handleImport = useCallback(() => {
		if (!currentGraph) return;
		importFromFile();
	}, [currentGraph, importFromFile]);

	const handleExport = useCallback(() => {
		exportToFile();
	}, [exportToFile]);

	// Manual reload handler
	const handleManualLoad = useCallback(async () => {
		try {
			await refetchCurrentGraph();
			if (currentGraphId) {
				await refetchCommitList();
			}
		} catch (error) {
			console.error("Ошибка при загрузке данных:", error);
		}
	}, [refetchCurrentGraph, currentGraphId, refetchCommitList]);

	// Initialize new graph handler
	const handleInitializeGraph = useCallback(async () => {
		setIsInitializing(true);
		try {
			const result = await initializeGraphMutation.mutateAsync({
				data: dataLineageExampleData,
			});
			initializeGraph(result.data as DataLineageGraph);
			setCurrentGraphId(result.id);
			setTimeout(() => {
				setIsInitializing(false);
			}, 100);
		} catch (error) {
			console.error("Failed to initialize graph:", error);
			setIsInitializing(false);
		}
	}, [initializeGraphMutation, initializeGraph, setCurrentGraphId]);

	const [model] = useState(() => {
		if (PERSIST_LAYOUT_TO_STORAGE) {
			try {
				const savedLayout = localStorage.getItem("dashboard2-flex-layout");
				if (savedLayout) {
					return Model.fromJson(JSON.parse(savedLayout));
				}
			} catch (error) {
				console.warn("Failed to load layout from localStorage:", error);
			}
		}
		return Model.fromJson(flexLayoutJson);
	});

	const factory = useCallback((node: TabNode) => {
		const component = node.getComponent();

		switch (component) {
			case "entities":
				return <EntitiesPanel />;
			case "objects":
				return <ObjectsPanel />;
			case "processes":
				return <ProcessesPanel />;
			case "graph":
				return <GraphPanel />;
			case "selection-info":
				return <SelectionInfoPanel />;
			case "code-editor":
				return <CodeEditorPanel />;
			case "commit-history":
				return <CommitHistory />;
			default:
				return <div>Unknown component: {component}</div>;
		}
	}, []);

	const onAction = useCallback(
		(action: Action) => {
			if (PERSIST_LAYOUT_TO_STORAGE) {
				setTimeout(() => {
					try {
						const layoutJson = model.toJson();
						localStorage.setItem(
							"dashboard2-flex-layout",
							JSON.stringify(layoutJson),
						);
					} catch (error) {
						console.warn("Failed to save layout to localStorage:", error);
					}
				}, 0);
			}

			return action;
		},
		[model],
	);

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			{/* Header */}
			<Header>
				{selectedEntityId && (
					<Chip
						label={`Выбрано: ${selectedEntityId}`}
						onDelete={clearHighlights}
						color="primary"
						size="small"
					/>
				)}
				<Flex gap={8} alignItems="center">
					<Box sx={{ position: "relative" }}>
						<TextField
							inputRef={searchInputRef}
							placeholder="Глобальный поиск..."
							value={globalSearchQuery}
							onChange={(e) => setGlobalSearch(e.target.value)}
							onFocus={handleSearchFocus}
							size="small"
							sx={{ width: 350 }}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon fontSize="small" />
										</InputAdornment>
									),
									endAdornment: globalSearchQuery && (
										<InputAdornment position="end">
											<IconButton
												size="small"
												onClick={() => {
													setGlobalSearch("");
													setSearchAnchorEl(null);
												}}
											>
												<CloseIcon fontSize="small" />
											</IconButton>
										</InputAdornment>
									),
								},
							}}
						/>
						{/* <SearchDropdown
							entities={allEntities}
							query={globalSearchQuery}
							onSelect={handleSearchResultSelect}
							onClose={() => setSearchAnchorEl(null)}
							anchorEl={searchAnchorEl}
						/> */}
					</Box>

					{/* Filter Button */}
					<Badge
						badgeContent={activeFilterCount}
						color="error"
						invisible={activeFilterCount === 0}
					>
						<IconButton
							size="small"
							onClick={(e) =>
								setFilterAnchorEl(filterAnchorEl ? null : e.currentTarget)
							}
							color={filterAnchorEl ? "primary" : "default"}
						>
							<FilterListIcon />
						</IconButton>
					</Badge>
					<AdvancedFiltersPanel
						filterOptions={filterOptions}
						anchorEl={filterAnchorEl}
						onClose={() => setFilterAnchorEl(null)}
					/>

					{/* Divider */}
					<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

					{/* Commit buttons */}
					{hasUnsavedChanges && (
						<Flex gap={6}>
							<Button
								variant="outlined"
								color="error"
								onClick={discardChanges}
								size="small"
							>
								Отменить
							</Button>
							<Button
								variant="contained"
								color="primary"
								onClick={handleCommitChanges}
								size="small"
							>
								Создать коммит
							</Button>
						</Flex>
					)}

					{/* Initialize new JSON button */}
					<Button
						variant="outlined"
						size="small"
						startIcon={<AddIcon />}
						onClick={handleInitializeGraph}
						disabled={isInitializing}
						title="Инициализация графа"
					>
						{isInitializing ? "Инициализация..." : "Новый JSON"}
					</Button>

					{/* Entity preview navigation */}
					<EntityPreviewNavigationButton />

					{/* Import/Export buttons */}
					<Tooltip title="Импорт JSON из файла">
						<IconButton onClick={handleImport} disabled={!currentGraph}>
							<FileUploadIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Экспорт JSON в файл">
						<IconButton onClick={handleExport}>
							<DownloadIcon />
						</IconButton>
					</Tooltip>

					{/* Refresh button */}
					<Tooltip title="Загрузить текущее состояние">
						<IconButton onClick={handleManualLoad}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Flex>
			</Header>

			{/* FlexLayout Container */}
			<FlexLayoutWrapper>
				<Layout
					model={model}
					factory={factory}
					onAction={onAction}
					realtimeResize
				/>
			</FlexLayoutWrapper>

			{/* Commit Dialog */}
			<CommitDialog
				open={isCommitDialogOpen}
				onClose={handleCommitDialogClose}
			/>
		</Box>
	);
};

// ============================================================================
// Styled Components
// ============================================================================

const FlexLayoutWrapper = styled("div")(({ theme }) => ({
	flex: 1,
	position: "relative",
	"& .flexlayout__layout": {
		backgroundColor: "transparent",
	},
	"& .flexlayout__tab": {
		backgroundColor: theme.vars?.palette?.background.paper,
		color: theme.vars?.palette?.text.primary,
		borderColor: theme.vars?.palette?.divider,
		borderRadius: "8px",
	},
	"& .flexlayout__tabset_header": {
		backgroundColor: theme.vars?.palette?.background.paper,
		borderColor: theme.vars?.palette?.divider,
	},
	"& .flexlayout__tab_button": {
		backgroundColor: "transparent",
		color: theme.vars?.palette?.text.secondary,
		border: "none",
		padding: "5px 0",
		"&:hover": {
			backgroundColor: theme.vars?.palette?.action.hover,
			color: theme.vars?.palette?.text.primary,
		},
	},
	"& .flexlayout__tabset_tabbar_outer": {
		backgroundColor: theme.vars?.palette?.background.paper,
		borderBottom: "1px solid rgb(83 83 83 / 30%)",
	},
	"& .flexlayout__tab_button_selected": {
		backgroundColor: theme.vars?.palette?.action.selected,
		color: theme.vars?.palette?.primary.main,
		fontWeight: 600,
	},
	"& .flexlayout__tabset_content": {
		backgroundColor: theme.vars?.palette?.background.default,
	},
	"& .flexlayout__tabset": {
		borderRadius: "8px",
		border: "1px solid #a5aaba90",
		margin: "4px",
		backgroundColor: theme.vars?.palette?.background.paper,
	},
	"& .flexlayout__splitter": {
		backgroundColor: theme.vars?.palette?.divider,
		borderRadius: "8px",
		width: "4px !important",
		minWidth: "4px !important",
	},
	"& .flexlayout__splitter.flexlayout__splitter_vert": {
		backgroundColor: theme.vars?.palette?.divider,
		height: "4px !important",
		minHeight: "4px !important",
		width: "inherit !important",
		minWidth: "inherit !important",
	},
	"& .flexlayout__splitter_vert": {
		margin: "0 6px",
	},
	"& .flexlayout__splitter_horz": {
		margin: "6px 0",
	},
	"& .flexlayout__tab_button_content": {
		padding: "4px 9px",
		borderRadius: "8px",
		backgroundColor: "#488ecb1a",
	},
}));
