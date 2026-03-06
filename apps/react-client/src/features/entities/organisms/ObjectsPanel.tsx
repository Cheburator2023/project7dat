import { memo, useMemo, useState, useCallback, useRef } from "react";
import { AgGridStateControls } from "@react-client/common/grid/AgGridStateControls";
import { useAgGridPersistence } from "@react-client/common/grid/hooks/useAgGridPersistence";
import { Box, Typography, Chip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { RowGroupingModule } from "ag-grid-enterprise";
import type {
	CellContextMenuEvent,
	ColDef,
	GridApi,
	GridReadyEvent,
	RowDoubleClickedEvent,
	RowClickedEvent,
} from "ag-grid-community";

import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";

import { useEntitiesStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { ObjectTypeChip } from "../atoms/ObjectTypeChip";
import { HIGHLIGHT_COLORS } from "../constants";
import { strictSearchObjects, strictSearchLinks } from "../utils/fuzzySearch";
import {
	EntityContextMenu,
	type EntityContextMenuState,
} from "../molecules/EntityContextMenu";
import type { ObjectRow, LinkRow, EntityConnection } from "../types";
import { usePaginatedEntityRelations } from "@react-client/api/hooks/usePaginatedEntityRelations";
import type {
	PaginatedEntitiesResponse,
	PaginatedMappingsResponse,
} from "@react-client/api/hooks/jsonDataApi";

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule]);

type EntityLike = DataLineageEntity | PaginatedEntitiesResponse["entities"][0];
type MappingLike =
	| DataLineageMapping
	| PaginatedMappingsResponse["mappings"][0];

export const ObjectsPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const {
		selectedEntityId,
		selectedAttributeName,
		selectAttribute,
		clearSelectedAttributes,
		toggleSelectedAttribute,
		setZoomToNode,
		globalSearchQuery,
		hideTempTables,
	} = useEntitiesStore();

	const { effectiveGraphId } = useCurrentSchema();

	const {
		data: entityRelationsData,
		isLoading: isLoadingEntityRelations,
		isFetching: isFetchingEntityRelations,
	} = usePaginatedEntityRelations({
		entityId: selectedEntityId ?? "",
		page: 1,
		limit: 10000,
		hideTempTables,
		enabled: !!selectedEntityId,
	});

	const entitiesSource = useMemo<EntityLike[]>(() => {
		if (!entityRelationsData) return [];
		return [
			...(entityRelationsData.entity ? [entityRelationsData.entity] : []),
			...entityRelationsData.relatedEntities,
		];
	}, [entityRelationsData]);

	const mappingsSource = useMemo<MappingLike[]>(() => {
		return entityRelationsData?.mappings ?? [];
	}, [entityRelationsData?.mappings]);

	const isPanelLoading = isLoadingEntityRelations || isFetchingEntityRelations;

	const depthByEntityId = useMemo(() => {
		const depthMap = new Map<string, number>();
		if (!selectedEntityId) return depthMap;
		if (!entitiesSource.length || !mappingsSource.length) {
			depthMap.set(selectedEntityId, 0);
			return depthMap;
		}

		const visibleEntityIds = new Set(entitiesSource.map((e) => e.id));
		const downstreamAdj = new Map<string, Set<string>>();
		const upstreamAdj = new Map<string, Set<string>>();

		for (const mapping of mappingsSource) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const src = dep.entityId;
				const dst = mapping.entityId;
				if (!visibleEntityIds.has(src) || !visibleEntityIds.has(dst)) continue;
				const ds = downstreamAdj.get(src);
				if (ds) ds.add(dst);
				else downstreamAdj.set(src, new Set([dst]));
				const us = upstreamAdj.get(dst);
				if (us) us.add(src);
				else upstreamAdj.set(dst, new Set([src]));
			}
		}

		depthMap.set(selectedEntityId, 0);

		const bfs = (
			start: string,
			adj: Map<string, Set<string>>,
			sign: 1 | -1,
		) => {
			const queue: Array<{ id: string; d: number }> = [{ id: start, d: 0 }];
			const visited = new Set<string>([start]);
			while (queue.length) {
				const curr = queue.shift();
				if (!curr) break;
				const next = adj.get(curr.id);
				if (!next) continue;
				for (const n of next) {
					if (visited.has(n)) continue;
					visited.add(n);
					const nextDepth = (curr.d + 1) * sign;
					depthMap.set(n, nextDepth);
					queue.push({ id: n, d: curr.d + 1 });
				}
			}
		};

		bfs(selectedEntityId, downstreamAdj, 1);
		bfs(selectedEntityId, upstreamAdj, -1);
		return depthMap;
	}, [selectedEntityId, entitiesSource, mappingsSource]);

	// View mode toggle: "attributes" or "links"
	const [viewMode, _setViewMode] = useState<"attributes" | "links">(
		"attributes",
	);

	// State for mapping dialog
	const [selectedLink, setSelectedLink] = useState<LinkRowWithDepth | null>(
		null,
	);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);

	// Transform data to object rows (attributes)
	type ObjectRowWithDepth = ObjectRow & {
		depthLabel: string;
		depthOrder: number;
		entityName: string;
	};
	type LinkRowWithDepth = LinkRow & {
		sourceDepth: number | null;
		targetDepth: number | null;
		sourceDepthLabel: string | null;
		targetDepthLabel: string | null;
	};

	const getDepthLabel = useCallback((depth: number): string => {
		if (depth === 0) return "Корень";
		if (depth > 0) return `Downstream ${depth}`;
		return `Upstream ${Math.abs(depth)}`;
	}, []);

	const objects = useMemo<ObjectRowWithDepth[]>(() => {
		const rows: ObjectRowWithDepth[] = [];
		const localEntities = entitiesSource;
		localEntities.forEach((entity) => {
			const entityDepth = depthByEntityId.get(entity.id) ?? 0;
			const label = getDepthLabel(entityDepth);
			const entityName = entity.namespace
				? `${entity.namespace}.${entity.name ?? entity.id}`
				: (entity.name ?? entity.id);
			// Add attribute rows only (entity is shown as group header via row grouping)
			entity.attrSeq?.forEach((attr) => {
				rows.push({
					id: `${effectiveGraphId}::${entity.id}::${attr.name}`,
					graphId: effectiveGraphId || "",
					name: attr.name,
					objectType: "Признак",
					parentEntity: entity.id,
					dataType: attr.type,
					description: attr.comment ?? "",
					depthLabel: label,
					depthOrder: entityDepth,
					entityName,
				});
			});
			// If entity has no attributes, add a placeholder row to keep group visible
			if (!entity.attrSeq?.length) {
				rows.push({
					id: `${effectiveGraphId}::${entity.id}`,
					graphId: effectiveGraphId || "",
					name: entity.name ?? entity.id,
					objectType: entity.modified ? "Витрина" : "Источник",
					parentEntity: entity.id,
					description: "",
					depthLabel: label,
					depthOrder: entityDepth,
					entityName,
				});
			}
		});

		return rows;
	}, [entitiesSource, effectiveGraphId, depthByEntityId, getDepthLabel]);

	// Transform data to link rows (connections)
	const links = useMemo<LinkRowWithDepth[]>(() => {
		const rows: LinkRowWithDepth[] = [];
		const entityMap = new Map<string, { id: string; name?: string | null }>();
		for (const entity of entitiesSource) {
			entityMap.set(entity.id, entity);
		}

		mappingsSource.forEach((mapping) => {
			if (!mapping.deps) return;
			mapping.deps.forEach((dep, depIndex) => {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				const sourceName = sourceEntity?.name || dep.entityId;
				const targetName = targetEntity?.name || mapping.entityId;

				const attrMaps = dep.attrMaps || [];
				const mappingId =
					"id" in mapping
						? mapping.id
						: (mapping.entity_map_id ?? `${mapping.entityId}_${dep.entityId}`);
				const processFallbackId =
					("processId" in mapping ? mapping.processId : undefined) ?? mappingId;
				const normalizedProcessFallbackId =
					processFallbackId != null &&
					String(processFallbackId).trim() !== "" &&
					String(processFallbackId).toLowerCase() !== "undefined" &&
					String(processFallbackId).toLowerCase() !== "null"
						? String(processFallbackId)
						: null;
				const processName =
					("process" in dep && typeof dep.process === "string"
						? dep.process.trim()
						: "") ||
					(normalizedProcessFallbackId
						? `Процесс #${normalizedProcessFallbackId}`
						: "Процесс не указан");
				const depProcessId =
					"process_id" in dep && typeof dep.process_id === "number"
						? dep.process_id
						: undefined;
				const srcDepth = depthByEntityId.get(dep.entityId) ?? null;
				const tgtDepth = depthByEntityId.get(mapping.entityId) ?? null;
				rows.push({
					id: `${effectiveGraphId}::${dep.entityId}->${mapping.entityId}::${mappingId}::${depIndex}`,
					graphId: effectiveGraphId || "",
					sourceEntity: dep.entityId,
					sourceName,
					targetEntity: mapping.entityId,
					targetName,
					processName,
					processId: depProcessId,
					processCode: mapping.system_code || dep.system_code,
					attrMappingsCount: attrMaps.length,
					attrMaps,
					sourceDepth: srcDepth,
					targetDepth: tgtDepth,
					sourceDepthLabel: srcDepth !== null ? getDepthLabel(srcDepth) : null,
					targetDepthLabel: tgtDepth !== null ? getDepthLabel(tgtDepth) : null,
				});
			});
		});

		return rows;
	}, [
		entitiesSource,
		mappingsSource,
		effectiveGraphId,
		depthByEntityId,
		getDepthLabel,
	]);

	const objectsSearch = useMemo(() => {
		const query = globalSearchQuery.trim();
		if (!query) {
			return {
				items: objects,
				highlightsMap: new Map<string, Map<string, string>>(),
			};
		}

		const entityRows = objects.filter((row) => row.objectType !== "Признак");
		const attributeRows = objects.filter((row) => row.objectType === "Признак");

		const attrsByEntityId = new Map<string, ObjectRow[]>();
		for (const row of attributeRows) {
			const list = attrsByEntityId.get(row.parentEntity);
			if (list) {
				list.push(row);
			} else {
				attrsByEntityId.set(row.parentEntity, [row]);
			}
		}

		const entityRowByEntityId = new Map<string, ObjectRow>();
		for (const row of entityRows) {
			entityRowByEntityId.set(row.parentEntity, row);
		}

		const includedIds = new Set<string>();
		const highlightsMap = new Map<string, Map<string, string>>();

		const entityMatches = strictSearchObjects(entityRows, query);
		for (const match of entityMatches) {
			includedIds.add(match.item.id);
			const attrs = attrsByEntityId.get(match.item.parentEntity) ?? [];
			for (const attr of attrs) includedIds.add(attr.id);
			if (match.highlights.size > 0) {
				highlightsMap.set(match.item.id, match.highlights);
			}
		}

		const attrMatches = strictSearchObjects(attributeRows, query);
		for (const match of attrMatches) {
			includedIds.add(match.item.id);
			const parentEntityRow = entityRowByEntityId.get(match.item.parentEntity);
			if (parentEntityRow) includedIds.add(parentEntityRow.id);
			if (match.highlights.size > 0) {
				highlightsMap.set(match.item.id, match.highlights);
			}
		}

		return {
			items: objects.filter((row) => includedIds.has(row.id)),
			highlightsMap,
		};
	}, [objects, globalSearchQuery]);

	const objectHighlightsMap = objectsSearch.highlightsMap;
	const allFilteredObjects = objectsSearch.items;

	const filteredObjects = allFilteredObjects;

	// Fuzzy search links
	const fuzzyLinkResults = useMemo(() => {
		return strictSearchLinks(links, globalSearchQuery);
	}, [links, globalSearchQuery]);

	// Create highlights map for links
	const linkHighlightsMap = useMemo(() => {
		const map = new Map<string, Map<string, string>>();
		for (const result of fuzzyLinkResults) {
			if (result.highlights.size > 0) {
				map.set(result.item.id, result.highlights);
			}
		}
		return map;
	}, [fuzzyLinkResults]);

	// Get filtered links (sorted by fuzzy score)
	const allFilteredLinks = useMemo(() => {
		return fuzzyLinkResults.map((r) => r.item);
	}, [fuzzyLinkResults]);

	const filteredLinks = allFilteredLinks;

	// Navigate to object page based on type
	const handleNavigateToObject = useCallback(
		(data: ObjectRow) => {
			const encodedEntityId = encodeURIComponent(data.parentEntity);
			if (data.objectType === "Признак") {
				// Attribute → open entity page with attribute highlight
				navigate(
					`/entity/${encodedEntityId}?highlightAttr=${encodeURIComponent(data.name)}`,
				);
			} else {
				// Entity (Источник/Витрина) → open entity page
				navigate(`/entity/${encodedEntityId}`);
			}
		},
		[navigate],
	);

	// Handle link click to open mapping dialog
	const handleLinkClick = useCallback((link: LinkRowWithDepth) => {
		setSelectedLink(link);
		setIsMappingDialogOpen(true);
	}, []);

	const attributesAutoGroupColumnDef = useMemo<ColDef<ObjectRowWithDepth>>(
		() => ({
			headerName: "Объект",
			flex: 2,
			cellRendererParams: {
				suppressCount: true,
				innerRenderer: ({
					value,
					node,
				}: {
					value: string;
					node: { allLeafChildren?: Array<{ data: ObjectRowWithDepth }> };
				}) => {
					const firstChild = node.allLeafChildren?.[0]?.data;
					const level = firstChild?.depthLabel ?? "";
					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="body2" fontWeight={600}>
								{value}
							</Typography>
							{level ? (
								<Chip
									label={level}
									size="small"
									color={
										level === "Корень"
											? "primary"
											: level.startsWith("Downstream")
												? "success"
												: "warning"
									}
									variant="outlined"
								/>
							) : null}
						</Box>
					);
				},
			},
		}),
		[],
	);

	// Column definitions for attributes (row grouping by entityName)
	const attributeColumnDefs: ColDef<ObjectRowWithDepth>[] = useMemo(
		() => [
			{
				field: "entityName",
				headerName: "Сущность",
				hide: true,
				rowGroup: true,
			},
			{
				field: "name",
				headerName: "Признак",
				flex: 2,
				cellRenderer: ({
					value,
					data,
				}: {
					value: string;
					data?: ObjectRowWithDepth;
				}) => {
					if (!data) return value;
					const highlights = objectHighlightsMap.get(data.id);
					const highlightedName = highlights?.get("name");
					if (highlightedName) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedName }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},
			{
				field: "depthLabel",
				headerName: "Уровень",
				width: 130,
				sortable: true,
				comparator: (
					_a: string,
					_b: string,
					nodeA: { data?: ObjectRowWithDepth },
					nodeB: { data?: ObjectRowWithDepth },
				) => (nodeA.data?.depthOrder ?? 0) - (nodeB.data?.depthOrder ?? 0),
			},
			{
				field: "objectType",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: ObjectRow["objectType"] }) =>
					value ? <ObjectTypeChip type={value} /> : null,
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
				cellRenderer: ({
					value,
					data,
				}: {
					value: string;
					data?: ObjectRowWithDepth;
				}) => {
					if (!data) return value;
					const highlights = objectHighlightsMap.get(data.id);
					const highlightedDesc = highlights?.get("description");
					if (highlightedDesc) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedDesc }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},
		],
		[objectHighlightsMap],
	);

	// Column definitions for links
	const linkColumnDefs: ColDef<LinkRowWithDepth>[] = useMemo(
		() => [
			{
				field: "sourceDepthLabel",
				headerName: "Уровень ист.",
				width: 130,
				comparator: (
					_a: string | null,
					_b: string | null,
					nodeA: { data?: LinkRowWithDepth },
					nodeB: { data?: LinkRowWithDepth },
				) => (nodeA.data?.sourceDepth ?? 0) - (nodeB.data?.sourceDepth ?? 0),
			},
			{
				field: "targetDepthLabel",
				headerName: "Уровень цели",
				width: 130,
				comparator: (
					_a: string | null,
					_b: string | null,
					nodeA: { data?: LinkRowWithDepth },
					nodeB: { data?: LinkRowWithDepth },
				) => (nodeA.data?.targetDepth ?? 0) - (nodeB.data?.targetDepth ?? 0),
			},
			{
				field: "sourceName",
				headerName: "Источник",
				flex: 1,
				cellRenderer: ({
					value,
					data,
				}: {
					value: string;
					data: LinkRowWithDepth;
				}) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedSource = highlights?.get("sourceName");
					if (highlightedSource) {
						return (
							<Typography
								variant="body2"
								fontWeight={500}
								dangerouslySetInnerHTML={{ __html: highlightedSource }}
							/>
						);
					}
					return (
						<Typography variant="body2" fontWeight={500}>
							{value}
						</Typography>
					);
				},
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
				cellRenderer: ({
					value,
					data,
				}: {
					value: string;
					data: LinkRowWithDepth;
				}) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedTarget = highlights?.get("targetName");
					if (highlightedTarget) {
						return (
							<Typography
								variant="body2"
								fontWeight={500}
								dangerouslySetInnerHTML={{ __html: highlightedTarget }}
							/>
						);
					}
					return (
						<Typography variant="body2" fontWeight={500}>
							{value}
						</Typography>
					);
				},
			},
			{
				field: "processName",
				headerName: "Процесс",
				flex: 1,
				minWidth: 220,
				cellRenderer: ({
					value,
					data,
				}: {
					value: string;
					data: LinkRowWithDepth;
				}) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedProcessName = highlights?.get("processName");
					const highlightedProcessCode = highlights?.get("processCode");

					return (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
							<Chip
								label={value}
								size="small"
								color="secondary"
								variant="filled"
								sx={{
									maxWidth: "100%",
									"& .MuiChip-label": {
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									},
								}}
							/>
							{data.processCode ? (
								<Typography variant="caption" color="text.secondary">
									{highlightedProcessCode ? (
										<span
											dangerouslySetInnerHTML={{
												__html: highlightedProcessCode,
											}}
										/>
									) : (
										data.processCode
									)}
								</Typography>
							) : null}
							{highlightedProcessName ? (
								<Typography
									variant="caption"
									color="text.secondary"
									dangerouslySetInnerHTML={{ __html: highlightedProcessName }}
								/>
							) : null}
						</Box>
					);
				},
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
		[linkHighlightsMap],
	);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<ObjectRowWithDepth>) => {
			if (event.data?.objectType === "Признак") {
				selectAttribute(event.data.name);
				clearSelectedAttributes();
				toggleSelectedAttribute({
					entityId: event.data.parentEntity,
					attrName: event.data.name,
				});
				setZoomToNode(event.data.parentEntity);
			}
		},
		[
			clearSelectedAttributes,
			selectAttribute,
			setZoomToNode,
			toggleSelectedAttribute,
		],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<ObjectRowWithDepth>) => {
			if (event.data) {
				handleNavigateToObject(event.data);
			}
		},
		[handleNavigateToObject],
	);

	const handleLinkRowClicked = useCallback(
		(event: RowClickedEvent<LinkRowWithDepth>) => {
			if (event.data) {
				handleLinkClick(event.data);
			}
		},
		[handleLinkClick],
	);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<EntityContextMenuState | null>(
		null,
	);

	const handleCellContextMenu = useCallback(
		(event: CellContextMenuEvent<ObjectRowWithDepth>) => {
			event.event?.preventDefault();
			if (event.data) {
				const mouseEvent = event.event as MouseEvent;
				setContextMenu({
					entityId: event.data.parentEntity,
					entityName: event.data.name,
					entityType: event.data.objectType,
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

	const attributesGridApiRef = useRef<GridApi | null>(null);
	const linksGridApiRef = useRef<GridApi | null>(null);
	const attributesGridPersistence = useAgGridPersistence({
		gridId: "objects-attributes",
		gridName: "Объекты (атрибуты)",
		apiRef: attributesGridApiRef,
	});
	const linksGridPersistence = useAgGridPersistence({
		gridId: "objects-links",
		gridName: "Объекты (связи)",
		apiRef: linksGridApiRef,
	});

	const handleAttributesGridReady = useCallback(
		(event: GridReadyEvent) => {
			attributesGridPersistence.onGridReady(event as unknown as GridReadyEvent);
			attributesGridApiRef.current = event.api;
		},
		[attributesGridPersistence],
	);

	const handleLinksGridReady = useCallback(
		(event: GridReadyEvent) => {
			linksGridPersistence.onGridReady(event as unknown as GridReadyEvent);
			linksGridApiRef.current = event.api;
		},
		[linksGridPersistence],
	);

	// Get entity for context menu
	const contextMenuEntity = useMemo(() => {
		if (!contextMenu) return null;
		return (
			(entitiesSource.find((e) => e.id === contextMenu.entityId) as
				| DataLineageEntity
				| null
				| undefined) ?? null
		);
	}, [contextMenu, entitiesSource]);

	// Build connections for context menu
	const entityConnections: EntityConnection[] = useMemo(() => {
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, { name: string; id: string }>();
		for (const e of entitiesSource || []) {
			entityMap.set(e.id, { name: (e as any).name || e.id, id: e.id });
		}

		for (const mapping of mappingsSource || []) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) continue;

				const mappingId =
					"id" in mapping
						? (mapping as any).id
						: ((mapping as any).entity_map_id ??
							(mapping as any).target_id ??
							0);
				const processFallbackId =
					("processId" in mapping ? (mapping as any).processId : undefined) ??
					mappingId;
				const normalizedProcessFallbackId =
					processFallbackId != null &&
					String(processFallbackId).trim() !== "" &&
					String(processFallbackId).toLowerCase() !== "undefined" &&
					String(processFallbackId).toLowerCase() !== "null"
						? String(processFallbackId)
						: null;
				const processName =
					("process" in dep && typeof (dep as any).process === "string"
						? (dep as any).process.trim()
						: "") ||
					(normalizedProcessFallbackId
						? `Процесс #${normalizedProcessFallbackId}`
						: "Процесс не указан");
				const depProcessId =
					"process_id" in dep && typeof (dep as any).process_id === "number"
						? (dep as any).process_id
						: undefined;
				connections.push({
					id: `${dep.entityId}->${mapping.entityId}::${mappingId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name,
					targetName: targetEntity.name,
					processName,
					processId: depProcessId,
					processCode: (mapping as any).system_code || (dep as any).system_code,
					attrMaps: (dep as any).attrMaps || [],
					description: "",
				});
			}
		}
		return connections;
	}, [entitiesSource, mappingsSource]);

	const getRowStyle = useCallback(
		(params: { data?: ObjectRow }) => {
			if (params.data?.name === selectedAttributeName) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.selected}40` };
			}
			return undefined;
		},
		[selectedAttributeName],
	);

	// Convert LinkRow to EntityConnection for MappingDetailsDialog
	const selectedConnection: EntityConnection | null = selectedLink
		? {
				id: selectedLink.id,
				sourceId: selectedLink.sourceEntity,
				targetId: selectedLink.targetEntity,
				sourceName: selectedLink.sourceName,
				targetName: selectedLink.targetName,
				processName: selectedLink.processName,
				processId: selectedLink.processId,
				processCode: selectedLink.processCode,
				attrMaps: selectedLink.attrMaps,
				description: "",
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
			{/* Table content */}
			<Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
				<AgGridStateControls
					onReset={attributesGridPersistence.resetGridState}
					resetTitle="Сбросить настройки таблицы (атрибуты)"
				/>
				<AgGridReact<ObjectRowWithDepth>
					rowData={filteredObjects}
					columnDefs={attributeColumnDefs}
					groupDisplayType="groupRows"
					autoGroupColumnDef={attributesAutoGroupColumnDef}
					groupDefaultExpanded={-1}
					theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
					onGridReady={handleAttributesGridReady}
					onColumnMoved={attributesGridPersistence.onColumnMoved}
					onColumnPinned={attributesGridPersistence.onColumnPinned}
					onColumnResized={attributesGridPersistence.onColumnResized}
					onColumnVisible={attributesGridPersistence.onColumnVisible}
					onRowClicked={handleRowClicked}
					onRowDoubleClicked={handleRowDoubleClicked}
					onCellContextMenu={handleCellContextMenu}
					preventDefaultOnContextMenu
					getRowStyle={getRowStyle}
					rowSelection="single"
					suppressCellFocus
					animateRows
					rowHeight={28}
					headerHeight={32}
					loading={isPanelLoading}
					overlayLoadingTemplate="Загрузка"
					overlayNoRowsTemplate="Нет данных"
					onSortChanged={attributesGridPersistence.onSortChanged}
				/>
			</Box>

			<EntityContextMenu
				contextMenu={contextMenu}
				onClose={handleCloseContextMenu}
				entity={contextMenuEntity}
				connections={entityConnections}
			/>

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
