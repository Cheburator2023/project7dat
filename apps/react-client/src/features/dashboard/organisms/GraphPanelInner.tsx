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
		// Graph mode: "entities" = compact (entity-level edges), "attributes" = detailed (attribute-level edges)
		const [graphMode, setGraphMode] = useState<"entities" | "attributes">(
			"attributes",
		);
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

			const isSearchActive =
				!!globalSearchQuery && searchMatchedEntities.size > 0;

			const nodes: EntityNode[] = uniqueEntities.map((entity) => {
				let highlightType: EntityNodeData["highlightType"] = "none";
				const searchScore = searchMatchedEntities.get(entity.id);
				const isSearchMatch = globalSearchQuery && searchScore !== undefined;

				if (entity.id === selectedEntityId) highlightType = "selected";
				else if (upstreamNodes.has(entity.id)) highlightType = "upstream";
				else if (downstreamNodes.has(entity.id)) highlightType = "downstream";
				else if (isSearchMatch) highlightType = "searchMatch";

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
						isSearchActive,
						isSearchMatch: !!isSearchMatch,
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

							const edgeColor = isEntityHighlighted
								? edgeHighlightColor
								: ATTR_EDGE_COLORS[attrIdx % ATTR_EDGE_COLORS.length];

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
				}
			}

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
			searchMatchedEntities,
			globalSearchQuery,
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
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onEdgeClick={handleEdgeClick}
				onNodeContextMenu={handleNodeContextMenu}
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
				</Panel>
			</ReactFlow>
		);
	},
);

GraphPanelInner.displayName = "GraphPanelInner";
