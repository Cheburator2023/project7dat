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
import { useGraphSettingsStore } from "@react-client/common/store/graphSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useDashboardStore } from "../stores";
import { graphNodeTypes } from "./EntityNodeComponent";
import {
	getLayoutedElements,
	buildLineageGraph,
	getUpstreamNodes,
	getDownstreamNodes,
} from "../utils";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	MAX_VISIBLE_ATTRS,
	ATTR_EDGE_COLORS,
} from "../constants";
import type { EntityNodeData } from "../types";
import { useColorScheme } from "@mui/material";

const showFullGraphByDefault = false;

const EMPTY_STRING_SET = new Set<string>();
const EMPTY_ATTR_CONNECTION_MAP = new Map<string, Set<string>>();
const EMPTY_SEARCH_MATCHES = new Map<string, number>();

type EntityNode = Node<EntityNodeData, "entityNode">;

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
		onUpstreamDownstreamChange,
		onEdgeClick,
		onNodeContextMenu,
	}) => {
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
		const [isTopLeftPanelVisible, setIsTopLeftPanelVisible] = useState(false);
		const [graphMode, setGraphMode] = useState<"entities" | "attributes">(
			"entities",
		);
		const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
		const { fitView, setCenter, getNode } = useReactFlow();
		const {
			hoveredAttribute,
			setHoveredAttribute,
			selectedAttribute,
			setSelectedAttribute,
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
				searchMatchedEntities: state.searchMatchedEntities,
				globalSearchQuery: state.globalSearchQuery,
				zoomToNodeId: state.zoomToNodeId,
				setZoomToNode: state.setZoomToNode,
			})),
		);

		const { showAttributesInNodes } = useGraphSettingsStore(
			useShallow((state) => ({
				showFullGraphByDefault: state.showFullGraphByDefault,
				showAttributesInNodes: state.showAttributesInNodes,
			})),
		);

		const lineageGraph = useMemo(
			() => buildLineageGraph(data.mappings || []),
			[data.mappings],
		);

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
		const attrConnectionMap = useMemo(() => {
			const shouldCompute =
				graphMode === "attributes" || !!hoveredAttribute || !!selectedAttribute;
			if (!shouldCompute) return EMPTY_ATTR_CONNECTION_MAP;

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
		}, [data.mappings, graphMode, hoveredAttribute, selectedAttribute]);

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
						isExpanded: showAttributesInNodes,
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
			const visibleAttrsPerEntity = new Map<string, Set<string>>();
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
				visibleAttrsPerEntity.set(entity.id, new Set(visibleAttrs));
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

							const edgeColor =
								ATTR_EDGE_COLORS[attrIdx % ATTR_EDGE_COLORS.length];

							edges.push({
								id: edgeId,
								source: dep.entityId,
								target: mapping.entityId,
								sourceHandle,
								targetHandle,
								type: "smoothstep",
								animated: false,
								style: {
									stroke: edgeColor,
									strokeWidth: 1.5,
									opacity: 0.8,
								},
								data: {
									baseStroke: edgeColor,
									baseStrokeWidth: 1.5,
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
							// Show mapping count in entities mode
							label:
								graphMode === "entities" && attrCount > 0
									? `${attrCount} маппингов`
									: undefined,
							labelStyle: { fontSize: 9, fill: "#666" },
							labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
						});
					}
				}
			}

			return { nodes, edges };
		}, [
			data.entities,
			data.mappings,
			graphId,
			graphMode,
			topologySelectedEntityId,
			topologyUpstreamNodes,
			topologyDownstreamNodes,
			topologyGlobalSearchQuery,
			topologySearchMatches,
			upstreamCounts,
			downstreamCounts,
			showAttributesInNodes,
		]);

		// Apply layout (only based on topology)
		const { nodes: layoutedTopologyNodes, edges: layoutedTopologyEdges } =
			useMemo(
				() =>
					getLayoutedElements(topologyNodes, topologyEdges, layoutDirection, {
						showAttributesInNodes,
					}),
				[topologyNodes, topologyEdges, layoutDirection, showAttributesInNodes],
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

					return {
						...node,
						data: {
							...node.data,
							highlightType,
							hoverHighlightedAttrs:
								hoverHighlightedByEntity.get(node.id) || EMPTY_STRING_SET,
							selectedHighlightedAttrs:
								selectedHighlightedByEntity.get(node.id) || EMPTY_STRING_SET,
							isSearchActive,
							isSearchMatch: !!isSearchMatch,
							searchMatchScore: searchScore,
							isExpanded: expandedNodes.has(node.id),
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
			setEdges((prev) =>
				prev.map((edge) => {
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
				}),
			);
		}, [selectedEntityId, upstreamNodes, downstreamNodes, setEdges]);

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
					const x = node.position.x + (node.measured?.width ?? 280) / 2;
					const y = node.position.y + (node.measured?.height ?? 100) / 2;
					setCenter(x, y, { zoom: 1.2, duration: 500 });
				}
				// Reset after zooming
				setZoomToNode(null);
			}
		}, [zoomToNodeId, getNode, setCenter, setZoomToNode]);

		const { mode } = useColorScheme();

		return (
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onEdgeClick={handleEdgeClick}
				onNodeContextMenu={handleNodeContextMenu}
				nodeTypes={graphNodeTypes}
				nodesDraggable={false}
				nodesConnectable={false}
				fitView
				minZoom={0.05}
				maxZoom={2}
				defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
				proOptions={{ hideAttribution: true }}
				colorMode={mode}
			>
				<Background color="#e0e0e0" gap={20} />
				<Controls />
				{nodes.length <= 500 && (
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
				)}
				<Panel position="top-left">
					{isTopLeftPanelVisible ? (
						<div
							id="graph-panel-inner-top-left"
							style={{
								background: "#fff",
								padding: 12,
								borderRadius: 8,
								boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: 8,
									marginBottom: 8,
								}}
							>
								<div style={{ fontSize: 12, fontWeight: 600 }}>
									{data.entities?.length || 0} сущностей
								</div>
								<button
									onClick={() => setIsTopLeftPanelVisible(false)}
									style={{
										padding: "4px 8px",
										border: "1px solid #ddd",
										borderRadius: 6,
										background: "#fff",
										cursor: "pointer",
										fontSize: 11,
									}}
									type="button"
									title="Скрыть панель"
								>
									×
								</button>
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
									type="button"
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
									type="button"
								>
									{graphMode === "attributes" ? "Атрибуты" : "Объекты"}
								</button>
							</div>
						</div>
					) : (
						<button
							onClick={() => setIsTopLeftPanelVisible(true)}
							style={{
								padding: "6px 10px",
								border: "1px solid #ddd",
								borderRadius: 8,
								background: "#fff",
								boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
								cursor: "pointer",
								fontSize: 11,
							}}
							type="button"
							title="Показать панель"
						>
							≡
						</button>
					)}
				</Panel>
			</ReactFlow>
		);
	},
);

GraphPanelInner.displayName = "GraphPanelInner";
