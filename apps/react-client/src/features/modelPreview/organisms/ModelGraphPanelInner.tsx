import React, {
	memo,
	useState,
	useCallback,
	useMemo,
	useEffect,
	useRef,
} from "react";
import {
	ReactFlow,
	type Node,
	type Edge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	MarkerType,
	Panel,
	useReactFlow,
} from "@xyflow/react";
import type {
	DataLineageSchema,
	DataLineageEntity,
} from "@react-client/types/dataLineage";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useGraphSettingsStore } from "@react-client/common/store/graphSettingsStore";
import { useDashboardStore } from "../../dashboard/stores";
import { graphNodeTypes } from "./ModelNodePreviewComponent";
import { getLayoutedElements, buildLineageGraph } from "../../dashboard/utils";
import { TYPE_COLORS, HIGHLIGHT_COLORS } from "../../dashboard/constants";
import type { EntityConnection, EntityNodeData } from "../../dashboard/types";
import { useParams } from "react-router-dom";
import {
	EntityDetailsDialog,
	MappingDetailsDialog,
} from "@react-client/features/entityPreview";
import {
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	CenterFocusStrong,
	ContentCopy,
	Info,
	OpenInNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

const getUpstreamNodes = (
	nodeId: string,
	upstreamGraph: Map<string, Set<string>>,
	visited = new Set<string>(),
): Set<string> => {
	if (visited.has(nodeId)) return visited;
	visited.add(nodeId);

	const parents = upstreamGraph.get(nodeId);
	if (parents) {
		parents.forEach((parent) => {
			getUpstreamNodes(parent, upstreamGraph, visited);
		});
	}

	return visited;
};

const getUpstreamNodesLimited = (
	nodeId: string,
	upstreamGraph: Map<string, Set<string>>,
	maxDepth: number,
): Set<string> => {
	const visited = new Set<string>();
	if (!nodeId) return visited;
	visited.add(nodeId);
	let frontier: string[] = [nodeId];

	for (let depth = 0; depth < maxDepth; depth += 1) {
		const next: string[] = [];
		for (const current of frontier) {
			const parents = upstreamGraph.get(current);
			if (!parents) continue;
			for (const parent of parents) {
				if (visited.has(parent)) continue;
				visited.add(parent);
				next.push(parent);
			}
		}
		if (next.length === 0) break;
		frontier = next;
	}

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
	if (children) {
		children.forEach((child) => {
			getDownstreamNodes(child, downstreamGraph, visited);
		});
	}

	return visited;
};

const getDownstreamNodesLimited = (
	nodeId: string,
	downstreamGraph: Map<string, Set<string>>,
	maxDepth: number,
): Set<string> => {
	const visited = new Set<string>();
	if (!nodeId) return visited;
	visited.add(nodeId);
	let frontier: string[] = [nodeId];

	for (let depth = 0; depth < maxDepth; depth += 1) {
		const next: string[] = [];
		for (const current of frontier) {
			const children = downstreamGraph.get(current);
			if (!children) continue;
			for (const child of children) {
				if (visited.has(child)) continue;
				visited.add(child);
				next.push(child);
			}
		}
		if (next.length === 0) break;
		frontier = next;
	}

	return visited;
};

const getMaxDepthFromNode = (
	nodeId: string,
	adjacency: Map<string, Set<string>>,
): number => {
	if (!nodeId) return 0;
	const visited = new Set<string>();
	visited.add(nodeId);
	let frontier: string[] = [nodeId];
	let depth = 0;

	while (frontier.length > 0) {
		const next: string[] = [];
		for (const current of frontier) {
			const neighbors = adjacency.get(current);
			if (!neighbors) continue;
			for (const neighbor of neighbors) {
				if (visited.has(neighbor)) continue;
				visited.add(neighbor);
				next.push(neighbor);
			}
		}
		if (next.length === 0) break;
		frontier = next;
		depth += 1;
	}

	return depth;
};

// Helper function to get edge description based on entity types
const getEdgeDescription = (
	sourceEntity: DataLineageEntity,
	targetEntity: DataLineageEntity,
	mainEntityId: string,
): string => {
	// Check if this is a transformation to/from the main entity
	if (targetEntity.id === mainEntityId) {
		return "Трансформация источника в модель";
	}
	if (sourceEntity.id === mainEntityId) {
		return "Трансформация модели в витрину";
	}
	// Generic transformation
	return "Трансформация данных";
};

type EntityNode = Node<EntityNodeData, "entityNode">;

export interface NodeContextMenuEvent {
	entityId: string;
	x: number;
	y: number;
}

interface GraphPanelInnerProps {
	data: DataLineageSchema | null;
	graphId: string;
	selectedEntityId?: string | null;
	onSelectEntity: (id: string | null) => void;
	onNodeDoubleClick: (entityId: string, graphId: string) => void;
	onUpstreamDownstreamChange: (
		upstream: Set<string>,
		downstream: Set<string>,
	) => void;
	onEdgeClick?: (sourceId: string, targetId: string) => void;
	onNodeContextMenu?: (event: NodeContextMenuEvent) => void;
	onSelectNode?: (data: any) => void;
}

export const ModelGraphPanelInner = memo<GraphPanelInnerProps>(
	({
		data,
		graphId,
		selectedEntityId,
		onSelectEntity,
		onNodeDoubleClick,
		onUpstreamDownstreamChange,
		onEdgeClick,
		onNodeContextMenu,
		onSelectNode,
	}) => {
		const navigate = useNavigate();
		const [selectedNode, setSelectedNode] = useState<string>(
			selectedEntityId || "",
		);

		const { entityId: urlEntityId } = useParams<{ entityId: string }>();

		const rootEntityId = useMemo(() => {
			return urlEntityId ? decodeURIComponent(urlEntityId) : "";
		}, [urlEntityId]);

		useEffect(() => {
			setSelectedNode(selectedEntityId || rootEntityId || "");
		}, [selectedEntityId, rootEntityId]);
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("TB");
		const [depthLimit, setDepthLimit] = useState(1);
		const [isDepthPanelOpen, setIsDepthPanelOpen] = useState(true);
		const { fitView, setCenter, getNode } = useReactFlow();
		const hasFocusedRootInitiallyRef = useRef(false);
		const prevDepthLimitRef = useRef(depthLimit);
		const {
			hoveredAttribute,
			setHoveredAttribute,
			selectedAttribute,
			setSelectedAttribute,
			searchMatchedEntities,
			globalSearchQuery,
			zoomToNodeId,
			setZoomToNode,
		} = useDashboardStore();

		// Dialog state
		const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
		const [dialogEntity, setDialogEntity] = useState<DataLineageEntity | null>(
			null,
		);
		const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
		const [selectedConnection, setSelectedConnection] =
			useState<EntityConnection | null>(null);

		const { showFullGraphByDefault } = useGraphSettingsStore();

		const lineageGraph = useMemo(
			() => buildLineageGraph(data?.mappings || []),
			[data?.mappings],
		);

		const maxTraversalDepth = useMemo(() => {
			if (!selectedNode) return 1;
			const upstreamMax = getMaxDepthFromNode(
				selectedNode,
				lineageGraph.upstream,
			);
			const downstreamMax = getMaxDepthFromNode(
				selectedNode,
				lineageGraph.downstream,
			);
			return Math.max(1, upstreamMax, downstreamMax);
		}, [selectedNode, lineageGraph]);

		useEffect(() => {
			if (depthLimit > maxTraversalDepth) {
				setDepthLimit(maxTraversalDepth);
			}
			if (depthLimit < 1) {
				setDepthLimit(1);
			}
		}, [depthLimit, maxTraversalDepth]);

		// Calculate upstream/downstream counts for each entity
		const { upstreamCounts, downstreamCounts } = useMemo(() => {
			const upCounts = new Map<string, number>();
			const downCounts = new Map<string, number>();
			for (const entity of data?.entities || []) {
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
		}, [data?.entities, lineageGraph]);

		// Calculate upstream/downstream for selected node
		const { upstreamNodes, downstreamNodes } = useMemo(() => {
			if (!selectedNode)
				return {
					upstreamNodes: new Set<string>(),
					downstreamNodes: new Set<string>(),
				};
			const upstream = getUpstreamNodesLimited(
				selectedNode,
				lineageGraph.upstream,
				depthLimit,
			);
			const downstream = getDownstreamNodesLimited(
				selectedNode,
				lineageGraph.downstream,
				depthLimit,
			);
			upstream.delete(selectedNode);
			downstream.delete(selectedNode);
			return { upstreamNodes: upstream, downstreamNodes: downstream };
		}, [selectedNode, lineageGraph, depthLimit]);

		// Find related entities (upstream + downstream from main entity)
		const relatedEntityIds = useMemo(() => {
			if (!selectedNode) return new Set<string>();
			const upstream = getUpstreamNodesLimited(
				selectedNode,
				lineageGraph.upstream,
				depthLimit,
			);
			const downstream = getDownstreamNodesLimited(
				selectedNode,
				lineageGraph.downstream,
				depthLimit,
			);
			return new Set([...upstream, ...downstream]);
		}, [selectedNode, lineageGraph, depthLimit]);

		// Filter entities to show only related ones
		const filteredEntities = useMemo(() => {
			return data?.entities.filter((e) => relatedEntityIds.has(e.id)) || [];
		}, [data, relatedEntityIds]);

		// Build connections for dialogs
		const entityConnections = useMemo(() => {
			const connections: EntityConnection[] = [];
			const entityMap = new Map<string, DataLineageEntity>();
			for (const e of filteredEntities) {
				entityMap.set(e.id, e);
			}

			data?.mappings.forEach((mapping) => {
				if (!mapping.deps) return;
				mapping.deps.forEach((dep) => {
					if (
						!relatedEntityIds.has(dep.entityId) ||
						!relatedEntityIds.has(mapping.entityId)
					)
						return;
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
						description: getEdgeDescription(
							sourceEntity,
							targetEntity,
							selectedEntityId ?? "",
						),
					});
				});
			});
			return connections;
		}, [data?.mappings, filteredEntities, relatedEntityIds, selectedEntityId]);

		// Notify parent about upstream/downstream changes
		useEffect(() => {
			onUpstreamDownstreamChange(upstreamNodes, downstreamNodes);
		}, [upstreamNodes, downstreamNodes, onUpstreamDownstreamChange]);

		const handleNodeClick = useCallback(
			(id: string) => {
				onSelectEntity(id);
				if (onSelectNode) {
					onSelectNode(id);
				}
			},
			[onSelectEntity, onSelectNode],
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

		const handleClearSelectedAttribute = useCallback(() => {
			setSelectedAttribute(null);
		}, [setSelectedAttribute]);

		const handlePaneClick = useCallback(() => {
			setSelectedAttribute(null);
		}, [setSelectedAttribute]);

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

		const handleViewDetails = useCallback(
			(entityId: string) => {
				const entity = filteredEntities.find((e) => e.id === entityId);
				if (entity) {
					setDialogEntity(entity);
					setIsEntityDialogOpen(true);
				}
			},
			[filteredEntities],
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
			for (const mapping of data?.mappings || []) {
				if (!mapping.deps) continue;
				for (const dep of mapping.deps) {
					if (!dep.attrMaps) continue;
					for (const attrMap of dep.attrMaps) {
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
					}
				}
			}
			return connections;
		}, [data?.mappings]);

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
				for (const key of connectedAttrs) {
					const [entityId, attrName] = key.split("::");
					if (!result.has(entityId)) {
						result.set(entityId, new Set());
					}
					result.get(entityId)!.add(attrName);
				}
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
				for (const key of connectedAttrs) {
					const [entityId, attrName] = key.split("::");
					if (!result.has(entityId)) {
						result.set(entityId, new Set());
					}
					result.get(entityId)!.add(attrName);
				}
			}
			return result;
		}, [selectedAttribute, attrConnectionMap]);

		// Get selected entity
		const selectedEntity = useMemo(() => {
			if (!selectedNode) return null;
			return filteredEntities.find((e) => e.id === selectedNode) || null;
		}, [selectedNode, filteredEntities]);

		// Create nodes and edges
		const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
			// Deduplicate entities by ID (keep first occurrence)
			const seenEntityIds = new Set<string>();
			const allUniqueEntities: DataLineageEntity[] = [];
			for (const entity of data?.entities || []) {
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
				allUniqueEntities.push(entity);
			}

			const edges: Edge[] = [];
			const edgeSet = new Set<string>();

			// Filter entities based on showFullGraphByDefault setting
			// When disabled, only show entities that match the search query
			const hasActiveSearch =
				!!globalSearchQuery && searchMatchedEntities.size > 0;

			let uniqueEntities: DataLineageEntity[];

			if (showFullGraphByDefault) {
				// Show all entities
				uniqueEntities = allUniqueEntities;
			} else if (hasActiveSearch) {
				// Only show matched entities and their connected entities (upstream/downstream of selected)
				const matchedIds = new Set(searchMatchedEntities.keys());
				// Also include selected entity and its upstream/downstream
				if (selectedNode) {
					matchedIds.add(selectedNode);
					for (const id of upstreamNodes) matchedIds.add(id);
					for (const id of downstreamNodes) matchedIds.add(id);
				}
				uniqueEntities = allUniqueEntities.filter((e) => matchedIds.has(e.id));
			} else {
				// No search active and showFullGraphByDefault is false - show empty graph
				// But still show selected entity and its connections if any
				if (selectedNode) {
					const visibleIds = new Set([selectedNode]);
					for (const id of upstreamNodes) visibleIds.add(id);
					for (const id of downstreamNodes) visibleIds.add(id);
					uniqueEntities = allUniqueEntities.filter((e) =>
						visibleIds.has(e.id),
					);
				} else {
					uniqueEntities = [];
				}
			}

			const entityMap = new Map<string, DataLineageEntity>();
			for (const entity of uniqueEntities) entityMap.set(entity.id, entity);

			// Build attribute-level highlight maps for each entity
			// Maps entity ID -> Set of source/target attr names that have edges
			const entitySourceAttrs = new Map<string, Set<string>>();
			const entityTargetAttrs = new Map<string, Set<string>>();

			// Process mappings to find all attribute connections
			for (const mapping of data?.mappings || []) {
				if (!mapping.deps) continue;
				for (const dep of mapping.deps) {
					if (!dep.attrMaps || dep.attrMaps.length === 0) continue;
					for (const attrMap of dep.attrMaps) {
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
					}
				}
			}

			const isSearchActive =
				!!globalSearchQuery && searchMatchedEntities.size > 0;

			const nodes: any[] = filteredEntities.flatMap((entity) => {
				let highlightType: EntityNodeData["highlightType"] = "none";
				const searchScore = searchMatchedEntities.get(entity.id);
				const isSearchMatch = globalSearchQuery && searchScore !== undefined;

				if (entity.id === selectedNode) highlightType = "selected";
				else if (upstreamNodes.has(entity.id)) highlightType = "upstream";
				else if (downstreamNodes.has(entity.id)) highlightType = "downstream";
				else if (isSearchMatch) highlightType = "searchMatch";

				const node = {
					id: entity.id,
					type: "entityNode",
					position: { x: 0, y: 0 },
					data: {
						entity,
						highlightType,
						onNodeClick: handleNodeClick,
						onNodeDoubleClick: handleNodeDblClick,
						onOpenEntity: handleOpenEntity,
						onViewDetails: handleViewDetails,
						onAttrHover: handleAttrHover,
						onAttrClick: handleAttrClick,
						graphId,
						entityCount: filteredEntities?.length,
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
						isSearchActive,
						isSearchMatch: !!isSearchMatch,
					},
				};

				return node;
			});

			// Build a map of all attributes each entity actually has
			const entityAttrNames = new Map<string, Set<string>>();
			for (const entity of uniqueEntities) {
				const attrNames = new Set((entity.attrSeq || []).map((a) => a.name));
				entityAttrNames.set(entity.id, attrNames);
			}

			for (const mapping of data?.mappings || []) {
				if (!mapping.deps) continue;
				for (const dep of mapping.deps) {
					// Skip if source or target entity doesn't exist in graph
					if (!dep.entityId || !mapping.entityId) {
						console.warn(
							"[Graph] Mapping with null entityId skipped:",
							dep.entityId,
							"->",
							mapping.entityId,
						);
						continue;
					}
					if (
						!entityMap.has(dep.entityId) ||
						!entityMap.has(mapping.entityId)
					) {
						// Entity referenced in mapping but not in entities list
						continue;
					}

					// Determine edge highlight type based on upstream/downstream relationship
					// Edge goes from dep.entityId (source) -> mapping.entityId (target)
					let edgeHighlightType: "none" | "upstream" | "downstream" = "none";

					if (dep.entityId === selectedNode) {
						// Source is selected -> edge goes downstream
						edgeHighlightType = "downstream";
					} else if (mapping.entityId === selectedNode) {
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

					// Always render entity-level edges
					const edgeId = `${dep.entityId}->${mapping.entityId}`;
					if (edgeSet.has(edgeId)) continue;
					edgeSet.add(edgeId);

					// Count attribute mappings for label
					const attrCount = dep.attrMaps?.length || 0;

					edges.push({
						id: edgeId,
						source: dep.entityId,
						target: mapping.entityId,
						sourceHandle: "entity-source",
						targetHandle: "entity-target",
						type: "default",
						animated: isEntityHighlighted,
						style: {
							stroke: edgeHighlightColor,
							strokeWidth: isEntityHighlighted ? 2 : 1,
							opacity: 0.8,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: edgeHighlightColor,
						},
						// Show mapping count in entities mode
						label: attrCount > 0 ? `${attrCount} маппингов` : undefined,
						labelStyle: { fontSize: 9, fill: "#666" },
						labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
					});

					// Render attribute-level edges only when an attribute is selected
					if (
						selectedAttribute !== null &&
						dep.attrMaps &&
						dep.attrMaps.length > 0
					) {
						for (const attrMap of dep.attrMaps) {
							const isSelectedSrc =
								selectedAttribute.entityId === dep.entityId &&
								selectedAttribute.attrName === attrMap.src;
							const isSelectedDst =
								selectedAttribute.entityId === mapping.entityId &&
								selectedAttribute.attrName === attrMap.dst;
							if (!isSelectedSrc && !isSelectedDst) continue;

							const attrEdgeId = `${dep.entityId}::${attrMap.src}->${mapping.entityId}::${attrMap.dst}`;
							if (edgeSet.has(attrEdgeId)) continue;
							edgeSet.add(attrEdgeId);

							// Ensure entities actually have these attributes
							const srcEntityHasAttr =
								entityAttrNames.get(dep.entityId)?.has(attrMap.src) ?? false;
							const dstEntityHasAttr =
								entityAttrNames.get(mapping.entityId)?.has(attrMap.dst) ??
								false;
							if (!srcEntityHasAttr || !dstEntityHasAttr) continue;

							edges.push({
								id: attrEdgeId,
								source: dep.entityId,
								target: mapping.entityId,
								sourceHandle: `attr-source-${attrMap.src}`,
								targetHandle: `attr-target-${attrMap.dst}`,
								type: "default",
								animated: true,
								style: {
									stroke: HIGHLIGHT_COLORS.selected,
									strokeWidth: 3,
									opacity: 0.9,
								},
								markerEnd: {
									type: MarkerType.ArrowClosed,
									color: HIGHLIGHT_COLORS.selected,
									width: 12,
									height: 12,
								},
							});
						}
					}
				}
			}

			console.log({ nodes, edges });
			return { nodes, edges };
		}, [
			data,
			graphId,
			selectedNode,
			upstreamNodes,
			downstreamNodes,
			handleNodeClick,
			handleNodeDblClick,
			handleAttrHover,
			handleAttrClick,
			upstreamCounts,
			downstreamCounts,
			hoverHighlightedByEntity,
			selectedAttribute,
			searchMatchedEntities,
			globalSearchQuery,
			showFullGraphByDefault,
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

		// Context menu state
		const [contextMenu, setContextMenu] = useState<{
			entityId: string;
			entityName: string;
			entityType: string;
			x: number;
			y: number;
		} | null>(null);

		// Context menu handlers
		const handleNodeContextMenu = useCallback(
			(event: React.MouseEvent, node: Node) => {
				event.preventDefault();
				const entityNode = node as unknown as EntityNode;
				setContextMenu({
					entityId: node.id,
					entityName:
						entityNode.data?.entity.name || entityNode.data?.entity.id,
					entityType: entityNode.data?.entity.type,
					x: event.clientX,
					y: event.clientY,
				});
			},
			[],
		);

		const { setRevealPosition } = useDataLineageStore();

		const handleCloseContextMenu = useCallback(() => {
			setContextMenu(null);
		}, []);

		const handleContextMenuViewDetails = useCallback(() => {
			if (contextMenu) {
				const entity = filteredEntities.find(
					(e) => e.id === contextMenu.entityId,
				);
				if (entity) {
					setDialogEntity(entity);
					setIsEntityDialogOpen(true);
				}
			}
			setContextMenu(null);
		}, [contextMenu, filteredEntities]);

		const handleContextMenuGoToEntity = useCallback(() => {
			if (contextMenu) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				navigate(`/entity/${encodedId}`);
			}
			setContextMenu(null);
		}, [contextMenu, navigate]);

		const handleContextMenuOpenInNewTab = useCallback(() => {
			if (contextMenu) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				window.open(`/entity/${encodedId}`, "_blank");
			}
			setContextMenu(null);
		}, [contextMenu]);

		const handleContextMenuShowInEditor = useCallback(() => {
			if (contextMenu) {
				setRevealPosition({ nodeId: contextMenu.entityId, from: "graph" });
			}
			setContextMenu(null);
		}, [contextMenu, setRevealPosition]);

		const handleContextMenuCopyId = useCallback(() => {
			if (contextMenu) {
				navigator.clipboard.writeText(contextMenu.entityId);
			}
			setContextMenu(null);
		}, [contextMenu]);

		const handleContextMenuZoomToNode = useCallback(() => {
			if (contextMenu) {
				const node = getNode(contextMenu.entityId);
				if (node) {
					const x = node.position.x + (node.measured?.width ?? 260) / 2;
					const y = node.position.y + (node.measured?.height ?? 100) / 2;
					setCenter(x, y, { zoom: 1.2, duration: 500 });
				}
			}
			setContextMenu(null);
		}, [contextMenu, getNode, setCenter]);

		const handleContextMenuZoomInDashboard = useCallback(() => {
			if (contextMenu) {
				setZoomToNode(contextMenu.entityId);
				navigate("/");
			}
			setContextMenu(null);
		}, [contextMenu, setZoomToNode, navigate]);

		const focusRootEntityNode = useCallback(() => {
			if (!rootEntityId) return;
			const node = getNode(rootEntityId);
			if (!node) return;
			const x = node.position.x + (node.measured?.width ?? 280) / 2;
			const y = node.position.y + (node.measured?.height ?? 100) / 2;
			setCenter(x, y, { duration: 500 });
		}, [getNode, rootEntityId, setCenter]);

		// Open entity page with selected attribute highlight
		const handleGoToEntityWithSelectedAttr = useCallback(() => {
			if (contextMenu && selectedAttribute) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				navigate(
					`/entity/${encodedId}?highlightAttr=${encodeURIComponent(selectedAttribute.attrName)}`,
				);
			}
			setContextMenu(null);
		}, [contextMenu, selectedAttribute, navigate]);

		// Open Dashboard with entity and selected attribute highlight via URL params
		const handleGoToDashboardWithSelectedAttr = useCallback(() => {
			if (contextMenu && selectedAttribute) {
				const params = new URLSearchParams();
				params.set("entityId", contextMenu.entityId);
				params.set("attrName", selectedAttribute.attrName);
				navigate(`/?${params.toString()}`);
			}
			setContextMenu(null);
		}, [contextMenu, selectedAttribute, navigate]);

		useEffect(() => {
			setNodes(layoutedNodes as Node[]);
			setEdges(layoutedEdges);
		}, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

		useEffect(() => {
			if (hasFocusedRootInitiallyRef.current) return;
			if (!rootEntityId) return;
			const exists = nodes.some((n) => n.id === rootEntityId);
			if (!exists) return;
			const handle = window.setTimeout(() => {
				focusRootEntityNode();
				hasFocusedRootInitiallyRef.current = true;
			}, 150);
			return () => window.clearTimeout(handle);
		}, [focusRootEntityNode, nodes, rootEntityId]);

		useEffect(() => {
			if (!rootEntityId) return;
			if (prevDepthLimitRef.current === depthLimit) return;
			const exists = nodes.some((n) => n.id === rootEntityId);
			if (!exists) {
				prevDepthLimitRef.current = depthLimit;
				return;
			}
			const handle = window.setTimeout(() => {
				focusRootEntityNode();
			}, 150);
			prevDepthLimitRef.current = depthLimit;
			return () => window.clearTimeout(handle);
		}, [depthLimit, focusRootEntityNode, nodes, rootEntityId]);

		useEffect(() => {
			const timer = setTimeout(
				() => fitView({ padding: 0.1, duration: 300 }),
				100,
			);
			return () => clearTimeout(timer);
		}, [layoutDirection, fitView, data]);

		// Handle zoom to node request from context menu
		useEffect(() => {
			if (zoomToNodeId) {
				const node = getNode(zoomToNodeId);
				if (node) {
					const x = node.position.x + (node.measured?.width ?? 280) / 2;
					const y = node.position.y + (node.measured?.height ?? 100) / 2;
					setCenter(x, y, { zoom: 1.2, duration: 500 });
				}
				// Reset after zooming
				setZoomToNode(null);
			}
		}, [zoomToNodeId, getNode, setCenter, setZoomToNode]);

		return (
			<div style={{ width: "100%", height: "100%", position: "relative" }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onEdgeClick={handleEdgeClick}
					onNodeContextMenu={handleNodeContextMenu}
					onPaneClick={handlePaneClick}
					nodeTypes={graphNodeTypes}
					nodesDraggable
					fitView
					minZoom={0.1}
					maxZoom={2}
					defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
					proOptions={{ hideAttribution: true }}
				>
					<Background color="#e0e0e0" gap={20} />
					<Controls>
						<div data-name="scroll_to_main_node">
							<button
								onClick={focusRootEntityNode}
								disabled={!rootEntityId}
								style={{
									width: 26,
									height: 26,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "#fff",
									border: "none",
									cursor: rootEntityId ? "pointer" : "not-allowed",
									padding: 0,
								}}
								title="К основной ноде"
								type="button"
							>
								<CenterFocusStrong style={{ fontSize: 16, color: "#666" }} />
							</button>
						</div>
						<div data-name="open_depth_panel">
							<button
								onClick={() => setIsDepthPanelOpen(!isDepthPanelOpen)}
								style={{
									width: 26,
									height: 26,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "#fff",
									border: "none",
									cursor: rootEntityId ? "pointer" : "not-allowed",
									padding: 0,
								}}
								title="Глубина"
								type="button"
							>
								<AccountTreeIcon style={{ fontSize: 16, color: "#666" }} />
							</button>
						</div>
					</Controls>
					<MiniMap
						nodeColor={(node) => {
							const entityNode = node as unknown as EntityNode;
							if (entityNode.data?.highlightType === "selected")
								return HIGHLIGHT_COLORS.selected;
							if (entityNode.data?.highlightType === "upstream")
								return HIGHLIGHT_COLORS.upstream;
							if (entityNode.data?.highlightType === "downstream")
								return HIGHLIGHT_COLORS.downstream;
							return (
								TYPE_COLORS[entityNode.data?.entity.type]?.border || "#999"
							);
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
							<div style={{ marginBottom: 8 }}>
								<div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
									Граф зависимостей
								</div>
								<div style={{ fontSize: 11, color: "#666" }}>
									{filteredEntities.length} связанных сущностей
								</div>
							</div>
							<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
								{selectedAttribute && (
									<button
										onClick={handleClearSelectedAttribute}
										style={{
											padding: "6px 12px",
											border: "1px solid #ddd",
											borderRadius: 6,
											background: "#fff",
											cursor: "pointer",
											fontSize: 11,
										}}
										title={selectedAttribute.attrName}
										type="button"
									>
										✕ Очистить атрибут
									</button>
								)}
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
									type="button"
								>
									{layoutDirection === "LR" ? "↔ Гориз." : "↕ Верт."}
								</button>
							</div>
						</div>
					</Panel>
					{selectedNode && maxTraversalDepth > 1 && (
						<Panel position="bottom-center">
							{isDepthPanelOpen ? (
								<div
									style={{
										background: "#fff",
										padding: "8px 10px",
										borderRadius: 10,
										boxShadow: "0 2px 10px rgba(0,0,0,0.10)",

										minWidth: 240,
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "center",
											fontSize: 10,
											color: "#666",
											marginBottom: 4,
										}}
									>
										<span>
											Глубина: {depthLimit} / {maxTraversalDepth}
										</span>
									</div>
									<input
										type="range"
										min={1}
										max={maxTraversalDepth}
										step={1}
										value={depthLimit}
										onChange={(e) => {
											setDepthLimit(Number(e.target.value));
										}}
										style={{ width: "100%" }}
									/>
								</div>
							) : null}
						</Panel>
					)}
				</ReactFlow>
				{/* Selected Entity Info */}
				{selectedEntity && selectedEntity.id !== urlEntityId && (
					<div
						style={{
							position: "absolute",
							top: 12,
							right: 12,
							background: "#fff",
							padding: 12,
							borderRadius: 8,
							boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
							maxWidth: 280,
							zIndex: 1000,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-start",
								marginBottom: 8,
							}}
						>
							<div>
								<div
									style={{
										fontSize: 10,
										color: "#666",
										textTransform: "uppercase",
									}}
								>
									{selectedEntity.type}
								</div>
								<div
									style={{
										fontWeight: 600,
										fontSize: 13,
										wordBreak: "break-word",
									}}
								>
									{selectedEntity.name || selectedEntity.id}
								</div>
							</div>
							<button
								onClick={() => setSelectedNode(urlEntityId ?? "")}
								style={{
									background: "none",
									border: "none",
									fontSize: 16,
									cursor: "pointer",
									color: "#666",
									padding: 0,
								}}
							>
								×
							</button>
						</div>

						{selectedEntity.namespace && (
							<div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
								{selectedEntity.namespace}
							</div>
						)}

						<div style={{ fontSize: 11, marginBottom: 8 }}>
							<strong>Атрибутов:</strong> {selectedEntity.attrSeq?.length || 0}
						</div>

						<button
							onClick={() => handleOpenEntity(selectedEntity.id)}
							style={{
								width: "100%",
								padding: "8px 12px",
								background: "#1976d2",
								color: "#fff",
								border: "none",
								borderRadius: 6,
								fontSize: 11,
								fontWeight: 500,
								cursor: "pointer",
							}}
						>
							↗ Открыть карточку
						</button>
					</div>
				)}

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
						selectedAttribute={selectedAttribute}
					/>
				)}

				{/* Context Menu */}
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
					{contextMenu && (
						<MenuItem disabled sx={{ opacity: "1 !important" }}>
							<ListItemText
								primary={contextMenu.entityName}
								secondary={contextMenu.entityType}
								primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
								secondaryTypographyProps={{ fontSize: 11 }}
							/>
						</MenuItem>
					)}
					<Divider />
					<MenuItem onClick={handleContextMenuViewDetails}>
						<ListItemIcon>
							<Info fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Подробности" />
					</MenuItem>
					<MenuItem onClick={handleContextMenuGoToEntity}>
						<ListItemIcon>
							<OpenInNew fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Открыть страницу" />
					</MenuItem>
					<MenuItem onClick={handleContextMenuOpenInNewTab}>
						<ListItemIcon>
							<OpenInNew fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Открыть в новой вкладке" />
					</MenuItem>
					{selectedAttribute &&
						contextMenu?.entityId === selectedAttribute.entityId && (
							<MenuItem onClick={handleGoToEntityWithSelectedAttr}>
								<ListItemIcon>
									<OpenInNew fontSize="small" />
								</ListItemIcon>
								<ListItemText
									primary="Открыть с выделением атрибута"
									secondary={selectedAttribute.attrName}
								/>
							</MenuItem>
						)}
					{selectedAttribute &&
						contextMenu?.entityId === selectedAttribute.entityId && (
							<MenuItem onClick={handleGoToDashboardWithSelectedAttr}>
								<ListItemIcon>
									<CenterFocusStrong fontSize="small" />
								</ListItemIcon>
								<ListItemText
									primary="В Dashboard с выделением"
									secondary={selectedAttribute.attrName}
								/>
							</MenuItem>
						)}
					<Divider />
					<MenuItem onClick={handleContextMenuZoomToNode}>
						<ListItemIcon>
							<CenterFocusStrong fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Центрировать" />
					</MenuItem>
					<MenuItem onClick={handleContextMenuZoomInDashboard}>
						<ListItemIcon>
							<CenterFocusStrong fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в Dashboard" />
					</MenuItem>
					{/* <MenuItem onClick={handleContextMenuShowInEditor}>
						<ListItemIcon>
							<Code fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в редакторе" />
					</MenuItem> */}
					<MenuItem onClick={handleContextMenuCopyId}>
						<ListItemIcon>
							<ContentCopy fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Копировать ID" />
					</MenuItem>
				</Menu>
			</div>
		);
	},
);

ModelGraphPanelInner.displayName = "ModelGraphPanelInner";
