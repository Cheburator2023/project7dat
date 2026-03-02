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
	useReactFlow,
} from "@xyflow/react";
import type {
	DataLineageSchema,
	DataLineageEntity,
} from "@react-client/types/dataLineage";
import { useGraphSettingsStore } from "@react-client/common/stores/graphSettingsStore";
import { useEntitiesStore } from "../../entities/stores";
import { graphNodeTypes } from "./ModelNodePreviewComponent";
import { buildLineageGraph, getMaxDepthFromNode } from "../../entities/utils";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	DEPTH_LEVEL_COLORS,
	ATTR_EDGE_COLORS,
	isTempTable,
} from "../../entities/constants";
import type { EntityConnection, EntityNodeData } from "../../entities/types";
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
	CenterFocusStrong,
	ContentCopy,
	Info,
	OpenInNew,
	SwapHoriz,
	SwapVert,
	ClearAll,
	Clear,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";
import { getLayoutedElements } from "@react-client/features/modelPreview/utils/dagreLayout";
import { useGraphDepthControl } from "@react-client/common/hooks/useGraphDepthControl";
import {
	DepthControlPanel,
	DepthControlToggleButton,
} from "@react-client/common/primitives/DepthControlPanel";

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

const computeNodeDepths = (
	rootId: string,
	upstream: Map<string, Set<string>>,
	downstream: Map<string, Set<string>>,
	visibleNodeIds: Set<string>,
): Map<string, number> => {
	const depths = new Map<string, number>();
	if (!rootId) return depths;
	depths.set(rootId, 0);

	// Bidirectional BFS (upstream + downstream) to mirror backend traversal.
	let frontier: string[] = [rootId];
	let level = 0;
	const visited = new Set<string>([rootId]);

	while (frontier.length > 0) {
		const next: string[] = [];
		for (const current of frontier) {
			const neighbors = new Set<string>([
				...(upstream.get(current) ?? []),
				...(downstream.get(current) ?? []),
			]);
			for (const neighbor of neighbors) {
				if (visited.has(neighbor) || !visibleNodeIds.has(neighbor)) continue;
				visited.add(neighbor);
				depths.set(neighbor, level + 1);
				next.push(neighbor);
			}
		}
		frontier = next;
		level += 1;
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
	depthLimit?: number;
	onDepthChange?: (depth: number) => void;
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
		depthLimit: externalDepthLimit,
		onDepthChange,
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
		const graphKey = rootEntityId || "default";
		const layoutDirection = useGraphSettingsStore((state) =>
			state.usePerGraphLayout
				? (state.perGraphLayoutDirections[graphKey] ?? state.layoutDirection)
				: state.layoutDirection,
		);
		const toggleGraphLayoutDirection = useGraphSettingsStore(
			(state) => state.toggleGraphLayoutDirection,
		);
		const { setCenter, getNode } = useReactFlow();
		const hasFocusedRootInitiallyRef = useRef(false);
		const prevDepthLimitRef = useRef(externalDepthLimit ?? 1);
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
		} = useEntitiesStore();

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

		const maxDepth = useMemo(
			() =>
				selectedNode ? getMaxDepthFromNode(lineageGraph, selectedNode) : 1,
			[lineageGraph, selectedNode],
		);

		const depthControl = useGraphDepthControl({
			maxDepth,
			externalDepthLimit,
			onDepthChange,
		});

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

		// Calculate upstream/downstream for selected node (limited by depthLimit)
		const { upstreamNodes, downstreamNodes } = useMemo(() => {
			if (!selectedNode)
				return {
					upstreamNodes: new Set<string>(),
					downstreamNodes: new Set<string>(),
				};
			const upstream = getUpstreamNodesLimited(
				selectedNode,
				lineageGraph.upstream,
				depthControl.depthLimit,
			);
			const downstream = getDownstreamNodesLimited(
				selectedNode,
				lineageGraph.downstream,
				depthControl.depthLimit,
			);
			upstream.delete(selectedNode);
			downstream.delete(selectedNode);
			return { upstreamNodes: upstream, downstreamNodes: downstream };
		}, [selectedNode, lineageGraph, depthControl.depthLimit]);

		// Find related entities (upstream + downstream from main entity)
		const relatedEntityIds = useMemo(() => {
			if (!selectedNode) return new Set<string>();
			return new Set([...upstreamNodes, ...downstreamNodes, selectedNode]);
		}, [selectedNode, upstreamNodes, downstreamNodes]);

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
					const encodedId = encodeURIComponent(inputVectorId);
					navigate(`/services/models/${encodedId}`);
					return;
				}
				onSelectEntity(id);
				const _encodedId = encodeURIComponent(id);
				navigate(`/entity/${id}`);
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

		const _handleClearSelectedAttribute = useCallback(() => {
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
		// Single-hop only: selected attr + its direct connections (no transitive BFS)
		const selectedHighlightedByEntity = useMemo(() => {
			const result = new Map<string, Set<string>>();
			if (selectedAttributes.length === 0) return result;

			const add = (entityId: string, attrName: string) => {
				if (!result.has(entityId)) result.set(entityId, new Set());
				result.get(entityId)!.add(attrName);
			};

			for (const attr of selectedAttributes) {
				add(attr.entityId, attr.attrName);
				const key = `${attr.entityId}::${attr.attrName}`;
				const neighbors = attrConnectionMap.get(key);
				if (neighbors) {
					for (const neighbor of neighbors) {
						const [entityId, attrName] = neighbor.split("::");
						if (entityId && attrName) add(entityId, attrName);
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
				const isDisabled = isTempTable(entity);
				let highlightType: EntityNodeData["highlightType"] = "none";
				const searchScore = searchMatchedEntities.get(entity.id);
				const isSearchMatch = globalSearchQuery && searchScore !== undefined;

				if (upstreamNodes.has(entity.id)) highlightType = "upstream";
				else if (downstreamNodes.has(entity.id)) highlightType = "downstream";
				else if (isSearchMatch) highlightType = "searchMatch";

				const node = {
					id: entity.id,
					type: "entityNode",
					position: { x: 0, y: 0 },
					selectable: !isDisabled,
					draggable: !isDisabled,
					data: {
						entity,
						isDisabled,
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
								type: "model",
								name: entity?.namespace || "",
								description: data?.desc?.appId || "",
								attrSeq: [],
							} as any,
							highlightType: "selected",
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
							target: modelNodeId,
							source: selectedNode,
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

				const depthLabel = depth === 0 ? "Выбранная" : `Шаг ${depth}`;

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
				if (contextMenu.entityType === "model") {
					const encodedId = encodeURIComponent(
						contextMenu.entityId
							.replace("__model_node__", "")
							.replace("__model__fake_node__", ""),
					);
					navigate(`/services/models/${encodedId}`);
					return;
				}
				const encodedId = encodeURIComponent(contextMenu.entityId);
				navigate(`/entity/${encodedId}`);
			}
			setContextMenu(null);
		}, [contextMenu, navigate]);

		const handleContextMenuOpenInNewTab = useCallback(() => {
			if (contextMenu) {
				if (contextMenu.entityType === "model") {
					const encodedId = encodeURIComponent(
						contextMenu.entityId
							.replace("__model_node__", "")
							.replace("__model__fake_node__", ""),
					);
					const url = new URL(`/models/${encodedId}`, window.location.href);
					window.open(url.toString(), "_blank", "noopener,noreferrer");
					return;
				}
				const encodedId = encodeURIComponent(contextMenu.entityId);
				const url = new URL(`/entity/${encodedId}`, window.location.href);
				window.open(url.toString(), "_blank", "noopener,noreferrer");
			}
			setContextMenu(null);
		}, [contextMenu]);

		const _handleContextMenuShowInEditor = useCallback(() => {
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

		const _handleDepthLegendClick = useCallback(
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
		}, [layoutedNodes, setNodes]);

		// Edge decoration effect: hide entity edges when attrs selected, add attr edges
		useEffect(() => {
			const shouldShowAttrEdges = selectedAttributes.length > 0;
			const attrEdges: Edge[] = [];
			if (shouldShowAttrEdges) {
				const edgeSet = new Set<string>();
				const visibleEntityIds = new Set(nodes.map((n) => n.id));

				for (const mapping of data?.mappings || []) {
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
							selectedHighlightedByEntity.get(dep.entityId) ||
							new Set<string>();
						const targetActiveAttrs =
							selectedHighlightedByEntity.get(mapping.entityId) ||
							new Set<string>();

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
								animated: true,
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
								label: `${attrMap.src} \u2192 ${attrMap.dst}`,
								labelStyle: { fontSize: 8, fill: "#666" },
								labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
							});
						});
					}
				}
			}

			// When attributes are selected, hide entity-level edges (keep ghost/synthetic edges)
			const filteredEntityEdges = shouldShowAttrEdges
				? layoutedEdges.filter(
						(edge) =>
							edge.id.startsWith("ghost-") ||
							edge.source.startsWith("ghost-") ||
							edge.target.startsWith("ghost-") ||
							edge.source.startsWith("__model__fake_node__") ||
							edge.target.startsWith("__model__fake_node__"),
					)
				: layoutedEdges;

			setEdges([...filteredEntityEdges, ...attrEdges]);
		}, [
			selectedAttributes,
			selectedHighlightedByEntity,
			data?.mappings,
			nodes,
			layoutedEdges,
			setEdges,
		]);

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
			if (prevDepthLimitRef.current === depthControl.depthLimit) return;
			const exists = nodes.some((n) => n.id === rootEntityId);
			if (!exists) {
				prevDepthLimitRef.current = depthControl.depthLimit;
				return;
			}
			const handle = window.setTimeout(() => {
				focusRootEntityNode();
			}, 150);
			prevDepthLimitRef.current = depthControl.depthLimit;
			return () => window.clearTimeout(handle);
		}, [depthControl.depthLimit, focusRootEntityNode, nodes, rootEntityId]);

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
						<DepthControlToggleButton
							onToggle={() =>
								depthControl.setIsDepthPanelOpen(!depthControl.isDepthPanelOpen)
							}
							disabled={!selectedNode}
						/>
						<div data-name="toggle_layout_direction">
							<button
								onClick={() =>
									toggleGraphLayoutDirection(rootEntityId || "default")
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
						{selectedAttributes.length > 0 && (
							<div data-name="clear_selected_attribute">
								<button
									onClick={_handleClearSelectedAttribute}
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
									title={`Очистить атрибуты (${selectedAttributes.length})`}
									type="button"
								>
									<Clear style={{ fontSize: 16, color: "#666" }} />
								</button>
							</div>
						)}
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
					{/* <Panel position="top-left">
						<div
							style={{
								background: "#fff",
								padding: 12,
								borderRadius: 8,
								boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
							}}
						>
							{selectedNode && nodeDepths.size > 1 && (
								<div>
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
											const label = depth === 0 ? "Выбранная" : `Шаг ${depth}`;
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
					</Panel> */}
					{selectedNode && (
						<DepthControlPanel
							depthLimit={depthControl.depthLimit}
							canIncrease={depthControl.canIncrease}
							canDecrease={depthControl.canDecrease}
							isDepthPanelOpen={depthControl.isDepthPanelOpen}
							onIncrease={depthControl.handleIncreaseDepth}
							onDecrease={depthControl.handleDecreaseDepth}
						/>
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
