import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
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
import { graphNodeTypes } from "./EntityNodePreviewComponent";
import { getLayoutedElements, buildLineageGraph } from "../../dashboard/utils";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	ATTR_EDGE_COLORS,
} from "../../dashboard/constants";
import type { EntityNodeData } from "../../dashboard/types";
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
	Code,
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
	onSelectNode?: (data: any) => void;
}

const DEFAULT_VISIBLE_ATTRS = 10;

export const GraphPanelInner2 = memo<GraphPanelInnerProps>(
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
		// Expanded nodes state for layout recalculation
		const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
		const [selectedNode, setSelectedNode] = useState<string>(selectedEntityId);

		const { entityId: urlEntityId } = useParams<{ entityId: string }>();

		useEffect(() => {
			const decodedUrlEntityId = urlEntityId
				? decodeURIComponent(urlEntityId)
				: undefined;
			setSelectedNode(selectedEntityId || decodedUrlEntityId || "");
		}, [selectedEntityId, urlEntityId]);
		const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
		// Graph mode: "entities" = compact (entity-level edges), "attributes" = detailed (attribute-level edges)
		const [graphMode, setGraphMode] = useState<
			"all" | "entities" | "attributes"
		>("all");
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

		// Dialog state
		const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
		const [dialogEntity, setDialogEntity] = useState<DataLineageEntity | null>(
			null,
		);
		const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
		const [selectedConnection, setSelectedConnection] =
			useState<EntityConnection | null>(null);

		const { showFullGraphByDefault } = useGraphSettingsStore();

		const relatedMappings = useMemo(() => {
			if (!data?.mappings || !selectedNode) return [];
			return data.mappings.filter(
				(mapping) =>
					mapping.entityId === selectedNode ||
					mapping.deps?.some((dep) => dep.entityId === selectedNode),
			);
		}, [data?.mappings, selectedNode, urlEntityId]);

		const lineageGraph = useMemo(
			() => buildLineageGraph(relatedMappings || []),
			[relatedMappings],
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
			if (!selectedNode)
				return {
					upstreamNodes: new Set<string>(),
					downstreamNodes: new Set<string>(),
				};
			const upstream = getUpstreamNodes(selectedNode, lineageGraph.upstream);
			const downstream = getDownstreamNodes(
				selectedNode,
				lineageGraph.downstream,
			);
			upstream.delete(selectedNode);
			downstream.delete(selectedNode);
			return { upstreamNodes: upstream, downstreamNodes: downstream };
		}, [selectedNode, lineageGraph]);

		// Find related entities (upstream + downstream from main entity)
		const relatedEntityIds = useMemo(() => {
			const upstream = getUpstreamNodes(selectedNode, lineageGraph.upstream);
			const downstream = getDownstreamNodes(
				selectedNode,
				lineageGraph.downstream,
			);
			return new Set([...upstream, ...downstream]);
		}, [selectedNode, lineageGraph]);

		// Filter entities to show only related ones
		const filteredEntities = useMemo(() => {
			return data.entities.filter((e) => relatedEntityIds.has(e.id));
		}, [data, relatedEntityIds]);

		// Build connections for dialogs
		const entityConnections = useMemo(() => {
			const connections: EntityConnection[] = [];
			const entityMap = new Map<string, DataLineageEntity>();
			for (const e of filteredEntities) {
				entityMap.set(e.id, e);
			}

			data.mappings.forEach((mapping) => {
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
		}, [data.mappings, filteredEntities, relatedEntityIds, selectedEntityId]);

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

		const [attrEdges, setAttrEdges] = useState<Edge[]>([]);

		const [selectedAttributeLocal, setSelectedAttributeLocal] = useState<{
			entityId: string;
			attrName: string;
		} | null>(null);

		const handleAttrClick = useCallback(
			(entityId: string, attrName: string) => {
				// Toggle selection: if clicking same attribute, deselect; otherwise select new one
				if (
					selectedAttribute?.entityId === entityId &&
					selectedAttribute?.attrName === attrName
				) {
					setAttrEdges([]);
					setSelectedAttribute(null);
					setSelectedAttributeLocal(null);
				} else {
					setAttrEdges([]);
					setSelectedAttribute({ entityId, attrName });
					setSelectedAttributeLocal({ entityId, attrName });
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
			if (!selectedAttributeLocal) return result;

			const selectedKey = `${selectedAttributeLocal.entityId}::${selectedAttributeLocal.attrName}`;
			const connectedAttrs = attrConnectionMap.get(selectedKey);

			// Highlight the selected attribute itself
			if (!result.has(selectedAttributeLocal.entityId)) {
				result.set(selectedAttributeLocal.entityId, new Set());
			}
			result
				.get(selectedAttributeLocal.entityId)!
				.add(selectedAttributeLocal.attrName);

			// Highlight connected attributes
			if (connectedAttrs) {
				for (const key of connectedAttrs) {
					const [entityId, attrName] = key.split("::");
					if (!result.has(entityId)) {
						result.set(entityId, new Set());
					}
					result.get(entityId)!.add(attrName);

					setAttrEdges((prev) => [
						...prev,
						{
							id: selectedKey + "->" + key,
							source: selectedKey,
							target: key,
							type: "default",
							animated: true,
							style: {
								stroke: HIGHLIGHT_COLORS.selected,
								strokeWidth: 3,
							},
						},
						{
							id: key + "->" + selectedKey,
							source: selectedKey,
							target: key,
							type: "default",
							animated: true,
							style: {
								stroke: HIGHLIGHT_COLORS.selected,
								strokeWidth: 3,
							},
						},
					]);
				}
			}
			return result;
		}, [selectedAttributeLocal, attrConnectionMap]);

		// Get selected entity
		const selectedEntity = useMemo(() => {
			if (!selectedNode) return null;
			return filteredEntities.find((e) => e.id === selectedNode) || null;
		}, [selectedNode, filteredEntities]);

		// Expand/collapse handler for nodes
		const handleExpandToggle = useCallback(
			(nodeId: string, expanded: boolean) => {
				setExpandedNodes((prev) => {
					const next = new Set(prev);
					if (expanded) {
						next.add(nodeId);
					} else {
						next.delete(nodeId);
					}
					return next;
				});
			},
			[],
		);

		// Create nodes and edges
		const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
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
						onExpandToggle: handleExpandToggle,
						isExpanded: expandedNodes.has(entity.id),
					},
				};

				if (entity.type === "input_vector") {
					const edgeId = `${entity.id}->${entity.namespace}`;

					edges.push({
						id: edgeId,
						source: entity.id,
						target: entity.namespace,
						sourceHandle: "entity-source",
						targetHandle: "entity-target",
						type: "default",
						animated: true,
						style: {
							stroke: ATTR_EDGE_COLORS[0],
							strokeWidth: 1,
							opacity: 0.8,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: "#b1b1b7",
						},
					});

					return [
						{
							id: entity.namespace,
							type: "entityNode",
							position: { x: 0, y: 0 },
							data: {
								onNodeClick: () => {},
								onNodeDoubleClick: () => {},
								onAttrHover: () => {},
								onAttrClick: () => {},
								onExpandToggle: () => {},
								entity: {
									type: "model",
									id: entity.namespace,
									namespace: entity.name,
								},
								graphId,
								isExpanded: true,
								highlightType: "downstream",
							},
						},
						node,
					];
				}

				return node;
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

				const maxAttr = expandedNodes.has(entity.id)
					? allRelatedAttrs.length
					: DEFAULT_VISIBLE_ATTRS;
				const visibleAttrs = allRelatedAttrs
					.slice(0, maxAttr)
					.map((a) => a.name);
				visibleAttrsPerEntity.set(entity.id, new Set(visibleAttrs));
			}

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

					// In "entities" mode: always use entity-level edges
					// In "attributes" mode: use attribute-level edges when available

					const isAttrHighlightedMode = attrEdges.length > 0;

					if (
						(graphMode === "attributes" || graphMode === "all") &&
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

							const isAttrHighlighted = attrEdges.some((a) => a.id === edgeId);

							edges.push({
								id: edgeId,
								source: dep.entityId,
								target: mapping.entityId,
								sourceHandle,
								targetHandle,
								type: "default",
								animated: isAttrHighlighted,
								style: {
									stroke: isAttrHighlighted ? ATTR_EDGE_COLORS[5] : edgeColor,
									strokeWidth: isAttrHighlighted
										? 3
										: isAttrHighlightedMode
											? 0.8
											: 1.5,
									opacity: isAttrHighlighted
										? 0.8
										: isAttrHighlightedMode
											? 0.2
											: 0.8,
								},
								markerEnd: {
									type: MarkerType.ArrowClosed,
									color: isAttrHighlighted ? ATTR_EDGE_COLORS[5] : edgeColor,
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
					}
					if (graphMode === "entities" || graphMode === "all") {
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
							type: "default",
							// animated: isEntityHighlighted,
							style: {
								stroke: edgeHighlightColor,
								strokeWidth: isEntityHighlighted ? 2 : 1,
								opacity: isAttrHighlightedMode ? 0.2 : 0.8,
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

			console.log({ nodes, edges });
			return { nodes, edges };
		}, [
			attrEdges,
			data,
			graphId,
			graphMode,
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
			selectedHighlightedByEntity,
			searchMatchedEntities,
			globalSearchQuery,
			showFullGraphByDefault,
			handleExpandToggle,
			expandedNodes,
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
					entityName: entityNode.data.entity.name || entityNode.data.entity.id,
					entityType: entityNode.data.entity.type,
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
							<div style={{ marginBottom: 8 }}>
								<div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
									Граф зависимостей
								</div>
								<div style={{ fontSize: 11, color: "#666" }}>
									{filteredEntities.length} связанных сущностей
								</div>
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
											graphMode === "entities"
												? "attributes"
												: graphMode === "all"
													? "entities"
													: "all",
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
											: graphMode === "all"
												? "Показаны все связи"
												: "Показаны связи объектов"
									}
									type="button"
								>
									{graphMode === "attributes"
										? "Атрибуты"
										: graphMode === "all"
											? "Все связи"
											: "Объекты"}
								</button>
							</div>
						</div>
					</Panel>
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
					<MenuItem onClick={handleContextMenuShowInEditor}>
						<ListItemIcon>
							<Code fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в редакторе" />
					</MenuItem>
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

GraphPanelInner2.displayName = "GraphPanelInner2";
