import { memo, useState, useCallback, useMemo, useEffect } from "react";
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
import { useShallow } from "zustand/react/shallow";
import { useDashboardStore } from "../stores";
import { graphNodeTypes } from "./EntityNodeComponent";
import { getLayoutedElements, buildLineageGraph } from "../utils";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	MAX_VISIBLE_ATTRS,
	ATTR_EDGE_COLORS,
	NODE_WIDTH,
} from "../constants";
import type { EntityNodeData } from "../types";
import { useColorScheme, Slider } from "@mui/material";
import {
	AccountTree,
	CenterFocusStrong,
	SwapHoriz,
	SwapVert,
	ClearAll,
} from "@mui/icons-material";

const showFullGraphByDefault = false;

const EMPTY_STRING_SET = new Set<string>();

const EMPTY_SEARCH_MATCHES = new Map<string, number>();

type EntityNode = Node<EntityNodeData, "entityNode">;

const getUpstreamNodesLimited = (
	nodeId: string,
	upstreamGraph: Map<string, Set<string>>,
	maxDepth: number,
): { visited: Set<string>; boundary: Set<string> } => {
	const visited = new Set<string>();
	const boundary = new Set<string>();
	const queue: Array<{ id: string; depth: number }> = [
		{ id: nodeId, depth: 0 },
	];

	while (queue.length > 0) {
		const item = queue.shift();
		if (!item) continue;
		const { id, depth } = item;
		if (visited.has(id)) continue;
		visited.add(id);

		if (depth >= maxDepth) {
			const neighbors = upstreamGraph.get(id);
			if (neighbors) {
				for (const nextId of neighbors) {
					if (!visited.has(nextId)) {
						boundary.add(id);
						break;
					}
				}
			}
			continue;
		}
		const neighbors = upstreamGraph.get(id);
		if (!neighbors) continue;
		for (const nextId of neighbors) {
			queue.push({ id: nextId, depth: depth + 1 });
		}
	}

	return { visited, boundary };
};

const getDownstreamNodesLimited = (
	nodeId: string,
	downstreamGraph: Map<string, Set<string>>,
	maxDepth: number,
): { visited: Set<string>; boundary: Set<string> } => {
	const visited = new Set<string>();
	const boundary = new Set<string>();
	const queue: Array<{ id: string; depth: number }> = [
		{ id: nodeId, depth: 0 },
	];

	while (queue.length > 0) {
		const item = queue.shift();
		if (!item) continue;
		const { id, depth } = item;
		if (visited.has(id)) continue;
		visited.add(id);

		if (depth >= maxDepth) {
			const neighbors = downstreamGraph.get(id);
			if (neighbors) {
				for (const nextId of neighbors) {
					if (!visited.has(nextId)) {
						boundary.add(id);
						break;
					}
				}
			}
			continue;
		}
		const neighbors = downstreamGraph.get(id);
		if (!neighbors) continue;
		for (const nextId of neighbors) {
			queue.push({ id: nextId, depth: depth + 1 });
		}
	}

	return { visited, boundary };
};

const getMaxDepthFromNode = (
	nodeId: string,
	adjacency: Map<string, Set<string>>,
): number => {
	const visited = new Set<string>();
	const queue: Array<{ id: string; depth: number }> = [
		{ id: nodeId, depth: 0 },
	];
	let maxDepth = 0;

	while (queue.length > 0) {
		const item = queue.shift();
		if (!item) continue;
		const { id, depth } = item;
		if (visited.has(id)) continue;
		visited.add(id);
		maxDepth = Math.max(maxDepth, depth);

		const neighbors = adjacency.get(id);
		if (!neighbors) continue;
		for (const nextId of neighbors) {
			queue.push({ id: nextId, depth: depth + 1 });
		}
	}

	return maxDepth;
};

export interface NodeContextMenuEvent {
	entityId: string;
	x: number;
	y: number;
}

interface GraphPanelInnerProps {
	data: DataLineageSchema;
	graphId: string;
	selectedEntityId: string | null;
	onSelectEntity: (id: string | null) => void;
	onNodeDoubleClick: (entityId: string, graphId: string) => void;
	onOpenEntity?: (entityId: string) => void;
	onViewDetails?: (entityId: string) => void;
	onUpstreamDownstreamChange: (
		upstream: Set<string>,
		downstream: Set<string>,
	) => void;
	onEdgeClick?: (sourceId: string, targetId: string) => void;
	onNodeContextMenu?: (event: NodeContextMenuEvent) => void;
}

export const GraphPanelInner = memo<GraphPanelInnerProps>(
	({
		data,
		graphId,
		selectedEntityId,
		onSelectEntity,
		onNodeDoubleClick,
		onOpenEntity,
		onViewDetails,
		onUpstreamDownstreamChange,
		onEdgeClick,
		onNodeContextMenu,
	}) => {
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
		const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
		const [depthLimit, setDepthLimit] = useState(1);
		const [isDepthPanelOpen, setIsDepthPanelOpen] = useState(true);
		const { fitView, setCenter, getNode } = useReactFlow();
		const {
			hoveredAttribute,
			setHoveredAttribute,
			selectedAttribute,
			setSelectedAttribute,
			globalAttributeSearchQuery,
			localNodeAttributeSearchQueries,
			searchMatchedEntities,
			globalSearchQuery,
			zoomToNodeId,
			setZoomToNode,
		} = useDashboardStore(
			useShallow((state) => ({
				hoveredAttribute: state.hoveredAttribute,
				setHoveredAttribute: state.setHoveredAttribute,
				selectedAttribute: state.selectedAttribute,
				setSelectedAttribute: state.setSelectedAttribute,
				globalAttributeSearchQuery: state.globalAttributeSearchQuery,
				localNodeAttributeSearchQueries: state.localNodeAttributeSearchQueries,
				searchMatchedEntities: state.searchMatchedEntities,
				globalSearchQuery: state.globalSearchQuery,
				zoomToNodeId: state.zoomToNodeId,
				setZoomToNode: state.setZoomToNode,
			})),
		);

		const lineageGraph = useMemo(
			() => buildLineageGraph(data.mappings || []),
			[data.mappings],
		);

		const maxTraversalDepth = useMemo(() => {
			if (!selectedEntityId) return 1;
			const upstreamMax = getMaxDepthFromNode(
				selectedEntityId,
				lineageGraph.upstream,
			);
			const downstreamMax = getMaxDepthFromNode(
				selectedEntityId,
				lineageGraph.downstream,
			);
			return Math.max(1, upstreamMax, downstreamMax);
		}, [lineageGraph, selectedEntityId]);

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
			for (const entity of data.entities || []) {
				upCounts.set(
					entity.id,
					lineageGraph.upstream.get(entity.id)?.size ?? 0,
				);
				downCounts.set(
					entity.id,
					lineageGraph.downstream.get(entity.id)?.size ?? 0,
				);
			}
			return { upstreamCounts: upCounts, downstreamCounts: downCounts };
		}, [data.entities, lineageGraph]);

		// Calculate upstream/downstream for selected node
		const {
			upstreamNodes,
			downstreamNodes,
			upstreamBoundary,
			downstreamBoundary,
		} = useMemo(() => {
			if (!selectedEntityId)
				return {
					upstreamNodes: new Set<string>(),
					downstreamNodes: new Set<string>(),
					upstreamBoundary: new Set<string>(),
					downstreamBoundary: new Set<string>(),
				};
			const upResult = getUpstreamNodesLimited(
				selectedEntityId,
				lineageGraph.upstream,
				depthLimit,
			);
			const downResult = getDownstreamNodesLimited(
				selectedEntityId,
				lineageGraph.downstream,
				depthLimit,
			);
			upResult.visited.delete(selectedEntityId);
			downResult.visited.delete(selectedEntityId);
			return {
				upstreamNodes: upResult.visited,
				downstreamNodes: downResult.visited,
				upstreamBoundary: upResult.boundary,
				downstreamBoundary: downResult.boundary,
			};
		}, [selectedEntityId, lineageGraph, depthLimit]);

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

		// Handle right-click context menu on nodes
		const handleNodeContextMenu = useCallback(
			(event: React.MouseEvent, node: Node) => {
				event.preventDefault();
				if (onNodeContextMenu) {
					onNodeContextMenu({
						entityId: node.id,
						x: event.clientX,
						y: event.clientY,
					});
				}
			},
			[onNodeContextMenu],
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
				const current = useDashboardStore.getState().selectedAttribute;
				if (current?.entityId === entityId && current?.attrName === attrName) {
					setSelectedAttribute(null);
					return;
				}
				setSelectedAttribute({ entityId, attrName });
			},
			[setSelectedAttribute],
		);

		const handleClearSelectedAttribute = useCallback(() => {
			setSelectedAttribute(null);
		}, [setSelectedAttribute]);

		const handleGhostClick = useCallback(() => {
			setDepthLimit((prev) => Math.min(prev + 1, maxTraversalDepth));
		}, [maxTraversalDepth]);

		const handleToggleExpand = useCallback((id: string) => {
			setExpandedNodes((prev) => {
				const next = new Set(prev);
				if (next.has(id)) {
					next.delete(id);
				} else {
					next.add(id);
				}
				return next;
			});
		}, []);

		// Build attribute connection map for hover highlighting
		// Maps "entityId::attrName" -> Set of connected "entityId::attrName"
		const isAnyAttributeSearchActive = useMemo(() => {
			if (globalAttributeSearchQuery.trim().length >= 2) return true;
			for (const q of Object.values(localNodeAttributeSearchQueries)) {
				if (q.trim().length >= 2) return true;
			}
			return false;
		}, [globalAttributeSearchQuery, localNodeAttributeSearchQueries]);

		const attrConnectionMap = useMemo(() => {
			const connections = new Map<string, Set<string>>();
			for (const mapping of data.mappings || []) {
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
		// BFS traversal to find all transitively connected attributes in the flow
		const selectedHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (!selectedAttribute) return result;

			const selectedKey = `${selectedAttribute.entityId}::${selectedAttribute.attrName}`;
			const visited = new Set<string>();
			const queue = [selectedKey];
			visited.add(selectedKey);

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
		}, [selectedAttribute, attrConnectionMap]);

		const searchedHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (!isAnyAttributeSearchActive) return result;

			const add = (entityId: string, attrName: string) => {
				if (!result.has(entityId)) result.set(entityId, new Set());
				result.get(entityId)!.add(attrName);
			};

			const globalQuery = globalAttributeSearchQuery.trim().toLowerCase();
			const entityLocalQueries = localNodeAttributeSearchQueries;

			for (const entity of data.entities || []) {
				const localQ = (entityLocalQueries[entity.id] ?? "")
					.trim()
					.toLowerCase();
				const q = globalQuery.length >= 2 ? globalQuery : localQ;
				if (!q || q.length < 2) continue;
				for (const attr of entity.attrSeq || []) {
					const name = attr.name?.toLowerCase() ?? "";
					const type = attr.type?.toLowerCase() ?? "";
					if (name.includes(q) || type.includes(q)) {
						add(entity.id, attr.name);
					}
				}
			}

			// Also add connected attrs to ensure the other side renders handles for edges
			for (const [entityId, attrs] of result) {
				for (const attrName of attrs) {
					const key = `${entityId}::${attrName}`;
					const connected = attrConnectionMap.get(key);
					if (!connected) continue;
					for (const connectedKey of connected) {
						const [cEntityId, cAttrName] = connectedKey.split("::");
						if (cEntityId && cAttrName) add(cEntityId, cAttrName);
					}
				}
			}

			return result;
		}, [
			attrConnectionMap,
			data.entities,
			globalAttributeSearchQuery,
			isAnyAttributeSearchActive,
			localNodeAttributeSearchQueries,
		]);

		const selectedOrSearchedAttrsByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			for (const [entityId, attrs] of searchedHighlightedByEntity) {
				result.set(entityId, new Set(attrs));
			}
			for (const [entityId, attrs] of selectedHighlightedByEntity) {
				const existing = result.get(entityId);
				if (!existing) {
					result.set(entityId, new Set(attrs));
					continue;
				}
				for (const a of attrs) existing.add(a);
			}
			return result;
		}, [searchedHighlightedByEntity, selectedHighlightedByEntity]);

		const topologySelectedEntityId = showFullGraphByDefault
			? null
			: selectedEntityId;
		const topologyUpstreamNodes = showFullGraphByDefault
			? EMPTY_STRING_SET
			: upstreamNodes;
		const topologyDownstreamNodes = showFullGraphByDefault
			? EMPTY_STRING_SET
			: downstreamNodes;
		const topologyGlobalSearchQuery = showFullGraphByDefault
			? ""
			: globalSearchQuery;
		const topologySearchMatches = showFullGraphByDefault
			? EMPTY_SEARCH_MATCHES
			: searchMatchedEntities;
		const topologyUpstreamBoundary = showFullGraphByDefault
			? EMPTY_STRING_SET
			: upstreamBoundary;
		const topologyDownstreamBoundary = showFullGraphByDefault
			? EMPTY_STRING_SET
			: downstreamBoundary;
		const topologyHandleGhostClick = handleGhostClick;

		// Create nodes and edges (topology only)
		const { nodes: topologyNodes, edges: topologyEdges } = useMemo(() => {
			// Deduplicate entities by ID (keep first occurrence)
			const seenEntityIds = new Set<string>();
			const allUniqueEntities: DataLineageEntity[] = [];
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
				allUniqueEntities.push(entity);
			}

			// Filter entities based on showFullGraphByDefault setting
			// When disabled, only show entities that match the search query
			const hasActiveSearch =
				!!topologyGlobalSearchQuery && topologySearchMatches.size > 0;
			let uniqueEntities: DataLineageEntity[];

			if (showFullGraphByDefault) {
				// Show all entities
				uniqueEntities = allUniqueEntities;
			} else if (hasActiveSearch) {
				// Only show matched entities and their connected entities (upstream/downstream of selected)
				const matchedIds = new Set(topologySearchMatches.keys());
				// Also include selected entity and its upstream/downstream
				if (topologySelectedEntityId) {
					matchedIds.add(topologySelectedEntityId);
					for (const id of topologyUpstreamNodes) matchedIds.add(id);
					for (const id of topologyDownstreamNodes) matchedIds.add(id);
				}
				uniqueEntities = allUniqueEntities.filter((e) => matchedIds.has(e.id));
			} else {
				// No search active and showFullGraphByDefault is false - show empty graph
				// But still show selected entity and its connections if any
				if (topologySelectedEntityId) {
					const visibleIds = new Set([topologySelectedEntityId]);
					for (const id of topologyUpstreamNodes) visibleIds.add(id);
					for (const id of topologyDownstreamNodes) visibleIds.add(id);
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
			for (const mapping of data.mappings || []) {
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

			const nodes: EntityNode[] = uniqueEntities.map((entity) => {
				return {
					id: entity.id,
					type: "entityNode",
					position: { x: 0, y: 0 },
					data: {
						entity,
						highlightType: "none",
						onNodeClick: handleNodeClick,
						onNodeDoubleClick: handleNodeDblClick,
						onOpenEntity,
						onViewDetails,
						onAttrHover: handleAttrHover,
						onAttrClick: handleAttrClick,
						graphId,
						upstreamCount: upstreamCounts.get(entity.id) || 0,
						downstreamCount: downstreamCounts.get(entity.id) || 0,
						highlightedSourceAttrs:
							entitySourceAttrs.get(entity.id) || EMPTY_STRING_SET,
						highlightedTargetAttrs:
							entityTargetAttrs.get(entity.id) || EMPTY_STRING_SET,
						layoutAttrLimit:
							(entitySourceAttrs.get(entity.id)?.size ?? 0) +
							(entityTargetAttrs.get(entity.id)?.size ?? 0),
						layoutHasMoreRelatedAttrs: false,
						hoverHighlightedAttrs: EMPTY_STRING_SET,
						selectedHighlightedAttrs: EMPTY_STRING_SET,
						isSearchActive: false,
						isSearchMatch: false,
						onToggleExpand: handleToggleExpand,
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
			const relatedAttrsCountPerEntity = new Map<string, number>();
			for (const entity of uniqueEntities) {
				const sourceAttrs = entitySourceAttrs.get(entity.id) || new Set();
				const targetAttrs = entityTargetAttrs.get(entity.id) || new Set();
				const relatedAttrNames = new Set([...sourceAttrs, ...targetAttrs]);
				const attrs = entity.attrSeq || [];
				const allRelatedAttrs = attrs.filter((attr) =>
					relatedAttrNames.has(attr.name),
				);
				relatedAttrsCountPerEntity.set(entity.id, allRelatedAttrs.length);
				const visibleAttrs = allRelatedAttrs
					.slice(0, MAX_VISIBLE_ATTRS)
					.map((a) => a.name);
				void visibleAttrs;
			}

			for (const node of nodes) {
				const relatedCount = relatedAttrsCountPerEntity.get(node.id) || 0;
				const visibleCount = Math.min(relatedCount, MAX_VISIBLE_ATTRS);
				(node.data as unknown as { layoutAttrLimit?: number }).layoutAttrLimit =
					visibleCount;
				(
					node.data as unknown as { layoutHasMoreRelatedAttrs?: boolean }
				).layoutHasMoreRelatedAttrs = relatedCount > visibleCount;
			}

			const edges: Edge[] = [];
			const edgeSet = new Set<string>();

			for (const mapping of data.mappings || []) {
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

					// Entity-level edge only (attribute edges added in decoration effect)
					const edgeId = `${dep.entityId}->${mapping.entityId}`;
					if (edgeSet.has(edgeId)) continue;
					edgeSet.add(edgeId);
					const attrCount = dep.attrMaps?.length || 0;
					edges.push({
						id: edgeId,
						source: dep.entityId,
						target: mapping.entityId,
						sourceHandle: "entity-source",
						targetHandle: "entity-target",
						type: "smoothstep",
						animated: false,
						style: {
							stroke: "#b1b1b7",
							strokeWidth: 1,
						},
						data: {
							baseStroke: "#b1b1b7",
							baseStrokeWidth: 1,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: "#b1b1b7",
						},
						label: attrCount > 0 ? `${attrCount} маппингов` : undefined,
						labelStyle: { fontSize: 9, fill: "#666" },
						labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
					});
				}
			}

			// Add ghost nodes for boundary entities that have more data beyond depthLimit
			const ghostNodes: Node[] = [];
			for (const boundaryId of topologyUpstreamBoundary) {
				const ghostId = `ghost-upstream-${boundaryId}`;
				ghostNodes.push({
					id: ghostId,
					type: "ghostNode",
					position: { x: 0, y: 0 },
					data: {
						direction: "upstream",
						boundaryNodeId: boundaryId,
						onClickGhost: topologyHandleGhostClick,
					},
				});
				edges.push({
					id: `${ghostId}->${boundaryId}`,
					source: ghostId,
					target: boundaryId,
					sourceHandle: "ghost-source",
					targetHandle: "entity-target",
					type: "smoothstep",
					animated: false,
					style: {
						stroke: "#6366f1",
						strokeWidth: 1,
						strokeDasharray: "6,4",
						opacity: 0.5,
					},
					markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
				});
			}
			for (const boundaryId of topologyDownstreamBoundary) {
				const ghostId = `ghost-downstream-${boundaryId}`;
				ghostNodes.push({
					id: ghostId,
					type: "ghostNode",
					position: { x: 0, y: 0 },
					data: {
						direction: "downstream",
						boundaryNodeId: boundaryId,
						onClickGhost: topologyHandleGhostClick,
					},
				});
				edges.push({
					id: `${boundaryId}->${ghostId}`,
					source: boundaryId,
					target: ghostId,
					sourceHandle: "entity-source",
					targetHandle: "ghost-target",
					type: "smoothstep",
					animated: false,
					style: {
						stroke: "#f59e0b",
						strokeWidth: 1,
						strokeDasharray: "6,4",
						opacity: 0.5,
					},
					markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
				});
			}

			return { nodes: [...nodes, ...ghostNodes], edges };
		}, [
			data.entities,
			data.mappings,
			graphId,
			topologySelectedEntityId,
			topologyUpstreamNodes,
			topologyDownstreamNodes,
			topologyGlobalSearchQuery,
			topologySearchMatches,
			upstreamCounts,
			downstreamCounts,
			topologyUpstreamBoundary,
			topologyDownstreamBoundary,
			topologyHandleGhostClick,
		]);

		// Apply layout (only based on topology)
		const { nodes: layoutedTopologyNodes, edges: layoutedTopologyEdges } =
			useMemo(
				() =>
					getLayoutedElements(topologyNodes, topologyEdges, layoutDirection),
				[topologyNodes, topologyEdges, layoutDirection],
			);

		const [nodes, setNodes, onNodesChange] = useNodesState(
			layoutedTopologyNodes as Node[],
		);
		const [edges, setEdges, onEdgesChange] = useEdgesState(
			layoutedTopologyEdges,
		);

		// When topology/layout changes, reset nodes/edges positions
		useEffect(() => {
			setNodes(layoutedTopologyNodes as Node[]);
			setEdges(layoutedTopologyEdges);
		}, [layoutedTopologyNodes, layoutedTopologyEdges, setNodes, setEdges]);

		// Apply highlight/search/hover decorations WITHOUT re-running layout
		useEffect(() => {
			const isSearchActive =
				!!globalSearchQuery && searchMatchedEntities.size > 0;

			setNodes((prev) =>
				prev.map((node) => {
					let highlightType: EntityNodeData["highlightType"] = "none";
					const searchScore = searchMatchedEntities.get(node.id);
					const isSearchMatch = globalSearchQuery && searchScore !== undefined;

					if (node.id === selectedEntityId) highlightType = "selected";
					else if (upstreamNodes.has(node.id)) highlightType = "upstream";
					else if (downstreamNodes.has(node.id)) highlightType = "downstream";
					else if (isSearchMatch) highlightType = "searchMatch";

					const nextHoverAttrs =
						hoverHighlightedByEntity.get(node.id) || EMPTY_STRING_SET;
					const nextSelectedAttrs =
						selectedHighlightedByEntity.get(node.id) || EMPTY_STRING_SET;
					const nextIsExpanded = expandedNodes.has(node.id);

					const d = node.data as EntityNodeData;
					// Skip creating a new object if nothing changed for this node
					if (
						d.highlightType === highlightType &&
						d.hoverHighlightedAttrs === nextHoverAttrs &&
						d.selectedHighlightedAttrs === nextSelectedAttrs &&
						d.isSearchActive === isSearchActive &&
						d.isSearchMatch === !!isSearchMatch &&
						d.isExpanded === nextIsExpanded &&
						d.onNodeClick === handleNodeClick &&
						d.onNodeDoubleClick === handleNodeDblClick &&
						d.onAttrHover === handleAttrHover &&
						d.onAttrClick === handleAttrClick &&
						d.onToggleExpand === handleToggleExpand
					) {
						return node;
					}

					return {
						...node,
						data: {
							...node.data,
							highlightType,
							hoverHighlightedAttrs: nextHoverAttrs,
							selectedHighlightedAttrs: nextSelectedAttrs,
							isSearchActive,
							isSearchMatch: !!isSearchMatch,
							searchMatchScore: searchScore,
							isExpanded: nextIsExpanded,
							onNodeClick: handleNodeClick,
							onNodeDoubleClick: handleNodeDblClick,
							onAttrHover: handleAttrHover,
							onAttrClick: handleAttrClick,
							onToggleExpand: handleToggleExpand,
						},
					};
				}),
			);
		}, [
			selectedEntityId,
			upstreamNodes,
			downstreamNodes,
			globalSearchQuery,
			searchMatchedEntities,
			hoverHighlightedByEntity,
			selectedHighlightedByEntity,
			expandedNodes,
			setNodes,
			handleNodeClick,
			handleNodeDblClick,
			handleAttrHover,
			handleAttrClick,
			handleToggleExpand,
		]);

		useEffect(() => {
			// Start from layouted entity-level edges and decorate + append attr edges
			const shouldShowAttrEdges = selectedAttribute !== null;

			// Build attribute-level edges dynamically
			const attrEdges: Edge[] = [];
			if (shouldShowAttrEdges) {
				const edgeSet = new Set<string>();
				// Collect existing entity IDs from current nodes
				const visibleEntityIds = new Set(
					layoutedTopologyNodes.map((n) => n.id),
				);

				for (const mapping of data.mappings || []) {
					if (!mapping.deps) continue;
					for (const dep of mapping.deps) {
						if (
							!dep.attrMaps ||
							dep.attrMaps.length === 0 ||
							!dep.entityId ||
							!mapping.entityId
						)
							continue;
						if (
							!visibleEntityIds.has(dep.entityId) ||
							!visibleEntityIds.has(mapping.entityId)
						)
							continue;

						const sourceActiveAttrs =
							selectedOrSearchedAttrsByEntity.get(dep.entityId) ||
							EMPTY_STRING_SET;
						const targetActiveAttrs =
							selectedOrSearchedAttrsByEntity.get(mapping.entityId) ||
							EMPTY_STRING_SET;

						dep.attrMaps.forEach((attrMap, attrIdx) => {
							const shouldRender =
								sourceActiveAttrs.has(attrMap.src) ||
								targetActiveAttrs.has(attrMap.dst);
							if (!shouldRender) return;

							const edgeId = `${dep.entityId}::${attrMap.src}->${mapping.entityId}::${attrMap.dst}`;
							if (edgeSet.has(edgeId)) return;
							edgeSet.add(edgeId);

							const edgeColor =
								ATTR_EDGE_COLORS[attrIdx % ATTR_EDGE_COLORS.length];

							attrEdges.push({
								id: edgeId,
								source: dep.entityId,
								target: mapping.entityId,
								sourceHandle: `attr-source-${attrMap.src}`,
								targetHandle: `attr-target-${attrMap.dst}`,
								type: "default",
								animated: false,
								style: {
									stroke: edgeColor,
									strokeWidth: 2,
									strokeDasharray: "5,5",
									opacity: 0.85,
								},
								data: {
									baseStroke: edgeColor,
									baseStrokeWidth: 2,
									isAttrEdge: true,
								},
								markerEnd: {
									type: MarkerType.ArrowClosed,
									color: edgeColor,
									width: 12,
									height: 12,
								},
								label: `${attrMap.src} → ${attrMap.dst}`,
								labelStyle: { fontSize: 8, fill: "#666" },
								labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
							});
						});
					}
				}
			}

			// Decorate entity-level edges from layout + append attr edges
			const decoratedEntityEdges = layoutedTopologyEdges.map((edge) => {
				const baseStroke =
					(edge.data as { baseStroke?: string } | undefined)?.baseStroke ??
					"#b1b1b7";
				const baseStrokeWidth =
					(edge.data as { baseStrokeWidth?: number } | undefined)
						?.baseStrokeWidth ?? 1;

				let edgeHighlightType: "none" | "upstream" | "downstream" = "none";
				if (selectedEntityId) {
					if (edge.source === selectedEntityId) {
						edgeHighlightType = "downstream";
					} else if (edge.target === selectedEntityId) {
						edgeHighlightType = "upstream";
					} else if (
						upstreamNodes.has(edge.source) &&
						upstreamNodes.has(edge.target)
					) {
						edgeHighlightType = "upstream";
					} else if (
						downstreamNodes.has(edge.source) &&
						downstreamNodes.has(edge.target)
					) {
						edgeHighlightType = "downstream";
					}
				}

				const isHighlighted = edgeHighlightType !== "none";
				const stroke = isHighlighted
					? edgeHighlightType === "upstream"
						? HIGHLIGHT_COLORS.upstream
						: HIGHLIGHT_COLORS.downstream
					: baseStroke;
				const strokeWidth = isHighlighted
					? baseStrokeWidth + 1
					: baseStrokeWidth;

				return {
					...edge,
					animated: isHighlighted,
					style: {
						...(edge.style || {}),
						stroke,
						strokeWidth,
					},
					markerEnd:
						edge.markerEnd && typeof edge.markerEnd === "object"
							? {
									...edge.markerEnd,
									color: stroke,
								}
							: edge.markerEnd,
				};
			});

			setEdges([...decoratedEntityEdges, ...attrEdges]);
		}, [
			selectedEntityId,
			upstreamNodes,
			downstreamNodes,
			setEdges,
			layoutedTopologyEdges,
			isAnyAttributeSearchActive,
			selectedAttribute,
			selectedOrSearchedAttrsByEntity,
			data.mappings,
			layoutedTopologyNodes,
		]);

		useEffect(() => {
			const timer = setTimeout(
				() => fitView({ padding: 0.1, duration: 300 }),
				100,
			);
			return () => clearTimeout(timer);
		}, [
			layoutDirection,
			fitView,
			graphId,
			layoutedTopologyNodes.length,
			layoutedTopologyEdges.length,
		]);

		// Handle zoom to node request from context menu
		useEffect(() => {
			if (zoomToNodeId) {
				const node = getNode(zoomToNodeId);
				if (node) {
					const x = node.position.x + (node.measured?.width ?? NODE_WIDTH) / 2;
					const y = node.position.y + (node.measured?.height ?? 100) / 2;
					setCenter(x, y, { zoom: 1.2, duration: 500 });
				}
				// Reset after zooming
				setZoomToNode(null);
			}
		}, [zoomToNodeId, getNode, setCenter, setZoomToNode]);

		const { mode } = useColorScheme();

		const focusMainNode = useCallback(() => {
			const nodeId = selectedEntityId ?? nodes[0]?.id;
			if (!nodeId) return;
			const node = getNode(nodeId);
			if (!node) return;
			const x = node.position.x + (node.measured?.width ?? NODE_WIDTH) / 2;
			const y = node.position.y + (node.measured?.height ?? 100) / 2;
			setCenter(x, y, { duration: 200 });
		}, [getNode, nodes, selectedEntityId, setCenter]);

		return (
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onEdgeClick={handleEdgeClick}
				onNodeContextMenu={handleNodeContextMenu}
				nodeTypes={graphNodeTypes}
				nodesDraggable
				nodesConnectable={false}
				fitView
				minZoom={0.1}
				maxZoom={2}
				defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
				proOptions={{ hideAttribution: true }}
				colorMode={mode}
			>
				<Background color="#e0e0e0" gap={20} />
				<Controls>
					<div data-name="scroll_to_main_node">
						<button
							onClick={focusMainNode}
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
							title="Сфокусироваться на главном узле"
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
								cursor:
									selectedEntityId && maxTraversalDepth > 1
										? "pointer"
										: "not-allowed",
								padding: 0,
							}}
							title="Глубина"
							type="button"
							disabled={!selectedEntityId || maxTraversalDepth <= 1}
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
					{selectedAttribute && (
						<div data-name="clear_selected_attribute">
							<button
								onClick={handleClearSelectedAttribute}
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
								title={`Очистить атрибут: ${selectedAttribute.attrName}`}
								type="button"
							>
								<ClearAll style={{ fontSize: 16, color: "#666" }} />
							</button>
						</div>
					)}
				</Controls>
				<MiniMap
					nodeColor={(node) => {
						const entityNode = node as unknown as EntityNode;
						if (entityNode.data.highlightType === "selected")
							return HIGHLIGHT_COLORS.selected;
						if (entityNode.data.highlightType === "upstream")
							return HIGHLIGHT_COLORS.upstream;
						if (entityNode.data.highlightType === "downstream")
							return HIGHLIGHT_COLORS.downstream;
						return (
							TYPE_COLORS[entityNode.data.entity?.type || "table"]?.border ||
							"#999"
						);
					}}
					style={{
						background: "#f5f5f5",
						border: "1px solid #ddd",
						borderRadius: 8,
					}}
				/>
				{selectedEntityId && maxTraversalDepth > 1 && (
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
										Глубина: {depthLimit} / максимальная {maxTraversalDepth}
									</span>
								</div>
								<Slider
									id="depth-limit-slider"
									min={1}
									max={maxTraversalDepth}
									value={depthLimit}
									onChange={(_e, value) => {
										setDepthLimit(value as number);
									}}
									size="small"
									valueLabelDisplay="auto"
								/>
							</div>
						) : null}
					</Panel>
				)}
			</ReactFlow>
		);
	},
);

GraphPanelInner.displayName = "GraphPanelInner";
