import { memo, useState, useCallback, useMemo, useEffect } from "react";
import {
	Box,
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	ContentCopy,
	AccountTree as GraphIcon,
	Info,
	OpenInNew,
} from "@mui/icons-material";
import { ReactFlowProvider } from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { usePaginatedEntities } from "@react-client/api/hooks/usePaginatedEntities";
import { usePaginatedMappings } from "@react-client/api/hooks/usePaginatedMappings";
import { usePaginatedEntityRelations } from "@react-client/api/hooks/usePaginatedEntityRelations";
import type {
	PaginatedEntitiesResponse,
	PaginatedMappingsResponse,
} from "@react-client/api/hooks/jsonDataApi";
import type { DataLineageMapping } from "@react-client/types/dataLineage";

import { useEntitiesStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { EmptyState } from "../atoms";
import { LoadingSpinner } from "../atoms/LoadingSpinner";
import { GraphPanelInner, type NodeContextMenuEvent } from "./GraphPanelInner";
import type { EntityConnection } from "../types";
import {
	getUpstreamNodes,
	getDownstreamNodes,
	buildLineageGraph,
} from "../utils";
import { LinkIcon } from "lucide-react";

type EntityLike = DataLineageEntity | PaginatedEntitiesResponse["entities"][0];
type MappingLike =
	| {
			deps?: Array<{ entityId: string }> | null;
			entityId: string;
			system_code?: string;
	  }
	| PaginatedMappingsResponse["mappings"][0];

export const GraphPanel = memo(() => {
	const {
		selectedEntityId,
		selectEntity,
		setUpstreamDownstream,
		selectedAttributes,
	} = useEntitiesStore(
		useShallow((state) => ({
			selectedEntityId: state.selectedEntityId,
			selectEntity: state.selectEntity,
			setUpstreamDownstream: state.setUpstreamDownstream,
			selectedAttributes: state.selectedAttributes,
		})),
	);

	// Use currentSchema hook to get data synced with editor
	const { currentSchema, effectiveGraphId } = useCurrentSchema();
	const navigate = useNavigate();

	// Backend fallback: if currentSchema is not initialized yet, read from paginated API
	const { data: paginatedEntitiesData, isLoading: isPaginatedEntitiesLoading } =
		usePaginatedEntities({
			page: 1,
			limit: 500,
			enabled: false,
		});
	const { data: paginatedMappingsData, isLoading: isPaginatedMappingsLoading } =
		usePaginatedMappings({
			page: 1,
			limit: 52,
			enabled: false,
		});

	const graphId = effectiveGraphId ?? "current_stable_version";

	// Depth control state (filtering done on frontend)
	const [depthLimit, setDepthLimit] = useState(1);

	// Reset depth when selected entity changes
	useEffect(() => {
		setDepthLimit(1);
	}, [selectedEntityId]);

	// Fetch full graph of relations for selected entity (no depth param)
	const { data: entityRelationsData, isLoading: isEntityRelationsLoading } =
		usePaginatedEntityRelations({
			entityId: selectedEntityId ?? "",
			page: 1,
			limit: 10000,
			enabled: !!selectedEntityId,
		});

	const isPanelLoading = selectedEntityId
		? isEntityRelationsLoading
		: !currentSchema &&
			(isPaginatedEntitiesLoading || isPaginatedMappingsLoading);

	const entitiesSource = useMemo<EntityLike[]>(() => {
		if (currentSchema?.entities?.length) return currentSchema.entities;
		return paginatedEntitiesData?.entities ?? [];
	}, [currentSchema?.entities, paginatedEntitiesData?.entities]);

	const mappingsSource = useMemo<MappingLike[]>(() => {
		if (currentSchema?.mappings?.length) return currentSchema.mappings as any;
		return paginatedMappingsData?.mappings ?? [];
	}, [currentSchema?.mappings, paginatedMappingsData?.mappings]);

	// For selected entity always render only backend depth slice (no frontend merge).
	const schemaForGraph = useMemo(() => {
		if (selectedEntityId) {
			if (!entityRelationsData) {
				return {
					entities: [],
					mappings: [],
					desc: undefined,
				} as any;
			}
			const backendEntities = [
				...(entityRelationsData.entity ? [entityRelationsData.entity] : []),
				...entityRelationsData.relatedEntities,
			];
			const backendMappings = entityRelationsData.mappings.map(
				(m, i) =>
					({
						...m,
						id: m.entity_map_id ?? m.target_id ?? i,
					}) as unknown as DataLineageMapping,
			);
			return {
				entities: backendEntities,
				mappings: backendMappings,
				desc: entityRelationsData.desc,
			} as any;
		}
		if (currentSchema) return currentSchema;
		return {
			entities: entitiesSource,
			mappings: mappingsSource,
			desc: paginatedEntitiesData?.desc ?? paginatedMappingsData?.desc,
		} as any;
	}, [
		selectedEntityId,
		entityRelationsData,
		currentSchema,
		entitiesSource,
		mappingsSource,
		paginatedEntitiesData?.desc,
		paginatedMappingsData?.desc,
	]);

	// Get setRevealPosition for scrolling to entity in editor
	const setRevealPosition = useDataLineageStore(
		(state) => state.setRevealPosition,
	);

	// Dialog state
	const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
	const [dialogEntity, setDialogEntity] = useState<DataLineageEntity | null>(
		null,
	);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
	const [selectedConnection, setSelectedConnection] =
		useState<EntityConnection | null>(null);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		entityId: string;
		x: number;
		y: number;
	} | null>(null);

	// Build connections for dialogs
	const entityConnections = useMemo(() => {
		if (!schemaForGraph) return [];
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, { id: string; name?: string | null }>();
		for (const e of schemaForGraph.entities || []) {
			entityMap.set(e.id, e);
		}

		for (const mapping of schemaForGraph.mappings || []) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) continue;

				const mappingId =
					"id" in mapping
						? (mapping as any).id
						: ((mapping as any).entity_map_id ??
							`${mapping.entityId}_${dep.entityId}`);
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
					sourceName: sourceEntity.name || sourceEntity.id,
					targetName: targetEntity.name || targetEntity.id,
					processName,
					processId: depProcessId,
					processCode: mapping.system_code || dep.system_code,
					attrMaps: dep.attrMaps || [],
					description: "",
				});
			}
		}
		return connections;
	}, [schemaForGraph]);

	const handleSelectEntity = useCallback(
		(id: string | null) => selectEntity(id, effectiveGraphId),
		[selectEntity, effectiveGraphId],
	);

	const handleNodeDoubleClick = useCallback(
		(entityId: string, _graphId: string) => {
			const entity = schemaForGraph?.entities?.find(
				(e: any) => e.id === entityId,
			);
			if (entity) {
				setDialogEntity(entity as DataLineageEntity);
				setIsEntityDialogOpen(true);
			}
		},
		[schemaForGraph],
	);

	const handleViewDetailsFromNode = useCallback(
		(entityId: string) => {
			const entity = schemaForGraph?.entities?.find(
				(e: any) => e.id === entityId,
			);
			if (entity) {
				setDialogEntity(entity as DataLineageEntity);
				setIsEntityDialogOpen(true);
			}
		},
		[schemaForGraph],
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

	// Handle node context menu (right-click)
	const handleNodeContextMenu = useCallback((event: NodeContextMenuEvent) => {
		setContextMenu(event);
	}, []);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	// Get context menu entity
	const contextMenuEntity = useMemo(() => {
		if (!contextMenu || !schemaForGraph) return null;
		return (
			schemaForGraph.entities?.find(
				(e: any) => e.id === contextMenu.entityId,
			) || null
		);
	}, [contextMenu, schemaForGraph]);

	// Build lineage graph for upstream/downstream navigation
	const lineageGraph = useMemo(
		() => buildLineageGraph((schemaForGraph?.mappings || []) as any),
		[schemaForGraph?.mappings],
	);

	// Get upstream/downstream entities for context menu entity
	const { contextUpstream, contextDownstream } = useMemo(() => {
		if (!contextMenu?.entityId) {
			return { contextUpstream: [], contextDownstream: [] };
		}
		const upstreamSet = getUpstreamNodes(
			contextMenu.entityId,
			lineageGraph.upstream,
		);
		upstreamSet.delete(contextMenu.entityId);
		const downstreamSet = getDownstreamNodes(
			contextMenu.entityId,
			lineageGraph.downstream,
		);
		downstreamSet.delete(contextMenu.entityId);

		const entityMap = new Map<string, DataLineageEntity>();
		for (const e of schemaForGraph?.entities || []) {
			entityMap.set(e.id, e as any);
		}

		const upstream = Array.from(upstreamSet)
			.map((id) => entityMap.get(id))
			.filter((e): e is DataLineageEntity => !!e);
		const downstream = Array.from(downstreamSet)
			.map((id) => entityMap.get(id))
			.filter((e): e is DataLineageEntity => !!e);

		return { contextUpstream: upstream, contextDownstream: downstream };
	}, [contextMenu?.entityId, lineageGraph, schemaForGraph?.entities]);

	// Context menu actions
	const handleViewDetails = useCallback(() => {
		if (contextMenuEntity) {
			setDialogEntity(contextMenuEntity);
			setIsEntityDialogOpen(true);
		}
		handleCloseContextMenu();
	}, [contextMenuEntity, handleCloseContextMenu]);

	const handleOpenInNewTab = useCallback(() => {
		if (contextMenu?.entityId) {
			const encodedId = encodeURIComponent(contextMenu.entityId);
			window.open(`/entity/${encodedId}`, "_blank");
		}
		handleCloseContextMenu();
	}, [contextMenu?.entityId, handleCloseContextMenu]);

	const handleGoToEntity = useCallback(() => {
		if (contextMenu?.entityId) {
			handleOpenEntity(contextMenu.entityId);
		}
		handleCloseContextMenu();
	}, [contextMenu?.entityId, handleOpenEntity, handleCloseContextMenu]);

	// Open entity page with attribute highlight
	const handleGoToEntityWithHighlight = useCallback(
		(attrName?: string) => {
			if (contextMenu?.entityId) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				const url = attrName
					? `/entity/${encodedId}?highlightAttr=${encodeURIComponent(attrName)}`
					: `/entity/${encodedId}`;
				navigate(url);
			}
			handleCloseContextMenu();
		},
		[contextMenu?.entityId, navigate, handleCloseContextMenu],
	);

	const _handleShowInEditor = useCallback(() => {
		if (contextMenu?.entityId) {
			setRevealPosition({ nodeId: contextMenu.entityId, from: "graph" });
		}
		handleCloseContextMenu();
	}, [contextMenu?.entityId, setRevealPosition, handleCloseContextMenu]);

	const handleCopyId = useCallback(() => {
		if (contextMenu?.entityId) {
			navigator.clipboard.writeText(contextMenu.entityId);
		}
		handleCloseContextMenu();
	}, [contextMenu?.entityId, handleCloseContextMenu]);

	const _handleSelectUpstreamEntity = useCallback(
		(entityId: string) => {
			selectEntity(entityId, effectiveGraphId);
			handleCloseContextMenu();
		},
		[selectEntity, effectiveGraphId, handleCloseContextMenu],
	);

	const _handleSelectDownstreamEntity = useCallback(
		(entityId: string) => {
			selectEntity(entityId, effectiveGraphId);
			handleCloseContextMenu();
		},
		[selectEntity, effectiveGraphId, handleCloseContextMenu],
	);

	const handleShowConnections = useCallback(() => {
		if (contextMenuEntity) {
			const connections = entityConnections.filter(
				(c) =>
					c.sourceId === contextMenuEntity.id ||
					c.targetId === contextMenuEntity.id,
			);
			if (connections.length > 0) {
				setSelectedConnection(connections[0]);
				setIsMappingDialogOpen(true);
			}
		}
		handleCloseContextMenu();
	}, [contextMenuEntity, entityConnections, handleCloseContextMenu]);

	if (isPanelLoading) {
		return <LoadingSpinner size={32} />;
	}

	if (!schemaForGraph || entitiesSource.length === 0 || !graphId) {
		return <EmptyState message="Нет данных для отображения графа" />;
	}

	return (
		<Box sx={{ height: "100%", width: "100%", position: "relative" }}>
			<ReactFlowProvider>
				<GraphPanelInner
					data={schemaForGraph as any}
					graphId={graphId}
					selectedEntityId={selectedEntityId}
					onSelectEntity={handleSelectEntity}
					onNodeDoubleClick={handleNodeDoubleClick}
					onOpenEntity={handleOpenEntity}
					onViewDetails={handleViewDetailsFromNode}
					onUpstreamDownstreamChange={setUpstreamDownstream}
					onEdgeClick={handleEdgeClick}
					onNodeContextMenu={handleNodeContextMenu}
					depthLimit={depthLimit}
					onDepthChange={setDepthLimit}
				/>
			</ReactFlowProvider>
			{isPanelLoading && (
				<Box
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 10,
						bgcolor: "rgba(255, 255, 255, 0.6)",
					}}
				>
					<LoadingSpinner size={32} />
				</Box>
			)}

			{/* Node Context Menu */}
			<Menu
				open={contextMenu !== null}
				onClose={handleCloseContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? { top: contextMenu.y, left: contextMenu.x }
						: undefined
				}
			>
				{contextMenuEntity && (
					<MenuItem disabled sx={{ opacity: "1 !important" }}>
						<ListItemText
							primary={contextMenuEntity.name || contextMenuEntity.id}
							secondary={contextMenuEntity.type}
							primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
							secondaryTypographyProps={{ fontSize: 11 }}
						/>
					</MenuItem>
				)}
				<Divider />
				<MenuItem onClick={handleViewDetails}>
					<ListItemIcon>
						<Info fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Подробности" />
				</MenuItem>
				<MenuItem onClick={handleGoToEntity}>
					<ListItemIcon>
						<OpenInNew fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Открыть страницу" />
				</MenuItem>
				<MenuItem onClick={handleOpenInNewTab}>
					<ListItemIcon>
						<OpenInNew fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Открыть в новой вкладке" />
				</MenuItem>
				{contextMenuEntity?.attrSeq &&
					contextMenuEntity.attrSeq.length > 0 &&
					selectedAttributes.some(
						(a) => a.entityId === contextMenuEntity.id,
					) && (
						<MenuItem
							onClick={() => {
								const attr = selectedAttributes.find(
									(a) => a.entityId === contextMenuEntity.id,
								);
								if (attr) handleGoToEntityWithHighlight(attr.attrName);
							}}
						>
							<ListItemIcon>
								<GraphIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText
								primary="Открыть с выделением атрибута"
								secondary={
									selectedAttributes.find(
										(a) => a.entityId === contextMenuEntity.id,
									)?.attrName
								}
							/>
						</MenuItem>
					)}
				<Divider />
				{/* <MenuItem onClick={handleShowInEditor}>
					<ListItemIcon>
						<Code fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Показать в редакторе" />
				</MenuItem> */}
				<MenuItem onClick={handleCopyId}>
					<ListItemIcon>
						<ContentCopy fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Копировать ID" />
				</MenuItem>
				{entityConnections.some(
					(c) =>
						c.sourceId === contextMenu?.entityId ||
						c.targetId === contextMenu?.entityId,
				) && (
					<MenuItem onClick={handleShowConnections}>
						<ListItemIcon>
							<LinkIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать маппинги" />
					</MenuItem>
				)}
			</Menu>

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

GraphPanel.displayName = "GraphPanel";
