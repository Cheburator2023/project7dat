import React, { memo, useState, useCallback, useMemo } from "react";
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
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";

import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

import { useEntitiesStore } from "../../entities/stores";
import {
	ModelGraphPanelInner,
	type NodeContextMenuEvent,
} from "./ModelGraphPanelInner";
import { LoadingSpinner } from "../../entities/atoms/LoadingSpinner";
import type { EntityConnection } from "../../entities/types";
import {
	getUpstreamNodes,
	getDownstreamNodes,
	buildLineageGraph,
} from "../../entities/utils";
import { LinkIcon } from "lucide-react";

export const ModelGraphPanel: React.FC<{
	onSelectNode?: (data: any) => void;
	isLoading?: boolean;
	entity: DataLineageEntity | null;
	graphData?: {
		entities: DataLineageEntity[];
		mappings: DataLineageMapping[];
	};
	depthLimit?: number;
	onDepthChange?: (depth: number) => void;
	searchQuery?: string;
	searchMatchedEntities?: Map<string, number>;
}> = memo(
	({
		onSelectNode,
		isLoading = false,
		entity,
		graphData,
		depthLimit,
		onDepthChange,
		searchQuery,
		searchMatchedEntities,
	}) => {
		const {
			selectedEntityId,
			selectEntity,
			setUpstreamDownstream,
			selectedAttributes,
			selectedGraphId,
		} = useEntitiesStore();

		const { currentGraph, currentGraphId } = useDataLineageStore(
			useShallow((state) => ({
				currentGraph: state.currentGraph,
				currentGraphId: state.currentGraphId,
			})),
		);

		const currentSchema = currentGraph ?? null;
		const effectiveGraphId = selectedGraphId ?? currentGraphId ?? null;

		const navigate = useNavigate();

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

		const resolvedSchema = graphData ?? currentSchema;

		// Build connections for dialogs
		const entityConnections = useMemo(() => {
			if (!resolvedSchema) return [];
			const connections: EntityConnection[] = [];
			const entityMap = new Map<string, DataLineageEntity>();
			for (const e of resolvedSchema.entities || []) {
				entityMap.set(e.id, e);
			}

			for (const mapping of resolvedSchema.mappings || []) {
				if (!mapping.deps) continue;
				for (const dep of mapping.deps) {
					const sourceEntity = entityMap.get(dep.entityId);
					const targetEntity = entityMap.get(mapping.entityId);
					if (!sourceEntity || !targetEntity) continue;

					const processFallbackId = mapping.processId ?? mapping.id;
					const normalizedProcessFallbackId =
						processFallbackId != null &&
						String(processFallbackId).trim() !== "" &&
						String(processFallbackId).toLowerCase() !== "undefined" &&
						String(processFallbackId).toLowerCase() !== "null"
							? String(processFallbackId)
							: null;
					const processName =
						mapping.process?.trim() ||
						(normalizedProcessFallbackId
							? `Процесс #${normalizedProcessFallbackId}`
							: "Процесс не указан");
					connections.push({
						id: `${dep.entityId}->${mapping.entityId}::${mapping.id}`,
						sourceId: dep.entityId,
						targetId: mapping.entityId,
						sourceName: sourceEntity.name || sourceEntity.id,
						targetName: targetEntity.name || targetEntity.id,
						processName,
						processId: mapping.processId,
						processCode: mapping.system_code || dep.system_code,
						attrMaps: dep.attrMaps || [],
						description: "",
					});
				}
			}
			return connections;
		}, [resolvedSchema]);

		const handleSelectEntity = useCallback(
			(id: string | null) => selectEntity(id, effectiveGraphId),
			[selectEntity, effectiveGraphId],
		);

		const handleNodeDoubleClick = useCallback(
			(entityId: string, _graphId: string) => {
				const entity = resolvedSchema?.entities?.find((e) => e.id === entityId);
				if (entity) {
					setDialogEntity(entity);
					setIsEntityDialogOpen(true);
				}
			},
			[resolvedSchema],
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
			if (!contextMenu || !resolvedSchema) return null;
			return (
				resolvedSchema.entities?.find((e) => e.id === contextMenu.entityId) ||
				null
			);
		}, [contextMenu, resolvedSchema]);

		// Build lineage graph for upstream/downstream navigation
		const lineageGraph = useMemo(
			() => buildLineageGraph(resolvedSchema?.mappings || []),
			[resolvedSchema?.mappings],
		);

		// Get upstream/downstream entities for context menu entity
		const {
			contextUpstream: _contextUpstream,
			contextDownstream: _contextDownstream,
		} = useMemo(() => {
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
			for (const e of resolvedSchema?.entities || []) {
				entityMap.set(e.id, e);
			}

			const upstream = Array.from(upstreamSet)
				.map((id) => entityMap.get(id))
				.filter((e): e is DataLineageEntity => !!e);
			const downstream = Array.from(downstreamSet)
				.map((id) => entityMap.get(id))
				.filter((e): e is DataLineageEntity => !!e);

			return { contextUpstream: upstream, contextDownstream: downstream };
		}, [contextMenu?.entityId, lineageGraph, resolvedSchema?.entities]);

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
				const url = new URL(`/entity/${encodedId}`, window.location.href);
				window.open(url.toString(), "_blank", "noopener,noreferrer");
			}
			handleCloseContextMenu();
		}, [contextMenu?.entityId, handleCloseContextMenu]);

		const handleGoToEntity = useCallback(() => {
			if (contextMenu?.entityId) {
				handleOpenEntity(contextMenu.entityId);
			}
			handleCloseContextMenu();
		}, [contextMenu?.entityId, handleOpenEntity, handleCloseContextMenu]);

		const handleCopyId = useCallback(() => {
			if (contextMenu?.entityId) {
				navigator.clipboard.writeText(contextMenu.entityId);
			}
			handleCloseContextMenu();
		}, [contextMenu?.entityId, handleCloseContextMenu]);

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
			},
			[contextMenu?.entityId, handleCloseContextMenu],
		);

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

		return (
			<Box sx={{ height: "100%", width: "100%", position: "relative" }}>
				<ReactFlowProvider>
					<ModelGraphPanelInner
						data={resolvedSchema as any}
						graphId={effectiveGraphId || ""}
						selectedEntityId={selectedEntityId}
						onSelectEntity={handleSelectEntity}
						onNodeDoubleClick={handleNodeDoubleClick}
						onUpstreamDownstreamChange={setUpstreamDownstream}
						onEdgeClick={handleEdgeClick}
						onNodeContextMenu={handleNodeContextMenu}
						onSelectNode={onSelectNode}
						entity={entity}
						depthLimit={depthLimit}
						onDepthChange={onDepthChange}
						searchQuery={searchQuery}
						searchMatchedEntities={searchMatchedEntities}
					/>
				</ReactFlowProvider>
				{isLoading && (
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
								c.sourceId === dialogEntity.id ||
								c.targetId === dialogEntity.id,
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
	},
);
