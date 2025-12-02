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
	Modal,
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
import {
	EntityDetailsDialog,
	MappingDetailsDialog,
} from "@react-client/features/entityPreview";
import { Card } from "@react-client/common/muiCustom/Card";

// Connection type for dialogs
interface EntityConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	attrMaps: Array<{ src: string; dst: string }>;
}

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

interface HighlightedAttribute {
	entityId: string;
	attrName: string;
}

interface SelectionState {
	// Selected entity/model/object IDs
	selectedEntityId: string | null;
	selectedGraphId: string | null;
	selectedAttributeName: string | null;

	// Hovered attribute for cross-node highlighting
	hoveredAttribute: HighlightedAttribute | null;
	setHoveredAttribute: (attr: HighlightedAttribute | null) => void;

	// Clicked/selected attribute for persistent cross-node highlighting
	selectedAttribute: HighlightedAttribute | null;
	setSelectedAttribute: (attr: HighlightedAttribute | null) => void;

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
	hoveredAttribute: null,
	setHoveredAttribute: (attr) => set({ hoveredAttribute: attr }),
	selectedAttribute: null,
	setSelectedAttribute: (attr) => set({ selectedAttribute: attr }),
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

interface LinkRow {
	id: string;
	graphId: string;
	sourceEntity: string;
	sourceName: string;
	targetEntity: string;
	targetName: string;
	attrMappingsCount: number;
	attrMaps: Array<{ src: string; dst: string }>;
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
// Objects Panel Component (Attributes/Links Table)
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

	// View mode toggle: "attributes" or "links"
	const [viewMode, setViewMode] = useState<"attributes" | "links">(
		"attributes",
	);

	// State for mapping dialog
	const [selectedLink, setSelectedLink] = useState<LinkRow | null>(null);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);

	// Transform data to object rows (attributes)
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

	// Transform data to link rows (connections)
	const links: LinkRow[] = useMemo(() => {
		if (!jsonDataList) return [];

		const rows: LinkRow[] = [];
		jsonDataList.forEach((item: JsonDataItem) => {
			const schema = item.data as DataLineageSchema | undefined;
			if (!schema) return;

			const entityMap = new Map<string, DataLineageEntity>();
			for (const entity of schema.entities || []) {
				entityMap.set(entity.id, entity);
			}

			(schema.mappings || []).forEach((mapping: DataLineageMapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					const sourceEntity = entityMap.get(dep.entityId);
					const targetEntity = entityMap.get(mapping.entityId);
					if (!sourceEntity || !targetEntity) return;

					const attrMaps = dep.attrMaps || [];
					rows.push({
						id: `${item.id}::${dep.entityId}->${mapping.entityId}`,
						graphId: item.id,
						sourceEntity: dep.entityId,
						sourceName: sourceEntity.name || sourceEntity.id,
						targetEntity: mapping.entityId,
						targetName: targetEntity.name || targetEntity.id,
						attrMappingsCount: attrMaps.length,
						attrMaps,
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

	// Filter links by selected entity and search
	const filteredLinks = useMemo(() => {
		let filtered = links;

		// Filter by selected entity (show links where entity is source or target)
		if (selectedEntityId) {
			filtered = filtered.filter(
				(l) =>
					l.sourceEntity === selectedEntityId ||
					l.targetEntity === selectedEntityId,
			);
		}

		// Filter by search
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(l) =>
					l.sourceName.toLowerCase().includes(q) ||
					l.targetName.toLowerCase().includes(q),
			);
		}

		return filtered;
	}, [links, selectedEntityId, globalSearchQuery]);

	// Navigate to object page
	const handleNavigateToObject = useCallback(
		(data: ObjectRow) => {
			const objectId = encodeURIComponent(data.id);
			navigate(`/objects/${objectId}`);
		},
		[navigate],
	);

	// Handle link click to open mapping dialog
	const handleLinkClick = useCallback((link: LinkRow) => {
		setSelectedLink(link);
		setIsMappingDialogOpen(true);
	}, []);

	// Column definitions for attributes
	const attributeColumnDefs: ColDef<ObjectRow>[] = useMemo(
		() => [
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
		[],
	);

	// Column definitions for links
	const linkColumnDefs: ColDef<LinkRow>[] = useMemo(
		() => [
			{
				field: "sourceName",
				headerName: "Источник",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				headerName: "",
				width: 50,
				cellRenderer: () => (
					<Typography color="text.secondary" sx={{ textAlign: "center" }}>
						→
					</Typography>
				),
				sortable: false,
				filter: false,
			},
			{
				field: "targetName",
				headerName: "Цель",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				field: "attrMappingsCount",
				headerName: "Маппинги",
				width: 100,
				cellRenderer: ({ value }: { value: number }) => (
					<Chip
						label={value}
						size="small"
						color={value > 0 ? "primary" : "default"}
						variant="outlined"
					/>
				),
			},
		],
		[],
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

	const handleLinkRowClicked = useCallback(
		(event: RowClickedEvent<LinkRow>) => {
			if (event.data) {
				handleLinkClick(event.data);
			}
		},
		[handleLinkClick],
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

	// Convert LinkRow to EntityConnection for MappingDetailsDialog
	const selectedConnection: EntityConnection | null = selectedLink
		? {
				id: selectedLink.id,
				sourceId: selectedLink.sourceEntity,
				targetId: selectedLink.targetEntity,
				sourceName: selectedLink.sourceName,
				targetName: selectedLink.targetName,
				attrMaps: selectedLink.attrMaps,
			}
		: null;

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header with toggle and info */}
			<Box
				sx={{
					p: 1,
					bgcolor: "action.hover",
					borderBottom: 1,
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					gap: 2,
				}}
			>
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={viewMode === "links"}
							onChange={(e) =>
								setViewMode(e.target.checked ? "links" : "attributes")
							}
						/>
					}
					label={
						<Typography variant="caption">
							{viewMode === "links" ? "Связи" : "Атрибуты"}
						</Typography>
					}
					sx={{ m: 0 }}
				/>
				{selectedEntityId && (
					<Typography variant="caption" color="text.secondary">
						Фильтр: <strong>{selectedEntityId}</strong>
					</Typography>
				)}
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ ml: "auto" }}
				>
					{viewMode === "attributes"
						? `${filteredObjects.length} объектов`
						: `${filteredLinks.length} связей`}
				</Typography>
			</Box>

			{/* Table content */}
			<Box sx={{ flex: 1 }}>
				{viewMode === "attributes" ? (
					<AgGridReact
						rowData={filteredObjects}
						columnDefs={attributeColumnDefs}
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
				) : (
					<AgGridReact
						rowData={filteredLinks}
						columnDefs={linkColumnDefs}
						theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
						onRowClicked={handleLinkRowClicked}
						rowSelection="single"
						suppressCellFocus
						animateRows
						rowHeight={28}
						headerHeight={32}
					/>
				)}
			</Box>

			{/* Mapping Details Dialog */}
			{selectedConnection && (
				<MappingDetailsDialog
					open={isMappingDialogOpen}
					onClose={() => {
						setIsMappingDialogOpen(false);
						setSelectedLink(null);
					}}
					connection={selectedConnection}
				/>
			)}
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
const MAX_VISIBLE_ATTRS = 50;

interface EntityNodeData {
	entity: DataLineageEntity;
	highlightType: "none" | "selected" | "upstream" | "downstream";
	onNodeClick: (id: string) => void;
	onNodeDoubleClick: (id: string, graphId: string) => void;
	onAttrHover: (entityId: string, attrName: string | null) => void;
	onAttrClick: (entityId: string, attrName: string) => void;
	graphId: string;
	upstreamCount: number;
	downstreamCount: number;
	highlightedSourceAttrs?: Set<string>;
	highlightedTargetAttrs?: Set<string>;
	// Attributes highlighted due to hover on connected node
	hoverHighlightedAttrs?: Set<string>;
	// Attributes highlighted due to click/selection on connected node
	selectedHighlightedAttrs?: Set<string>;
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
		onAttrHover,
		onAttrClick,
		graphId,
		upstreamCount,
		downstreamCount,
		highlightedSourceAttrs = new Set<string>(),
		highlightedTargetAttrs = new Set<string>(),
		hoverHighlightedAttrs = new Set<string>(),
		selectedHighlightedAttrs = new Set<string>(),
	} = data;
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
	const attrs = entity.attrSeq || [];

	// Show only related attributes (those that have mappings), limited by MAX_VISIBLE_ATTRS
	const relatedAttrNames = new Set([
		...highlightedSourceAttrs,
		...highlightedTargetAttrs,
	]);
	const allRelatedAttrs = attrs.filter((attr) =>
		relatedAttrNames.has(attr.name),
	);
	const visibleAttrs = allRelatedAttrs.slice(0, MAX_VISIBLE_ATTRS);
	const moreCount = allRelatedAttrs.length - visibleAttrs.length;

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
						{visibleAttrs.length}/{attrs.length} атр.
					</span>
				</div>
			</div>

			{/* Related attributes */}
			{visibleAttrs.length > 0 && (
				<div onMouseLeave={() => onAttrHover(id, null)}>
					{visibleAttrs.map((attr, idx) => {
						const isSourceHighlighted = highlightedSourceAttrs.has(attr.name);
						const isTargetHighlighted = highlightedTargetAttrs.has(attr.name);
						const isHoverHighlighted = hoverHighlightedAttrs.has(attr.name);
						const isSelectedHighlighted = selectedHighlightedAttrs.has(
							attr.name,
						);
						const isHighlighted = isHoverHighlighted || isSelectedHighlighted;
						return (
							<div
								key={attr.name}
								onMouseEnter={() => onAttrHover(id, attr.name)}
								onClick={(e) => {
									e.stopPropagation();
									onAttrClick(id, attr.name);
								}}
								style={{
									display: "flex",
									justifyContent: "space-between",
									padding: "3px 12px",
									fontSize: 10,
									borderBottom:
										idx < visibleAttrs.length - 1
											? "1px solid #f5f5f5"
											: "none",
									background: isSelectedHighlighted
										? `${HIGHLIGHT_COLORS.selected}70`
										: isHoverHighlighted
											? `${HIGHLIGHT_COLORS.selected}30`
											: idx % 2 === 0
												? "#fafafa"
												: "#fff",
									position: "relative",
									cursor: "pointer",
									transition: "background 0.15s ease",
								}}
							>
								{/* Target handle for this attribute */}
								<Handle
									type="target"
									position={Position.Left}
									id={`attr-target-${attr.name}`}
									style={{
										background:
											isTargetHighlighted || isHighlighted
												? HIGHLIGHT_COLORS.selected
												: colors.border,
										width: isHighlighted ? 8 : 6,
										height: isHighlighted ? 8 : 6,
										left: -3,
										border: "1px solid #fff",
										transition: "all 0.15s ease",
									}}
								/>
								<span
									style={{
										color: isHighlighted ? "#333" : "#555",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										flex: 1,
										fontWeight: isHighlighted ? 600 : 400,
									}}
								>
									{attr.name}
								</span>
								<span style={{ color: "#999", marginLeft: 8, fontSize: 9 }}>
									{attr.type}
								</span>
								{/* Source handle for this attribute */}
								<Handle
									type="source"
									position={Position.Right}
									id={`attr-source-${attr.name}`}
									style={{
										background:
											isSourceHighlighted || isHighlighted
												? HIGHLIGHT_COLORS.selected
												: colors.border,
										width: isHighlighted ? 8 : 6,
										height: isHighlighted ? 8 : 6,
										right: -3,
										border: "1px solid #fff",
										transition: "all 0.15s ease",
									}}
								/>
							</div>
						);
					})}
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

			{/* Main entity-level handles (fallback when no attribute mapping) */}
			<Handle
				type="target"
				position={Position.Left}
				id="entity-target"
				style={{
					background: colors.border,
					width: 10,
					height: 10,
					border: "2px solid #fff",
					top: 30,
				}}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="entity-source"
				style={{
					background: colors.border,
					width: 10,
					height: 10,
					border: "2px solid #fff",
					top: 30,
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
		// Calculate visible attrs count from related attributes (source + target), limited by MAX_VISIBLE_ATTRS
		const sourceAttrs = node.data.highlightedSourceAttrs || new Set();
		const targetAttrs = node.data.highlightedTargetAttrs || new Set();
		const relatedAttrsCount = new Set([...sourceAttrs, ...targetAttrs]).size;
		const visibleAttrsCount = Math.min(relatedAttrsCount, MAX_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrsCount * ATTR_ROW_HEIGHT +
			(relatedAttrsCount > MAX_VISIBLE_ATTRS ? 24 : 0);
		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});
	dagre.layout(dagreGraph);

	return {
		nodes: nodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			const sourceAttrs = node.data.highlightedSourceAttrs || new Set();
			const targetAttrs = node.data.highlightedTargetAttrs || new Set();
			const relatedAttrsCount = new Set([...sourceAttrs, ...targetAttrs]).size;
			const visibleAttrsCount = Math.min(relatedAttrsCount, MAX_VISIBLE_ATTRS);
			const height =
				NODE_HEADER_HEIGHT +
				visibleAttrsCount * ATTR_ROW_HEIGHT +
				(relatedAttrsCount > MAX_VISIBLE_ATTRS ? 24 : 0);
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
	onEdgeClick?: (sourceId: string, targetId: string) => void;
}

const GraphPanelInner = memo<GraphPanelInnerProps>(
	({
		data,
		graphId,
		selectedEntityId,
		onSelectEntity,
		onNodeDoubleClick,
		onUpstreamDownstreamChange,
		onEdgeClick,
	}) => {
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
		// Graph mode: "entities" = compact (entity-level edges), "attributes" = detailed (attribute-level edges)
		const [graphMode, setGraphMode] = useState<"entities" | "attributes">(
			"attributes",
		);
		const { fitView } = useReactFlow();
		const {
			hoveredAttribute,
			setHoveredAttribute,
			selectedAttribute,
			setSelectedAttribute,
		} = useDashboardStore();

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

		// Handle edge click to show mapping details
		const handleEdgeClick = useCallback(
			(_event: React.MouseEvent, edge: Edge) => {
				if (onEdgeClick && edge.source && edge.target) {
					onEdgeClick(edge.source, edge.target);
				}
			},
			[onEdgeClick],
		);

		const handleAttrHover = useCallback(
			(entityId: string, attrName: string | null) => {
				if (attrName) {
					setHoveredAttribute({ entityId, attrName });
				} else {
					setHoveredAttribute(null);
				}
			},
			[setHoveredAttribute],
		);

		const handleAttrClick = useCallback(
			(entityId: string, attrName: string) => {
				// Toggle selection: if clicking same attribute, deselect; otherwise select new one
				if (
					selectedAttribute?.entityId === entityId &&
					selectedAttribute?.attrName === attrName
				) {
					setSelectedAttribute(null);
				} else {
					setSelectedAttribute({ entityId, attrName });
				}
			},
			[selectedAttribute, setSelectedAttribute],
		);

		// Build attribute connection map for hover highlighting
		// Maps "entityId::attrName" -> Set of connected "entityId::attrName"
		const attrConnectionMap = useMemo(() => {
			const connections = new Map<string, Set<string>>();
			(data.mappings || []).forEach((mapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					if (!dep.attrMaps) return;
					dep.attrMaps.forEach((attrMap) => {
						const sourceKey = `${dep.entityId}::${attrMap.src}`;
						const targetKey = `${mapping.entityId}::${attrMap.dst}`;
						// Source -> Target
						if (!connections.has(sourceKey)) {
							connections.set(sourceKey, new Set());
						}
						connections.get(sourceKey)!.add(targetKey);
						// Target -> Source (bidirectional for highlighting)
						if (!connections.has(targetKey)) {
							connections.set(targetKey, new Set());
						}
						connections.get(targetKey)!.add(sourceKey);
					});
				});
			});
			return connections;
		}, [data.mappings]);

		// Compute hover-highlighted attributes for each entity
		const hoverHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (!hoveredAttribute) return result;

			const hoveredKey = `${hoveredAttribute.entityId}::${hoveredAttribute.attrName}`;
			const connectedAttrs = attrConnectionMap.get(hoveredKey);

			// Highlight the hovered attribute itself
			if (!result.has(hoveredAttribute.entityId)) {
				result.set(hoveredAttribute.entityId, new Set());
			}
			result.get(hoveredAttribute.entityId)!.add(hoveredAttribute.attrName);

			// Highlight connected attributes
			if (connectedAttrs) {
				connectedAttrs.forEach((key) => {
					const [entityId, attrName] = key.split("::");
					if (!result.has(entityId)) {
						result.set(entityId, new Set());
					}
					result.get(entityId)!.add(attrName);
				});
			}
			return result;
		}, [hoveredAttribute, attrConnectionMap]);

		// Compute selected/clicked-highlighted attributes for each entity
		const selectedHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (!selectedAttribute) return result;

			const selectedKey = `${selectedAttribute.entityId}::${selectedAttribute.attrName}`;
			const connectedAttrs = attrConnectionMap.get(selectedKey);

			// Highlight the selected attribute itself
			if (!result.has(selectedAttribute.entityId)) {
				result.set(selectedAttribute.entityId, new Set());
			}
			result.get(selectedAttribute.entityId)!.add(selectedAttribute.attrName);

			// Highlight connected attributes
			if (connectedAttrs) {
				connectedAttrs.forEach((key) => {
					const [entityId, attrName] = key.split("::");
					if (!result.has(entityId)) {
						result.set(entityId, new Set());
					}
					result.get(entityId)!.add(attrName);
				});
			}
			return result;
		}, [selectedAttribute, attrConnectionMap]);

		// Create nodes and edges
		const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
			// Deduplicate entities by ID (keep first occurrence)
			const seenEntityIds = new Set<string>();
			const uniqueEntities: DataLineageEntity[] = [];
			for (const entity of data.entities || []) {
				if (!entity.id) {
					console.warn(
						"[Graph] Entity with null/undefined ID skipped:",
						entity,
					);
					continue;
				}
				if (seenEntityIds.has(entity.id)) {
					console.warn("[Graph] Duplicate entity ID skipped:", entity.id);
					continue;
				}
				seenEntityIds.add(entity.id);
				uniqueEntities.push(entity);
			}

			const entityMap = new Map<string, DataLineageEntity>();
			for (const entity of uniqueEntities) entityMap.set(entity.id, entity);

			// Build attribute-level highlight maps for each entity
			// Maps entity ID -> Set of source/target attr names that have edges
			const entitySourceAttrs = new Map<string, Set<string>>();
			const entityTargetAttrs = new Map<string, Set<string>>();

			// Process mappings to find all attribute connections
			(data.mappings || []).forEach((mapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					if (!dep.attrMaps || dep.attrMaps.length === 0) return;
					dep.attrMaps.forEach((attrMap) => {
						// Source entity has this attr as source
						if (!entitySourceAttrs.has(dep.entityId)) {
							entitySourceAttrs.set(dep.entityId, new Set());
						}
						entitySourceAttrs.get(dep.entityId)!.add(attrMap.src);

						// Target entity has this attr as target
						if (!entityTargetAttrs.has(mapping.entityId)) {
							entityTargetAttrs.set(mapping.entityId, new Set());
						}
						entityTargetAttrs.get(mapping.entityId)!.add(attrMap.dst);
					});
				});
			});

			const nodes: EntityNode[] = uniqueEntities.map((entity) => {
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
						onAttrHover: handleAttrHover,
						onAttrClick: handleAttrClick,
						graphId,
						upstreamCount: upstreamCounts.get(entity.id) || 0,
						downstreamCount: downstreamCounts.get(entity.id) || 0,
						highlightedSourceAttrs:
							entitySourceAttrs.get(entity.id) || new Set<string>(),
						highlightedTargetAttrs:
							entityTargetAttrs.get(entity.id) || new Set<string>(),
						hoverHighlightedAttrs:
							hoverHighlightedByEntity.get(entity.id) || new Set<string>(),
						selectedHighlightedAttrs:
							selectedHighlightedByEntity.get(entity.id) || new Set<string>(),
					},
				};
			});

			// Build a map of all attributes each entity actually has
			const entityAttrNames = new Map<string, Set<string>>();
			for (const entity of uniqueEntities) {
				const attrNames = new Set((entity.attrSeq || []).map((a) => a.name));
				entityAttrNames.set(entity.id, attrNames);
			}

			// Build a map of actually visible attributes per entity (respecting MAX_VISIBLE_ATTRS)
			const visibleAttrsPerEntity = new Map<string, Set<string>>();
			for (const entity of uniqueEntities) {
				const sourceAttrs = entitySourceAttrs.get(entity.id) || new Set();
				const targetAttrs = entityTargetAttrs.get(entity.id) || new Set();
				const relatedAttrNames = new Set([...sourceAttrs, ...targetAttrs]);
				const attrs = entity.attrSeq || [];
				const allRelatedAttrs = attrs.filter((attr) =>
					relatedAttrNames.has(attr.name),
				);
				const visibleAttrs = allRelatedAttrs
					.slice(0, MAX_VISIBLE_ATTRS)
					.map((a) => a.name);
				visibleAttrsPerEntity.set(entity.id, new Set(visibleAttrs));
			}

			const edges: Edge[] = [];
			const edgeSet = new Set<string>();

			(data.mappings || []).forEach((mapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					// Skip if source or target entity doesn't exist in graph
					if (!dep.entityId || !mapping.entityId) {
						console.warn(
							"[Graph] Mapping with null entityId skipped:",
							dep.entityId,
							"->",
							mapping.entityId,
						);
						return;
					}
					if (
						!entityMap.has(dep.entityId) ||
						!entityMap.has(mapping.entityId)
					) {
						// Entity referenced in mapping but not in entities list
						return;
					}

					// Determine edge highlight type based on upstream/downstream relationship
					// Edge goes from dep.entityId (source) -> mapping.entityId (target)
					let edgeHighlightType: "none" | "upstream" | "downstream" = "none";

					if (dep.entityId === selectedEntityId) {
						// Source is selected -> edge goes downstream
						edgeHighlightType = "downstream";
					} else if (mapping.entityId === selectedEntityId) {
						// Target is selected -> edge comes from upstream
						edgeHighlightType = "upstream";
					} else if (
						upstreamNodes.has(dep.entityId) &&
						upstreamNodes.has(mapping.entityId)
					) {
						// Both source and target are upstream
						edgeHighlightType = "upstream";
					} else if (
						downstreamNodes.has(dep.entityId) &&
						downstreamNodes.has(mapping.entityId)
					) {
						// Both source and target are downstream
						edgeHighlightType = "downstream";
					}

					const isEntityHighlighted = edgeHighlightType !== "none";
					const edgeHighlightColor =
						edgeHighlightType === "upstream"
							? HIGHLIGHT_COLORS.upstream
							: edgeHighlightType === "downstream"
								? HIGHLIGHT_COLORS.downstream
								: "#b1b1b7";

					// In "entities" mode: always use entity-level edges
					// In "attributes" mode: use attribute-level edges when available
					if (
						graphMode === "attributes" &&
						dep.attrMaps &&
						dep.attrMaps.length > 0
					) {
						const sourceVisibleAttrs =
							visibleAttrsPerEntity.get(dep.entityId) || new Set();
						const targetVisibleAttrs =
							visibleAttrsPerEntity.get(mapping.entityId) || new Set();

						dep.attrMaps.forEach((attrMap, attrIdx) => {
							const edgeId = `${dep.entityId}::${attrMap.src}->${mapping.entityId}::${attrMap.dst}`;
							if (edgeSet.has(edgeId)) return;
							edgeSet.add(edgeId);

							// Check if entity actually has the attribute AND it's visible
							const srcEntityHasAttr =
								entityAttrNames.get(dep.entityId)?.has(attrMap.src) ?? false;
							const dstEntityHasAttr =
								entityAttrNames.get(mapping.entityId)?.has(attrMap.dst) ??
								false;
							const srcVisible =
								srcEntityHasAttr && sourceVisibleAttrs.has(attrMap.src);
							const dstVisible =
								dstEntityHasAttr && targetVisibleAttrs.has(attrMap.dst);

							// Use entity-level handles if attributes aren't visible
							const sourceHandle = srcVisible
								? `attr-source-${attrMap.src}`
								: "entity-source";
							const targetHandle = dstVisible
								? `attr-target-${attrMap.dst}`
								: "entity-target";

							// Use different colors for attribute edges
							const attrColors = [
								"#2196f3",
								"#4caf50",
								"#ff9800",
								"#9c27b0",
								"#00bcd4",
								"#e91e63",
							];
							const edgeColor = isEntityHighlighted
								? edgeHighlightColor
								: attrColors[attrIdx % attrColors.length];

							edges.push({
								id: edgeId,
								source: dep.entityId,
								target: mapping.entityId,
								sourceHandle,
								targetHandle,
								type: "smoothstep",
								animated: isEntityHighlighted,
								style: {
									stroke: edgeColor,
									strokeWidth: isEntityHighlighted ? 2 : 1.5,
									opacity: 0.8,
								},
								markerEnd: {
									type: MarkerType.ArrowClosed,
									color: edgeColor,
									width: 12,
									height: 12,
								},
								// Show label if either attribute is not visible
								label:
									!srcVisible || !dstVisible
										? `${attrMap.src} → ${attrMap.dst}`
										: undefined,
								labelStyle: { fontSize: 8, fill: "#666" },
								labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
							});
						});
					} else {
						// Entity-level edge (used in "entities" mode or when no attribute mappings)
						const edgeId = `${dep.entityId}->${mapping.entityId}`;
						if (edgeSet.has(edgeId)) return;
						edgeSet.add(edgeId);

						// Count attribute mappings for label
						const attrCount = dep.attrMaps?.length || 0;

						edges.push({
							id: edgeId,
							source: dep.entityId,
							target: mapping.entityId,
							sourceHandle: "entity-source",
							targetHandle: "entity-target",
							type: "smoothstep",
							animated: isEntityHighlighted,
							style: {
								stroke: edgeHighlightColor,
								strokeWidth: isEntityHighlighted ? 2 : 1,
							},
							markerEnd: {
								type: MarkerType.ArrowClosed,
								color: edgeHighlightColor,
							},
							// Show mapping count in entities mode
							label:
								graphMode === "entities" && attrCount > 0
									? `${attrCount} маппингов`
									: undefined,
							labelStyle: { fontSize: 9, fill: "#666" },
							labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
						});
					}
				});
			});

			return { nodes, edges };
		}, [
			data,
			graphId,
			graphMode,
			selectedEntityId,
			upstreamNodes,
			downstreamNodes,
			handleNodeClick,
			handleNodeDblClick,
			handleAttrHover,
			handleAttrClick,
			upstreamCounts,
			downstreamCounts,
			hoverHighlightedByEntity,
			selectedHighlightedByEntity,
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
				onEdgeClick={handleEdgeClick}
				nodeTypes={graphNodeTypes}
				nodesDraggable={false}
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
						<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
								{layoutDirection === "LR" ? "↔ Гориз." : "↕ Верт."}
							</button>
							<button
								onClick={() =>
									setGraphMode(
										graphMode === "entities" ? "attributes" : "entities",
									)
								}
								style={{
									padding: "6px 12px",
									border: "1px solid #ddd",
									borderRadius: 6,
									background: graphMode === "attributes" ? "#e3f2fd" : "#fff",
									cursor: "pointer",
									fontSize: 11,
								}}
								title={
									graphMode === "attributes"
										? "Показаны связи атрибутов"
										: "Показаны связи объектов"
								}
							>
								{graphMode === "attributes" ? "🔗 Атрибуты" : "📦 Объекты"}
							</button>
						</div>
					</div>
				</Panel>
				{/* <Panel position="bottom-left">
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
				</Panel> */}
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
	const navigate = useNavigate();

	// Dialog state
	const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
	const [dialogEntity, setDialogEntity] = useState<DataLineageEntity | null>(
		null,
	);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
	const [selectedConnection, setSelectedConnection] =
		useState<EntityConnection | null>(null);

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

	// Build connections for dialogs
	const entityConnections = useMemo(() => {
		if (!currentSchema) return [];
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, DataLineageEntity>();
		for (const e of currentSchema.entities || []) {
			entityMap.set(e.id, e);
		}

		(currentSchema.mappings || []).forEach((mapping) => {
			if (!mapping.deps) return;
			mapping.deps.forEach((dep) => {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) return;

				connections.push({
					id: `${dep.entityId}->${mapping.entityId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name || sourceEntity.id,
					targetName: targetEntity.name || targetEntity.id,
					attrMaps: dep.attrMaps || [],
				});
			});
		});
		return connections;
	}, [currentSchema]);

	const handleSelectEntity = useCallback(
		(id: string | null) => selectEntity(id, effectiveGraphId),
		[selectEntity, effectiveGraphId],
	);

	const handleNodeDoubleClick = useCallback(
		(entityId: string, _graphId: string) => {
			const entity = currentSchema?.entities?.find((e) => e.id === entityId);
			if (entity) {
				setDialogEntity(entity);
				setIsEntityDialogOpen(true);
			}
		},
		[currentSchema],
	);

	const handleOpenEntity = useCallback(
		(entityId: string) => {
			const encodedId = encodeURIComponent(entityId);
			navigate(`/entity/${encodedId}`);
		},
		[navigate],
	);

	const handleOpenConnection = useCallback((connection: EntityConnection) => {
		setSelectedConnection(connection);
		setIsMappingDialogOpen(true);
	}, []);

	// Handle edge click in graph to show mapping details
	const handleEdgeClick = useCallback(
		(sourceId: string, targetId: string) => {
			const connection = entityConnections.find(
				(c) => c.sourceId === sourceId && c.targetId === targetId,
			);
			if (connection) {
				setSelectedConnection(connection);
				setIsMappingDialogOpen(true);
			}
		},
		[entityConnections],
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
					onEdgeClick={handleEdgeClick}
				/>
			</ReactFlowProvider>

			{/* Entity Details Dialog */}
			{dialogEntity && (
				<EntityDetailsDialog
					open={isEntityDialogOpen}
					onClose={() => {
						setIsEntityDialogOpen(false);
						setDialogEntity(null);
					}}
					entity={dialogEntity}
					connections={entityConnections.filter(
						(c) =>
							c.sourceId === dialogEntity.id || c.targetId === dialogEntity.id,
					)}
					onOpenEntity={handleOpenEntity}
					onOpenConnection={handleOpenConnection}
				/>
			)}

			{/* Mapping Details Dialog */}
			{selectedConnection && (
				<MappingDetailsDialog
					open={isMappingDialogOpen}
					onClose={() => {
						setIsMappingDialogOpen(false);
						setSelectedConnection(null);
					}}
					connection={selectedConnection}
				/>
			)}
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
// Debug Panel - Graph Analysis
// ============================================================================

interface DebugIssue {
	type: "error" | "warning";
	category: string;
	message: string;
	location: string;
	details?: string;
}

// JSON Schema type for inferred schema
type JsonSchemaType =
	| { type: "null" }
	| { type: "boolean" }
	| { type: "integer" }
	| { type: "number" }
	| { type: "string" }
	| { type: "array"; items: JsonSchemaType }
	| { type: "object"; properties: Record<string, JsonSchemaType> }
	| { type: "mixed"; types: string[] };

// Infer JSON schema from a value by analyzing its structure
function inferJsonSchema(value: unknown, maxDepth = 5): JsonSchemaType {
	if (maxDepth <= 0) {
		return { type: "object", properties: {} };
	}

	if (value === null || value === undefined) {
		return { type: "null" };
	}

	if (typeof value === "boolean") {
		return { type: "boolean" };
	}

	if (typeof value === "number") {
		return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
	}

	if (typeof value === "string") {
		return { type: "string" };
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return { type: "array", items: { type: "null" } };
		}
		// Merge schemas from all array items
		const itemSchemas = value
			.slice(0, 10)
			.map((item) => inferJsonSchema(item, maxDepth - 1));
		const mergedItems = mergeSchemas(itemSchemas);
		return { type: "array", items: mergedItems };
	}

	if (typeof value === "object") {
		const properties: Record<string, JsonSchemaType> = {};
		for (const [key, val] of Object.entries(value)) {
			properties[key] = inferJsonSchema(val, maxDepth - 1);
		}
		return { type: "object", properties };
	}

	return { type: "string" };
}

// Merge multiple schemas into one (for array items)
function mergeSchemas(schemas: JsonSchemaType[]): JsonSchemaType {
	if (schemas.length === 0) return { type: "null" };
	if (schemas.length === 1) return schemas[0];

	const types = new Set<string>();
	const allProperties: Record<string, JsonSchemaType[]> = {};
	const arrayItems: JsonSchemaType[] = [];

	for (const schema of schemas) {
		types.add(schema.type);
		if (schema.type === "object" && "properties" in schema) {
			for (const [key, val] of Object.entries(schema.properties)) {
				if (!allProperties[key]) allProperties[key] = [];
				allProperties[key].push(val);
			}
		}
		if (schema.type === "array" && "items" in schema) {
			arrayItems.push(schema.items);
		}
	}

	// If all same type
	if (types.size === 1) {
		const type = schemas[0].type;
		if (type === "object") {
			const mergedProps: Record<string, JsonSchemaType> = {};
			for (const [key, vals] of Object.entries(allProperties)) {
				mergedProps[key] = mergeSchemas(vals);
			}
			return { type: "object", properties: mergedProps };
		}
		if (type === "array" && arrayItems.length > 0) {
			return { type: "array", items: mergeSchemas(arrayItems) };
		}
		return schemas[0];
	}

	return { type: "mixed", types: [...types] };
}

// Format schema as readable JSON string
function formatSchema(schema: JsonSchemaType, indent = 0): string {
	const pad = "  ".repeat(indent);
	const pad1 = "  ".repeat(indent + 1);

	if (schema.type === "object" && "properties" in schema) {
		const props = Object.entries(schema.properties);
		if (props.length === 0) return `${pad}{ "type": "object" }`;
		const propsStr = props
			.map(([key, val]) => {
				if (val.type === "object" || val.type === "array") {
					return `${pad1}"${key}": {\n${formatSchema(val, indent + 2)}\n${pad1}}`;
				}
				return `${pad1}"${key}": { "type": "${val.type}"${val.type === "mixed" && "types" in val ? `, "types": [${val.types.map((t) => `"${t}"`).join(", ")}]` : ""} }`;
			})
			.join(",\n");
		return `${pad}"type": "object",\n${pad}"properties": {\n${propsStr}\n${pad}}`;
	}

	if (schema.type === "array" && "items" in schema) {
		if (schema.items.type === "object" || schema.items.type === "array") {
			return `${pad}"type": "array",\n${pad}"items": {\n${formatSchema(schema.items, indent + 1)}\n${pad}}`;
		}
		return `${pad}"type": "array",\n${pad}"items": { "type": "${schema.items.type}" }`;
	}

	if (schema.type === "mixed" && "types" in schema) {
		return `${pad}"type": "mixed",\n${pad}"types": [${schema.types.map((t) => `"${t}"`).join(", ")}]`;
	}

	return `${pad}"type": "${schema.type}"`;
}

// Shared hook for graph analysis (used by both IssuesPanel and SchemaPanel)
// If graphId is provided, only analyze that specific graph
function useGraphAnalysis(graphId?: string | null) {
	const { data: jsonDataList } = useJsonDataList();

	return useMemo(() => {
		const issues: DebugIssue[] = [];
		const seenIssues = new Set<string>(); // For deduplication

		const addIssue = (issue: DebugIssue) => {
			const key = `${issue.type}:${issue.category}:${issue.message}:${issue.location}`;
			if (!seenIssues.has(key)) {
				seenIssues.add(key);
				issues.push(issue);
			}
		};

		if (!jsonDataList) return { issues, schema: { type: "null" as const } };

		// Deduplicate jsonDataList by item.id
		const seenGraphIds = new Set<string>();
		let uniqueJsonDataList = jsonDataList.filter((item) => {
			if (seenGraphIds.has(item.id)) {
				return false;
			}
			seenGraphIds.add(item.id);
			return true;
		});

		// If graphId is specified, filter to only that graph
		if (graphId) {
			uniqueJsonDataList = uniqueJsonDataList.filter(
				(item) => item.id === graphId,
			);
		}

		uniqueJsonDataList.forEach((item: JsonDataItem, graphIdx: number) => {
			const graphData = item.data as DataLineageSchema | undefined;
			if (!graphData) {
				addIssue({
					type: "error",
					category: "Graph",
					message: "Graph data is null/undefined",
					location: `Graph #${graphIdx} (${item.id})`,
				});
				return;
			}

			const entities = graphData.entities || [];
			const mappings = graphData.mappings || [];

			// Track seen IDs for duplicates
			const seenEntityIds = new Map<string, number[]>();
			const entityAttrMap = new Map<string, Set<string>>();

			// Analyze entities
			entities.forEach((entity, entityIdx) => {
				// Check for null/undefined ID
				if (!entity.id) {
					addIssue({
						type: "error",
						category: "Entity ID",
						message: "Entity has null/undefined ID",
						location: `Graph "${item.id}" → entities[${entityIdx}]`,
						details: JSON.stringify(entity, null, 2).slice(0, 200),
					});
					return;
				}

				// Check for duplicate IDs
				if (seenEntityIds.has(entity.id)) {
					addIssue({
						type: "error",
						category: "Дубли",
						message: `Entity ID "${entity.id}" appears ${seenEntityIds.get(entity.id)!.length} times`,
						location: `Graph "${item.id}"`,
						details: `Indices: ${seenEntityIds.get(entity.id)!.join(", ")}`,
					});
					seenEntityIds.get(entity.id)!.push(entityIdx);
				} else {
					seenEntityIds.set(entity.id, [entityIdx]);
				}

				// Track attributes for this entity
				const attrNames = new Set<string>();
				const seenAttrNames = new Map<string, number[]>();

				(entity.attrSeq || []).forEach((attr, attrIdx) => {
					if (!attr.name) {
						addIssue({
							type: "warning",
							category: "Attribute",
							message: "Attribute has null/undefined name",
							location: `Graph "${item.id}" → entities[${entityIdx}] "${entity.id}" → attrSeq[${attrIdx}]`,
						});
						return;
					}

					if (seenAttrNames.has(attr.name)) {
						seenAttrNames.get(attr.name)!.push(attrIdx);
					} else {
						seenAttrNames.set(attr.name, [attrIdx]);
					}
					attrNames.add(attr.name);
				});

				// Report duplicate attributes
				seenAttrNames.forEach((indices, attrName) => {
					if (indices.length > 1) {
						addIssue({
							type: "warning",
							category: "Duplicate Attribute",
							message: `Attribute "${attrName}" appears ${indices.length} times`,
							location: `Graph "${item.id}" → entities[${entityIdx}] "${entity.id}"`,
							details: `Indices: ${indices.join(", ")}`,
						});
					}
				});

				entityAttrMap.set(entity.id, attrNames);
			});

			// Report duplicate entity IDs
			seenEntityIds.forEach((indices, entityId) => {
				if (indices.length > 1) {
					addIssue({
						type: "error",
						category: "Дубли",
						message: `Entity ID "${entityId}" appears ${indices.length} times`,
						location: `Graph "${item.id}"`,
						details: `Indices: ${indices.join(", ")}`,
					});
				}
			});

			// Analyze mappings
			mappings.forEach((mapping, mappingIdx) => {
				if (!mapping.entityId) {
					addIssue({
						type: "error",
						category: "Mapping",
						message: "Mapping has null/undefined entityId",
						location: `Graph "${item.id}" → mappings[${mappingIdx}]`,
					});
					return;
				}

				// Check if target entity exists
				if (!seenEntityIds.has(mapping.entityId)) {
					addIssue({
						type: "warning",
						category: "Orphan Mapping",
						message: `Mapping target entity "${mapping.entityId}" not in entities list`,
						location: `Graph "${item.id}" → mappings[${mappingIdx}]`,
					});
				}

				(mapping.deps || []).forEach((dep, depIdx) => {
					if (!dep.entityId) {
						addIssue({
							type: "error",
							category: "Dependency",
							message: "Dependency has null/undefined entityId",
							location: `Graph "${item.id}" → mappings[${mappingIdx}] → deps[${depIdx}]`,
						});
						return;
					}

					// Check if source entity exists
					if (!seenEntityIds.has(dep.entityId)) {
						addIssue({
							type: "warning",
							category: "Orphan Dependency",
							message: `Dependency source entity "${dep.entityId}" not in entities list`,
							location: `Graph "${item.id}" → mappings[${mappingIdx}] → deps[${depIdx}]`,
						});
					}

					// Check attribute mappings
					(dep.attrMaps || []).forEach((attrMap, attrMapIdx) => {
						const srcEntityAttrs = entityAttrMap.get(dep.entityId);
						const dstEntityAttrs = entityAttrMap.get(mapping.entityId);

						if (srcEntityAttrs && !srcEntityAttrs.has(attrMap.src)) {
							addIssue({
								type: "warning",
								category: "Отсутствует источник",
								message: `Source attr "${attrMap.src}" not in entity "${dep.entityId}"`,
								location: `Graph "${item.id}" → mappings[${mappingIdx}] → deps[${depIdx}] → attrMaps[${attrMapIdx}]`,
							});
						}

						if (dstEntityAttrs && !dstEntityAttrs.has(attrMap.dst)) {
							addIssue({
								type: "warning",
								category: "Missing Target Attr",
								message: `Target attr "${attrMap.dst}" not in entity "${mapping.entityId}"`,
								location: `Graph "${item.id}" → mappings[${mappingIdx}] → deps[${depIdx}] → attrMaps[${attrMapIdx}]`,
							});
						}
					});
				});
			});
		});

		// Infer unified schema from all graphs (use deduplicated list)
		const allGraphData = uniqueJsonDataList
			.map((item) => item.data)
			.filter(Boolean);
		const unifiedSchema =
			allGraphData.length > 0
				? inferJsonSchema(allGraphData[0], 6)
				: { type: "null" as const };

		return { issues, schema: unifiedSchema };
	}, [jsonDataList, graphId]);
}

// Issues Panel - shows validation errors and warnings for current graph
const IssuesPanel = memo(() => {
	const { selectedGraphId } = useDashboardStore();
	const { data: jsonDataList } = useJsonDataList();

	// Auto-select first graph if none selected (same logic as GraphPanel)
	const effectiveGraphId = useMemo(() => {
		if (selectedGraphId) return selectedGraphId;
		if (jsonDataList && jsonDataList.length > 0) return jsonDataList[0].id;
		return null;
	}, [selectedGraphId, jsonDataList]);

	const analysis = useGraphAnalysis(effectiveGraphId);

	const errorCount = analysis.issues.filter((i) => i.type === "error").length;
	const warningCount = analysis.issues.filter(
		(i) => i.type === "warning",
	).length;

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto", fontSize: 12 }}>
			{/* Summary */}
			<Box sx={{ display: "flex", gap: 1, mb: 2 }}>
				<Chip
					label={`${errorCount} ошибок`}
					color={errorCount > 0 ? "error" : "default"}
					size="small"
				/>
				<Chip
					label={`${warningCount} предупреждений`}
					color={warningCount > 0 ? "warning" : "default"}
					size="small"
				/>
			</Box>

			{/* Issues List */}
			<Flex gap={10} flexDirection="column">
				{analysis.issues.length === 0 ? (
					<Alert severity="success" sx={{ fontSize: 11 }}>
						Проблем не обнаружено!
					</Alert>
				) : (
					analysis.issues.map((issue, idx) => (
						<Card key={idx}>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									alignItems: "center",
									mb: 0.5,
								}}
							>
								<Chip
									label={issue.category}
									size="small"
									color={issue.type === "error" ? "error" : "warning"}
									sx={{ fontSize: 10, height: 20 }}
								/>
								<Typography
									variant="body2"
									sx={{ fontWeight: 500, fontSize: 11 }}
								>
									{issue.message}
								</Typography>
							</Box>
							<Typography
								variant="caption"
								sx={{
									fontFamily: "monospace",
									fontSize: 10,
									color: "text.secondary",
									display: "block",
								}}
							>
								📍 {issue.location}
							</Typography>
							{issue.details && (
								<Box
									component="pre"
									sx={{
										mt: 0.5,
										p: 0.5,
										bgcolor: "grey.100",
										borderRadius: 0.5,
										fontSize: 9,
										overflow: "auto",
										maxHeight: 60,
									}}
								>
									{issue.details}
								</Box>
							)}
						</Card>
					))
				)}
			</Flex>
		</Box>
	);
});

// Schema Panel - shows inferred JSON schema for current graph
const SchemaPanel = memo(() => {
	const { selectedGraphId } = useDashboardStore();
	const { data: jsonDataList } = useJsonDataList();

	// Auto-select first graph if none selected (same logic as GraphPanel)
	const effectiveGraphId = useMemo(() => {
		if (selectedGraphId) return selectedGraphId;
		if (jsonDataList && jsonDataList.length > 0) return jsonDataList[0].id;
		return null;
	}, [selectedGraphId, jsonDataList]);

	const analysis = useGraphAnalysis(effectiveGraphId);

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto", fontSize: 12 }}>
			<Box
				component="pre"
				sx={{
					p: 1.5,
					bgcolor: "grey.50",
					borderRadius: 1,
					fontSize: 10,
					fontFamily: "monospace",
					overflow: "auto",
					border: "1px solid",
					borderColor: "divider",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
				}}
			>
				{`{\n${formatSchema(analysis.schema, 1)}\n}`}
			</Box>
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
							{
								type: "tab",
								name: "⚠️ Ошибки",
								component: "issues",
								id: "issues-tab",
							},
							{
								type: "tab",
								name: "📋 Схема",
								component: "schema",
								id: "schema-tab",
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
// Advanced Filters Panel Component
// ============================================================================

const AdvancedFiltersPanel = memo(
	({
		filterOptions,
		open,
		onClose,
	}: {
		filterOptions: { entityTypes: string[]; namespaces: string[] };
		open: boolean;
		onClose: () => void;
	}) => {
		const { filters, updateFilter, resetFilters } = useDashboardStore();

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

		return (
			<Modal open={open} onClose={onClose}>
				<Paper
					elevation={8}
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						p: 3,

						maxHeight: "90vh",
						overflow: "auto",
						borderRadius: 2,
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
								onChange={(e) => updateFilter("modifiedOnly", e.target.checked)}
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
			</Modal>
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
			case "issues":
				return <IssuesPanel />;
			case "schema":
				return <SchemaPanel />;
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
						open={Boolean(filterAnchorEl)}
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
		fontSize: "10px",
		backgroundColor: "#488ecb1a",
	},
}));
