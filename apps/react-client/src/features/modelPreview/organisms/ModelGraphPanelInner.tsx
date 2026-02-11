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
import { useGraphSettingsStore } from "@react-client/common/store/graphSettingsStore";
import { useDashboardStore } from "../../dashboard/stores";
import { graphNodeTypes } from "./ModelNodePreviewComponent";
import { buildLineageGraph } from "../../dashboard/utils";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	DEPTH_LEVEL_COLORS,
} from "../../dashboard/constants";
import type { EntityConnection, EntityNodeData } from "../../dashboard/types";
import { useParams } from "react-router-dom";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";
import {
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	AccountTree,
	CenterFocusStrong,
	ContentCopy,
	Info,
	OpenInNew,
	SwapHoriz,
	SwapVert,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { getLayoutedElements } from "@react-client/features/modelPreview/utils/dagreLayout";

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

const computeNodeDepths = (
	rootId: string,
	upstream: Map<string, Set<string>>,
	downstream: Map<string, Set<string>>,
	visibleNodeIds: Set<string>,
): Map<string, number> => {
	const depths = new Map<string, number>();
	if (!rootId) return depths;
	depths.set(rootId, 0);

	// BFS upstream (negative depths)
	let frontier: string[] = [rootId];
	let level = 0;
	const visitedUp = new Set<string>([rootId]);
	while (frontier.length > 0) {
		level -= 1;
		const next: string[] = [];
		for (const current of frontier) {
			const parents = upstream.get(current);
			if (!parents) continue;
			for (const parent of parents) {
				if (visitedUp.has(parent) || !visibleNodeIds.has(parent)) continue;
				visitedUp.add(parent);
				depths.set(parent, level);
				next.push(parent);
			}
		}
		frontier = next;
	}

	// BFS downstream (positive depths)
	frontier = [rootId];
	level = 0;
	const visitedDown = new Set<string>([rootId]);
	while (frontier.length > 0) {
		level += 1;
		const next: string[] = [];
		for (const current of frontier) {
			const children = downstream.get(current);
			if (!children) continue;
			for (const child of children) {
				if (visitedDown.has(child) || !visibleNodeIds.has(child)) continue;
				visitedDown.add(child);
				if (!depths.has(child)) {
					depths.set(child, level);
				}
				next.push(child);
			}
		}
		frontier = next;
	}

	return depths;
};

const DEPTH_GROUP_PADDING = 40;

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
	entity: DataLineageEntity | null;
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
		entity,
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
			selectedAttributes,
			toggleSelectedAttribute,
			clearSelectedAttributes,
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
				if (
					id.startsWith("__model_node__") ||
					id.startsWith("__model__fake_node__")
				) {
					const inputVectorId = id
						.replace("__model_node__", "")
						.replace("__model__fake_node__", "");
					onSelectEntity(inputVectorId);
					return;
				}
				onSelectEntity(id);
				if (onSelectNode) {
					const entity = data?.entities.find((e) => e.id === id);
					if (entity) {
						onSelectNode(entity);
					}
				}
			},
			[data, onSelectEntity, onSelectNode],
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
			clearSelectedAttributes();
		}, [clearSelectedAttributes]);

		const handlePaneClick = useCallback(() => {
			clearSelectedAttributes();
		}, [clearSelectedAttributes]);

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
				toggleSelectedAttribute({ entityId, attrName });
			},
			[toggleSelectedAttribute],
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
		// BFS traversal from all selected attributes
		const selectedHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (selectedAttributes.length === 0) return result;

			const visited = new Set<string>();
			const queue: string[] = [];

			for (const attr of selectedAttributes) {
				const key = `${attr.entityId}::${attr.attrName}`;
				if (!visited.has(key)) {
					visited.add(key);
					queue.push(key);
				}
			}

			while (queue.length > 0) {
				const current = queue.shift()!;
				const [entityId, attrName] = current.split("::");
				if (!result.has(entityId)) {
					result.set(entityId, new Set());
				}
				result.get(entityId)!.add(attrName);

				const neighbors = attrConnectionMap.get(current);
				if (neighbors) {
					for (const neighbor of neighbors) {
						if (!visited.has(neighbor)) {
							visited.add(neighbor);
							queue.push(neighbor);
						}
					}
				}
			}
			return result;
		}, [selectedAttributes, attrConnectionMap]);

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

			// Add synthetic "model" node to visually separate model and input_vector
			if (selectedNode) {
				const selected = filteredEntities.find((e) => e.id === selectedNode);
				if (selected?.type === "input_vector") {
					const modelNodeId = `__model__fake_node__${selectedNode}`;
					nodes.push({
						id: modelNodeId,
						type: "entityNode",
						position: { x: 0, y: 0 },
						data: {
							entity: {
								id: modelNodeId,
								modified: false,
								type: "Model",
								name: entity?.namespace || "",
								description: data?.desc.appId || "",
								attrSeq: [],
							} as any,
							highlightType: "none",
							onNodeClick: handleNodeClick,
							onNodeDoubleClick: handleNodeDblClick,
							onOpenEntity: handleOpenEntity,
							onViewDetails: handleViewDetails,
							onAttrHover: handleAttrHover,
							onAttrClick: handleAttrClick,
							graphId,
							entityCount: filteredEntities?.length,
							upstreamCount: 0,
							downstreamCount: 0,
							highlightedSourceAttrs: new Set<string>(),
							highlightedTargetAttrs: new Set<string>(),
							hoverHighlightedAttrs: new Set<string>(),
							selectedHighlightedAttrs: new Set<string>(),
							isSearchActive,
							isSearchMatch: false,
						},
					});

					const syntheticEdgeId = `${modelNodeId}->${selectedNode}`;
					if (!edgeSet.has(syntheticEdgeId)) {
						edgeSet.add(syntheticEdgeId);
						edges.push({
							id: syntheticEdgeId,
							source: modelNodeId,
							target: selectedNode,
							sourceHandle: "entity-source",
							targetHandle: "entity-target",
							type: "default",
							animated: false,
							style: {
								stroke: "#9aa0a6",
								strokeWidth: 1,
								strokeDasharray: "4 4",
								opacity: 0.7,
							},
							markerEnd: {
								type: MarkerType.ArrowClosed,
								color: "#9aa0a6",
							},
							label: "model",
							labelStyle: { fontSize: 9, fill: "#777" },
							labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
						});
					}
				}
			}

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

					// Render attribute-level edges only when attributes are selected
					if (
						selectedAttributes.length > 0 &&
						dep.attrMaps &&
						dep.attrMaps.length > 0
					) {
						const sourceHighlighted = selectedHighlightedByEntity.get(
							dep.entityId,
						);
						const targetHighlighted = selectedHighlightedByEntity.get(
							mapping.entityId,
						);
						for (const attrMap of dep.attrMaps) {
							const isSelectedSrc =
								sourceHighlighted?.has(attrMap.src) ?? false;
							const isSelectedDst =
								targetHighlighted?.has(attrMap.dst) ?? false;
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
			selectedAttributes,
			selectedHighlightedByEntity,
			searchMatchedEntities,
			globalSearchQuery,
			showFullGraphByDefault,
		]);

		// Compute depth levels for each visible node relative to selectedNode
		const nodeDepths = useMemo(() => {
			const visibleIds = new Set(initialNodes.map((n: { id: string }) => n.id));
			const depths = computeNodeDepths(
				selectedNode,
				lineageGraph.upstream,
				lineageGraph.downstream,
				visibleIds,
			);
			if (selectedNode) {
				const modelNodeId = `__model__fake_node__${selectedNode}`;
				if (visibleIds.has(modelNodeId)) depths.set(modelNodeId, 0);
			}
			return depths;
		}, [selectedNode, lineageGraph, initialNodes]);

		// Apply layout, then inject depth-level group nodes (sub-flows)
		const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
			const { nodes: dagreNodes, edges: dagreEdges } = getLayoutedElements(
				initialNodes,
				initialEdges,
				layoutDirection,
			);

			if (!selectedNode || nodeDepths.size === 0) {
				return { nodes: dagreNodes, edges: dagreEdges };
			}

			// Group nodes by their depth level
			const depthBuckets = new Map<number, typeof dagreNodes>();
			for (const node of dagreNodes) {
				const depth = nodeDepths.get(node.id);
				if (depth === undefined) continue;
				if (!depthBuckets.has(depth)) depthBuckets.set(depth, []);
				depthBuckets.get(depth)!.push(node);
			}

			if (depthBuckets.size <= 1) {
				return { nodes: dagreNodes, edges: dagreEdges };
			}

			// --- Pass 1: compute raw bounding box per depth level ---
			const sortedDepths = [...depthBuckets.keys()].sort((a, b) => a - b);
			const isHorizontal = layoutDirection === "LR";

			const getNodeW = (node: (typeof dagreNodes)[0]) =>
				node.measured?.width ??
				(node as unknown as { width?: number }).width ??
				320;
			const getNodeH = (node: (typeof dagreNodes)[0]) =>
				node.measured?.height ??
				(node as unknown as { height?: number }).height ??
				140;

			type BBox = { minX: number; minY: number; maxX: number; maxY: number };
			const rawBoxes = new Map<number, BBox>();

			for (const depth of sortedDepths) {
				const bucket = depthBuckets.get(depth)!;
				let minX = Number.POSITIVE_INFINITY;
				let minY = Number.POSITIVE_INFINITY;
				let maxX = Number.NEGATIVE_INFINITY;
				let maxY = Number.NEGATIVE_INFINITY;
				for (const node of bucket) {
					const x = node.position.x;
					const y = node.position.y;
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x + getNodeW(node) > maxX) maxX = x + getNodeW(node);
					if (y + getNodeH(node) > maxY) maxY = y + getNodeH(node);
				}
				rawBoxes.set(depth, { minX, minY, maxX, maxY });
			}

			// --- Pass 2: resolve overlaps along the layout axis ---
			const GROUP_GAP = 10;
			const shiftByDepth = new Map<number, number>();
			for (const d of sortedDepths) shiftByDepth.set(d, 0);

			for (let i = 1; i < sortedDepths.length; i++) {
				const prevDepth = sortedDepths[i - 1];
				const currDepth = sortedDepths[i];
				const prevBox = rawBoxes.get(prevDepth)!;
				const currBox = rawBoxes.get(currDepth)!;
				const prevShift = shiftByDepth.get(prevDepth)!;

				if (isHorizontal) {
					const prevEnd = prevBox.maxX + prevShift + DEPTH_GROUP_PADDING;
					const currStart =
						currBox.minX + shiftByDepth.get(currDepth)! - DEPTH_GROUP_PADDING;
					if (currStart < prevEnd + GROUP_GAP) {
						const delta = prevEnd + GROUP_GAP - currStart;
						for (let j = i; j < sortedDepths.length; j++) {
							shiftByDepth.set(
								sortedDepths[j],
								shiftByDepth.get(sortedDepths[j])! + delta,
							);
						}
					}
				} else {
					const prevEnd = prevBox.maxY + prevShift + DEPTH_GROUP_PADDING;
					const currStart =
						currBox.minY + shiftByDepth.get(currDepth)! - DEPTH_GROUP_PADDING;
					if (currStart < prevEnd + GROUP_GAP) {
						const delta = prevEnd + GROUP_GAP - currStart;
						for (let j = i; j < sortedDepths.length; j++) {
							shiftByDepth.set(
								sortedDepths[j],
								shiftByDepth.get(sortedDepths[j])! + delta,
							);
						}
					}
				}
			}

			// Apply shifts to node positions
			for (const depth of sortedDepths) {
				const shift = shiftByDepth.get(depth)!;
				if (shift === 0) continue;
				const bucket = depthBuckets.get(depth)!;
				for (const node of bucket) {
					if (isHorizontal) {
						node.position = { ...node.position, x: node.position.x + shift };
					} else {
						node.position = { ...node.position, y: node.position.y + shift };
					}
				}
			}

			// --- Pass 3: create group nodes from adjusted positions ---
			const groupNodes: Node[] = [];
			const childNodeUpdates = new Map<
				string,
				{ parentId: string; relX: number; relY: number }
			>();

			for (const depth of sortedDepths) {
				// Skip group for depth 0
				if (depth === 0) continue;
				const bucket = depthBuckets.get(depth)!;

				let minX = Number.POSITIVE_INFINITY;
				let minY = Number.POSITIVE_INFINITY;
				let maxX = Number.NEGATIVE_INFINITY;
				let maxY = Number.NEGATIVE_INFINITY;
				for (const node of bucket) {
					const x = node.position.x;
					const y = node.position.y;
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x + getNodeW(node) > maxX) maxX = x + getNodeW(node);
					if (y + getNodeH(node) > maxY) maxY = y + getNodeH(node);
				}

				const extraBottomPadding = 6;
				const groupX = minX - DEPTH_GROUP_PADDING;
				const groupY = minY - DEPTH_GROUP_PADDING - 24;
				const groupW = maxX - minX + DEPTH_GROUP_PADDING * 2;
				const groupH =
					maxY - minY + DEPTH_GROUP_PADDING * 2 + 24 + extraBottomPadding;

				const colorIdx =
					((depth % DEPTH_LEVEL_COLORS.length) + DEPTH_LEVEL_COLORS.length) %
					DEPTH_LEVEL_COLORS.length;
				const color = DEPTH_LEVEL_COLORS[colorIdx];

				const depthLabel =
					depth < 0 ? `Upstream ${Math.abs(depth)}` : `Downstream ${depth}`;

				const groupId = `__depth_group_${depth}`;
				groupNodes.push({
					id: groupId,
					type: "depthGroup",
					position: { x: groupX, y: groupY },
					data: { label: depthLabel },
					style: {
						width: groupW,
						height: groupH,
						backgroundColor: color.bg,
						border: `2px dashed ${color.border}`,
						borderRadius: 12,
						padding: 0,
						zIndex: -1,
					},
					draggable: false,
					selectable: false,
				} as Node);

				for (const node of bucket) {
					childNodeUpdates.set(node.id, {
						parentId: groupId,
						relX: node.position.x - groupX,
						relY: node.position.y - groupY,
					});
				}
			}

			const updatedChildNodes = dagreNodes.map((node) => {
				const update = childNodeUpdates.get(node.id);
				if (!update) return node;
				return {
					...node,
					parentId: update.parentId,
					position: { x: update.relX, y: update.relY },
				};
			});

			return {
				nodes: [...groupNodes, ...updatedChildNodes],
				edges: dagreEdges,
			};
		}, [initialNodes, initialEdges, layoutDirection, selectedNode, nodeDepths]);

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
				// Skip context menu for group nodes
				if (node.id.startsWith("__depth_group_")) return;
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
			setCenter(x, y, { duration: 500, zoom: 1 });
		}, [getNode, rootEntityId, setCenter]);

		const handleDepthLegendClick = useCallback(
			(depth: number) => {
				const targetId = depth === 0 ? selectedNode : `__depth_group_${depth}`;
				if (!targetId) return;
				const node = getNode(targetId);
				if (!node) return;
				const style = node.style as unknown as
					| { width?: number; height?: number }
					| undefined;
				const width = node.measured?.width ?? style?.width ?? 280;
				const height = node.measured?.height ?? style?.height ?? 120;
				const x = node.position.x + width / 2;
				const y = node.position.y + height / 2;
				setCenter(x, y, { zoom: 0.9, duration: 400 });
			},
			[getNode, selectedNode, setCenter],
		);

		// Open entity page with selected attribute highlight
		// Find first selected attribute for this context menu entity (for navigation)
		const contextMenuSelectedAttr = useMemo(() => {
			if (!contextMenu) return null;
			return (
				selectedAttributes.find((a) => a.entityId === contextMenu.entityId) ??
				null
			);
		}, [contextMenu, selectedAttributes]);

		const handleGoToEntityWithSelectedAttr = useCallback(() => {
			if (contextMenu && contextMenuSelectedAttr) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				navigate(
					`/entity/${encodedId}?highlightAttr=${encodeURIComponent(contextMenuSelectedAttr.attrName)}`,
				);
			}
			setContextMenu(null);
		}, [contextMenu, contextMenuSelectedAttr, navigate]);

		// Open Dashboard with entity and selected attribute highlight via URL params
		const handleGoToDashboardWithSelectedAttr = useCallback(() => {
			if (contextMenu && contextMenuSelectedAttr) {
				const params = new URLSearchParams();
				params.set("entityId", contextMenu.entityId);
				params.set("attrName", contextMenuSelectedAttr.attrName);
				navigate(`/?${params.toString()}`);
			}
			setContextMenu(null);
		}, [contextMenu, contextMenuSelectedAttr, navigate]);

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
					minZoom={0.01}
					maxZoom={1}
					defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
					proOptions={{ hideAttribution: true }}
					onlyRenderVisibleElements
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
								<AccountTree style={{ fontSize: 16, color: "#666" }} />
							</button>
						</div>
						<div data-name="toggle_layout_direction">
							<button
								onClick={() =>
									setLayoutDirection(layoutDirection === "LR" ? "TB" : "LR")
								}
								style={{
									width: 26,
									height: 26,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "#fff",
									border: "none",
									cursor: "pointer",
									padding: 0,
								}}
								title={
									layoutDirection === "LR" ? "Вертикальный" : "Горизонтальный"
								}
								type="button"
							>
								{layoutDirection === "LR" ? (
									<SwapVert style={{ fontSize: 16, color: "#666" }} />
								) : (
									<SwapHoriz style={{ fontSize: 16, color: "#666" }} />
								)}
							</button>
						</div>
					</Controls>
					<MiniMap
						nodeColor={(node) => {
							// Skip group nodes in minimap coloring
							if (node.id.startsWith("__depth_group_")) return "transparent";
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
								<div style={{ fontSize: 11, color: "#666" }}>
									{filteredEntities.length - 1} связанных сущностей
								</div>
							</div>
							{selectedNode && nodeDepths.size > 1 && (
								<div
									style={{
										marginTop: 10,
										borderTop: "1px solid #eee",
										paddingTop: 8,
									}}
								>
									<div
										style={{
											fontSize: 10,
											color: "#999",
											marginBottom: 4,
											textTransform: "uppercase",
											letterSpacing: 0.5,
										}}
									>
										Уровни глубины
									</div>
									{[...new Set(nodeDepths.values())]
										.sort((a, b) => a - b)
										.map((depth) => {
											const colorIdx =
												((depth % DEPTH_LEVEL_COLORS.length) +
													DEPTH_LEVEL_COLORS.length) %
												DEPTH_LEVEL_COLORS.length;
											const color = DEPTH_LEVEL_COLORS[colorIdx];
											const label =
												depth === 0
													? "Выбранная"
													: depth < 0
														? `Upstream ${Math.abs(depth)}`
														: `Downstream ${depth}`;
											return (
												<div
													key={depth}
													data-name={`depth_legend_item_${depth}`}
													style={{
														display: "flex",
														alignItems: "center",
														gap: 6,
														marginBottom: 2,
														cursor: "pointer",
													}}
													onClick={() => handleDepthLegendClick(depth)}
												>
													<div
														style={{
															width: 12,
															height: 12,
															borderRadius: 3,
															backgroundColor: color.bg,
															border: `2px dashed ${color.border}`,
															flexShrink: 0,
														}}
													/>
													<span style={{ fontSize: 10, color: "#666" }}>
														{label}
													</span>
												</div>
											);
										})}
								</div>
							)}
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
						selectedAttribute={selectedAttributes[0] ?? null}
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
					{contextMenuSelectedAttr && (
						<MenuItem onClick={handleGoToEntityWithSelectedAttr}>
							<ListItemIcon>
								<OpenInNew fontSize="small" />
							</ListItemIcon>
							<ListItemText
								primary="Открыть с выделением атрибута"
								secondary={contextMenuSelectedAttr.attrName}
							/>
						</MenuItem>
					)}
					{contextMenuSelectedAttr && (
						<MenuItem onClick={handleGoToDashboardWithSelectedAttr}>
							<ListItemIcon>
								<CenterFocusStrong fontSize="small" />
							</ListItemIcon>
							<ListItemText
								primary="В Dashboard с выделением"
								secondary={contextMenuSelectedAttr.attrName}
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

ModelGraphPanelInner.displayName = "ModelGraphPanelInner";
