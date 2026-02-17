import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { useNavigate } from "react-router";
import {
	ReactFlow,
	ReactFlowProvider,
	Background,
	Controls,
	MiniMap,
	Node,
	Edge,
	Handle,
	Position,
	NodeProps,
	MarkerType,
	Panel,
	useNodesState,
	useEdgesState,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import {
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	useColorScheme,
} from "@mui/material";
import {
	ContentCopy,
	OpenInNew,
	CenterFocusStrong,
	Info,
} from "@mui/icons-material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useEntitiesStore } from "@react-client/features/entities/stores";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";

// Connection type for dialogs
interface EntityConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	processName: string;
	processId?: number | null;
	processCode?: string;
	attrMaps: Array<{ src: string; dst: string }>;
	description: string;
}

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

// ============================================================================
// Types
// ============================================================================

interface EntityNodeData {
	entity: DataLineageEntity;
	isHighlighted: boolean;
	highlightType: "none" | "selected" | "upstream" | "downstream";
	onNodeClick: (id: string) => void;
	onNodeDoubleClick: (id: string) => void;
	upstreamCount: number;
	downstreamCount: number;
	[key: string]: unknown;
}

type EntityNode = Node<EntityNodeData, "entityNode">;

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 260;
const NODE_HEADER_HEIGHT = 56;
const ATTR_ROW_HEIGHT = 20;
const LAYOUT_VISIBLE_ATTRS = 10; // Match DEFAULT_VISIBLE_ATTRS for accurate layout

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	table: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1" },
	view: { bg: "#f3e5f5", border: "#7b1fa2", text: "#4a148c" },
	rdd: { bg: "#fff3e0", border: "#ef6c00", text: "#e65100" },
	unresolved: { bg: "#fce4ec", border: "#c2185b", text: "#ad1457" },
};

const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
};

// ============================================================================
// Custom Node Component
// ============================================================================

const DEFAULT_VISIBLE_ATTRS = 10;

const EntityNodeComponent = memo(({ data, id }: NodeProps<EntityNode>) => {
	const {
		entity,
		highlightType,
		onNodeClick,
		onNodeDoubleClick,
		onAttrHover,
		onAttrClick,
		onToggleExpand,
		isExpanded = false,
		upstreamCount,
		downstreamCount,
		hoverHighlightedAttrs = new Set<string>(),
		selectedHighlightedAttrs = new Set<string>(),
	} = data as any;
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
	const attrs = entity.attrSeq || [];

	// Sort attrs: related (with mappings) first, then others
	const srcAttrs = (data.highlightedSourceAttrs || new Set()) as Set<string>;
	const tgtAttrs = (data.highlightedTargetAttrs || new Set()) as Set<string>;
	const sortedAttrs = useMemo(() => {
		const relatedNames = new Set<string>();
		srcAttrs.forEach((name) => {
			relatedNames.add(name);
		});
		tgtAttrs.forEach((name) => {
			relatedNames.add(name);
		});
		const related = attrs.filter((a: any) => relatedNames.has(a.name));
		const others = attrs.filter((a: any) => !relatedNames.has(a.name));
		return [...related, ...others];
	}, [attrs, srcAttrs, tgtAttrs]);

	const maxAttrs = isExpanded ? sortedAttrs.length : DEFAULT_VISIBLE_ATTRS;
	const visibleAttrs = sortedAttrs.slice(0, maxAttrs);
	const moreCount = sortedAttrs.length - DEFAULT_VISIBLE_ATTRS;

	// Витрина = есть источники, но нет потребителей (конечная точка данных)
	const isDataMart = upstreamCount > 0 && downstreamCount === 0;
	// Источник = нет источников, но есть потребители (начальная точка данных)
	const isSource = upstreamCount === 0 && downstreamCount > 0;

	const borderColor =
		highlightType !== "none"
			? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
			: colors.border;

	const borderWidth = highlightType !== "none" ? 3 : 2;

	return (
		<div
			style={{
				background: "#fff",
				border: `${borderWidth}px solid ${borderColor}`,
				borderRadius: 8,
				width: NODE_WIDTH,
				boxShadow:
					highlightType !== "none"
						? `0 4px 16px ${borderColor}40`
						: "0 2px 6px rgba(0,0,0,0.1)",
				overflow: "hidden",
				cursor: "pointer",
				transition: "all 0.2s ease",
			}}
			onClick={() => onNodeClick(id)}
			onDoubleClick={() => onNodeDoubleClick(id)}
		>
			{/* Header */}
			<div
				style={{
					background: colors.bg,
					padding: "6px 10px",
					borderBottom: `1px solid ${colors.border}`,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
					}}
				>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								fontSize: 10,
								color: colors.text,
								opacity: 0.8,
								textTransform: "uppercase",
								letterSpacing: "0.5px",
								marginBottom: 2,
							}}
						>
							{entity.type}
							{entity.modified && (
								<span
									style={{
										marginLeft: 6,
										background: "#ff9800",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 8,
									}}
								>
									изм.
								</span>
							)}
							{/* {isDataMart && (
								<span
									style={{
										marginLeft: 6,
										background: "#9c27b0",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 8,
									}}
									title="Витрина данных — конечная точка, данные не передаются дальше"
								>
									витрина
								</span>
							)} */}
							{/* {isSource && (
								<span
									style={{
										marginLeft: 6,
										background: "#00897b",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 8,
									}}
									title="Источник данных — начальная точка, данные не поступают извне"
								>
									источник
								</span>
							)} */}
						</div>
						<div
							style={{
								fontWeight: 600,
								fontSize: 12,
								color: "#333",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
							title={entity.name || entity.id}
						>
							{entity.name || entity.id}
						</div>
						{entity.namespace && (
							<div
								style={{
									fontSize: 9,
									color: "#666",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
								title={entity.namespace}
							>
								{entity.namespace}
							</div>
						)}
					</div>
				</div>
				{/* Connection counts */}
				<div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 9 }}>
					{upstreamCount > 0 && (
						<span style={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}>
							← {upstreamCount}
						</span>
					)}
					{downstreamCount > 0 && (
						<span
							style={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
						>
							→ {downstreamCount}
						</span>
					)}
					<span style={{ color: "#888", marginLeft: "auto" }}>
						{attrs.length} атр.
					</span>
				</div>
			</div>

			{/* Preview attributes */}
			{visibleAttrs.length > 0 && (
				<div onMouseLeave={() => onAttrHover?.(id, null)}>
					{visibleAttrs.map((attr, idx) => {
						const isHoverHighlighted = hoverHighlightedAttrs.has(attr.name);
						const isSelectedHighlighted = selectedHighlightedAttrs.has(
							attr.name,
						);
						const isHighlighted = isHoverHighlighted || isSelectedHighlighted;

						return (
							<div
								key={attr.name}
								onMouseEnter={() => onAttrHover?.(id, attr.name)}
								onClick={(e) => {
									e.stopPropagation();
									onAttrClick?.(id, attr.name);
								}}
								style={{
									display: "flex",
									justifyContent: "space-between",
									padding: "3px 10px",
									fontSize: 10,
									borderBottom:
										idx < visibleAttrs.length - 1
											? "1px solid #f5f5f5"
											: "none",
									background: isSelectedHighlighted
										? `${HIGHLIGHT_COLORS.selected}70`
										: isHoverHighlighted
											? `${HIGHLIGHT_COLORS.upstream}30`
											: idx % 2 === 0
												? "#fafafa"
												: "#fff",
									cursor: "pointer",
									transition: "background 0.15s ease",
								}}
								title={`${attr.name}: ${attr.type}${isHighlighted ? " (выделен)" : ""}`}
							>
								{/* Target handle for this attribute */}
								<Handle
									type="target"
									position={Position.Left}
									id={`attr-target-${attr.name}`}
									style={{
										background: isHighlighted
											? HIGHLIGHT_COLORS.selected
											: colors.border,
										width: isHighlighted ? 8 : 6,
										height: isHighlighted ? 8 : 6,
										left: -3,
										border: "1px solid #fff",
										transition: "all 0.15s ease",
									}}
								/>

								<span
									style={{
										color: isHighlighted ? "#333" : "#555",
										fontWeight: isHighlighted ? 600 : 400,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										flex: 1,
									}}
								>
									{attr.name}
								</span>
								<span style={{ color: "#999", marginLeft: 8, fontSize: 9 }}>
									{attr.type}
								</span>

								{/* Source handle for this attribute */}
								<Handle
									type="source"
									position={Position.Right}
									id={`attr-source-${attr.name}`}
									style={{
										background: isHighlighted
											? HIGHLIGHT_COLORS.selected
											: colors.border,
										width: isHighlighted ? 8 : 6,
										height: isHighlighted ? 8 : 6,
										right: -3,
										border: "1px solid #fff",
										transition: "all 0.15s ease",
									}}
								/>
							</div>
						);
					})}
					{moreCount > 0 && (
						<div
							onClick={(e) => {
								e.stopPropagation();
								onToggleExpand?.(id, !isExpanded);
							}}
							style={{
								padding: "4px 10px",
								fontSize: 10,
								color: "#1976d2",
								background: "#f8f9fa",
								textAlign: "center",
								cursor: "pointer",
								fontWeight: 500,
								borderTop: "1px solid #e0e0e0",
							}}
							title={
								isExpanded
									? "Свернуть атрибуты"
									: `Показать все ${attrs.length} атрибутов`
							}
						>
							{isExpanded ? "▲ Свернуть" : `▼ Ещё ${moreCount} атрибутов...`}
						</div>
					)}
				</div>
			)}

			{/* Handles */}
			<Handle
				type="target"
				position={Position.Left}
				style={{
					background: colors.border,
					width: 8,
					height: 8,
					border: "2px solid #fff",
				}}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{
					background: colors.border,
					width: 8,
					height: 8,
					border: "2px solid #fff",
				}}
			/>
		</div>
	);
});

EntityNodeComponent.displayName = "EntityNodeComponent";

const nodeTypes = {
	entityNode: EntityNodeComponent,
};

// ============================================================================
// Layout Utilities
// ============================================================================

const getLayoutedElements = (
	nodes: EntityNode[],
	edges: Edge[],
	direction: "LR" | "TB" = "LR",
	expandedNodes: Set<string> = new Set(),
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 100, // Increased to prevent vertical overlap
		ranksep: 150, // Increased horizontal separation
		marginx: 40,
		marginy: 40,
	});

	nodes.forEach((node) => {
		const attrCount = node.data.entity.attrSeq?.length || 0;
		const isExpanded = expandedNodes.has(node.id);
		// Use full attr count if expanded, otherwise LAYOUT_VISIBLE_ATTRS
		const visibleAttrs = isExpanded
			? attrCount
			: Math.min(attrCount, LAYOUT_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrs * ATTR_ROW_HEIGHT +
			(attrCount > LAYOUT_VISIBLE_ATTRS ? 24 : 0);

		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const attrCount = node.data.entity.attrSeq?.length || 0;
		const isExpanded = expandedNodes.has(node.id);
		const visibleAttrs = isExpanded
			? attrCount
			: Math.min(attrCount, LAYOUT_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrs * ATTR_ROW_HEIGHT +
			(attrCount > LAYOUT_VISIBLE_ATTRS ? 24 : 0);

		return {
			...node,
			position: {
				x: nodeWithPosition.x - NODE_WIDTH / 2,
				y: nodeWithPosition.y - height / 2,
			},
		};
	});
	return { nodes: layoutedNodes, edges };
};

// ============================================================================
// Build Lineage Graph
// ============================================================================

const buildLineageGraph = (
	mappings: DataLineageMapping[],
): {
	upstream: Map<string, Set<string>>;
	downstream: Map<string, Set<string>>;
} => {
	const upstream = new Map<string, Set<string>>();
	const downstream = new Map<string, Set<string>>();

	mappings.forEach((mapping) => {
		if (!mapping.deps) return;

		mapping.deps.forEach((dep) => {
			// upstream: target -> sources
			if (!upstream.has(mapping.entityId)) {
				upstream.set(mapping.entityId, new Set());
			}
			upstream.get(mapping.entityId)!.add(dep.entityId);

			// downstream: source -> targets
			if (!downstream.has(dep.entityId)) {
				downstream.set(dep.entityId, new Set());
			}
			downstream.get(dep.entityId)!.add(mapping.entityId);
		});
	});

	return { upstream, downstream };
};

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

// ============================================================================
// Inner Graph Component
// ============================================================================

interface EntityGraphInnerProps {
	mainEntity: DataLineageEntity;
	allEntities: DataLineageEntity[];
	mappings: DataLineageMapping[];
	onEntitiesCalculated?: (entities: DataLineageEntity[]) => void;
}

interface EntityGraphInnerExtendedProps extends EntityGraphInnerProps {
	highlightedAttr?: string | null;
	onSelectNode?: (data: any) => void;
}

const EntityGraphInner: React.FC<EntityGraphInnerExtendedProps> = ({
	mainEntity,
	allEntities,
	mappings,
	onEntitiesCalculated,
	highlightedAttr,
	onSelectNode,
}) => {
	const navigate = useNavigate();
	const [selectedNode, setSelectedNode] = useState<string | null>(
		mainEntity.id,
	);
	const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");

	// Expanded nodes state for layout recalculation
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	// Attribute hover/selection state (like Dashboard)
	const [hoveredAttribute, setHoveredAttribute] = useState<{
		entityId: string;
		attrName: string;
	} | null>(null);
	const [selectedAttribute, setSelectedAttributeLocal] = useState<{
		entityId: string;
		attrName: string;
	} | null>(
		highlightedAttr
			? { entityId: mainEntity.id, attrName: highlightedAttr }
			: null,
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
		entityName: string;
		entityType: string;
		x: number;
		y: number;
	} | null>(null);

	const { fitView, setCenter, getNode } = useReactFlow();
	const { setRevealPosition } = useDataLineageStore();
	const { setZoomToNode } = useEntitiesStore();

	// Build lineage graph
	const lineageGraph = useMemo(() => buildLineageGraph(mappings), [mappings]);

	// Find related entities (upstream + downstream from main entity)
	const relatedEntityIds = useMemo(() => {
		const upstream = getUpstreamNodes(mainEntity.id, lineageGraph.upstream);
		const downstream = getDownstreamNodes(
			mainEntity.id,
			lineageGraph.downstream,
		);
		return new Set([...upstream, ...downstream]);
	}, [mainEntity.id, lineageGraph]);

	// Filter entities to show only related ones
	const filteredEntities = useMemo(() => {
		return allEntities.filter((e) => relatedEntityIds.has(e.id));
	}, [mainEntity.id, allEntities, relatedEntityIds]);

	// Calculate upstream/downstream counts
	const { upstreamCounts, downstreamCounts } = useMemo(() => {
		const upCounts = new Map<string, number>();
		const downCounts = new Map<string, number>();

		for (const entity of filteredEntities) {
			const upNodes = getUpstreamNodes(entity.id, lineageGraph.upstream);
			upNodes.delete(entity.id);
			upCounts.set(entity.id, upNodes.size);

			const downNodes = getDownstreamNodes(entity.id, lineageGraph.downstream);
			downNodes.delete(entity.id);
			downCounts.set(entity.id, downNodes.size);
		}

		return { upstreamCounts: upCounts, downstreamCounts: downCounts };
	}, [filteredEntities, lineageGraph]);

	// Calculate upstream/downstream sets for selected node
	const { upstreamNodes, downstreamNodes } = useMemo(() => {
		if (!selectedNode) {
			return {
				upstreamNodes: new Set<string>(),
				downstreamNodes: new Set<string>(),
			};
		}

		const upstream = getUpstreamNodes(selectedNode, lineageGraph.upstream);
		const downstream = getDownstreamNodes(
			selectedNode,
			lineageGraph.downstream,
		);

		upstream.delete(selectedNode);
		downstream.delete(selectedNode);

		return { upstreamNodes: upstream, downstreamNodes: downstream };
	}, [selectedNode, lineageGraph]);

	// Build connections for dialogs
	const entityConnections = useMemo(() => {
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, DataLineageEntity>();
		for (const e of filteredEntities) {
			entityMap.set(e.id, e);
		}

		mappings.forEach((mapping) => {
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
						mainEntity.id,
					),
				});
			});
		});
		return connections;
	}, [mappings, filteredEntities, relatedEntityIds, mainEntity.id]);

	// Handlers
	const handleNodeClick = useCallback((id: string) => {
		setSelectedNode(id);
		if (onSelectNode) {
			onSelectNode(id);
		}
	}, []);

	const handleNodeDoubleClick = useCallback(
		(id: string) => {
			const entity = filteredEntities.find((e) => e.id === id);
			if (entity) {
				setDialogEntity(entity);
				setIsEntityDialogOpen(true);
			}
		},
		[filteredEntities],
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

	// Attribute hover handler
	const handleAttrHover = useCallback(
		(entityId: string, attrName: string | null) => {
			if (attrName) {
				setHoveredAttribute({ entityId, attrName });
			} else {
				setHoveredAttribute(null);
			}
		},
		[],
	);

	// Attribute click handler (toggle selection)
	const handleAttrClick = useCallback(
		(entityId: string, attrName: string) => {
			if (
				selectedAttribute?.entityId === entityId &&
				selectedAttribute?.attrName === attrName
			) {
				setAttrEdges([]);
				setSelectedAttributeLocal(null);
			} else {
				setAttrEdges([]);
				setSelectedAttributeLocal({ entityId, attrName });
			}
		},
		[selectedAttribute],
	);

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

	// Build attribute-level highlight maps for each entity (which attrs have mappings)
	const { entitySourceAttrs, entityTargetAttrs } = useMemo(() => {
		const sourceAttrs = new Map<string, Set<string>>();
		const targetAttrs = new Map<string, Set<string>>();
		mappings.forEach((mapping) => {
			if (!mapping.deps) return;
			mapping.deps.forEach((dep) => {
				if (!dep.attrMaps || dep.attrMaps.length === 0) return;
				dep.attrMaps.forEach((attrMap) => {
					// Source entity has this attr as source
					if (!sourceAttrs.has(dep.entityId)) {
						sourceAttrs.set(dep.entityId, new Set());
					}
					sourceAttrs.get(dep.entityId)!.add(attrMap.src);
					// Target entity has this attr as target
					if (!targetAttrs.has(mapping.entityId)) {
						targetAttrs.set(mapping.entityId, new Set());
					}
					targetAttrs.get(mapping.entityId)!.add(attrMap.dst);
				});
			});
		});
		return { entitySourceAttrs: sourceAttrs, entityTargetAttrs: targetAttrs };
	}, [mappings]);

	// Build attribute connection map for highlighting
	const attrConnectionMap = useMemo(() => {
		const map = new Map<string, Set<string>>();
		mappings.forEach((mapping) => {
			if (!mapping.deps) return;
			mapping.deps.forEach((dep) => {
				dep.attrMaps?.forEach((am) => {
					const srcKey = `${dep.entityId}::${am.src}`;
					const dstKey = `${mapping.entityId}::${am.dst}`;
					if (!map.has(srcKey)) map.set(srcKey, new Set());
					if (!map.has(dstKey)) map.set(dstKey, new Set());
					map.get(srcKey)!.add(dstKey);
					map.get(dstKey)!.add(srcKey);
				});
			});
		});
		return map;
	}, [mappings]);

	// Compute hover-highlighted attributes
	const hoverHighlightedByEntity = useMemo(() => {
		const result = new Map<string, Set<string>>();
		if (!hoveredAttribute) return result;
		const hoveredKey = `${hoveredAttribute.entityId}::${hoveredAttribute.attrName}`;
		const connectedAttrs = attrConnectionMap.get(hoveredKey);
		if (!result.has(hoveredAttribute.entityId)) {
			result.set(hoveredAttribute.entityId, new Set());
		}
		result.get(hoveredAttribute.entityId)!.add(hoveredAttribute.attrName);
		if (connectedAttrs) {
			for (const connKey of connectedAttrs) {
				const [entId, attrName] = connKey.split("::");
				if (!result.has(entId)) result.set(entId, new Set());
				result.get(entId)!.add(attrName);
			}
		}
		return result;
	}, [hoveredAttribute, attrConnectionMap]);

	const [attrEdges, setAttrEdges] = useState<Edge[]>([]);

	// Compute selected-highlighted attributes
	const selectedHighlightedByEntity = useMemo(() => {
		const result = new Map<string, Set<string>>();
		if (!selectedAttribute) return result;
		const selectedKey = `${selectedAttribute.entityId}::${selectedAttribute.attrName}`;
		const connectedAttrs = attrConnectionMap.get(selectedKey);
		if (!result.has(selectedAttribute.entityId)) {
			result.set(selectedAttribute.entityId, new Set());
		}
		result.get(selectedAttribute.entityId)!.add(selectedAttribute.attrName);
		if (connectedAttrs) {
			for (const connKey of connectedAttrs) {
				const [entId, attrName] = connKey.split("::");
				if (!result.has(entId)) result.set(entId, new Set());
				result.get(entId)!.add(attrName);

				setAttrEdges((prev) => [
					...prev,
					{
						id: selectedKey + "->" + connKey,
						source: selectedAttribute.entityId,
						target: entId,
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
	}, [selectedAttribute, attrConnectionMap]);

	// Handler for edge double-click to open mapping dialog
	const handleEdgeDoubleClick = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			console.log(edge);
			const edgePrefix = `${edge.source}->${edge.target}`;

			const connection = entityConnections.find((conn) => {
				if (selectedAttribute) {
					console.log(selectedAttribute);
					return conn.id.startsWith(edgePrefix);
				}
				return conn.id === edge.id || conn.id.startsWith(edgePrefix);
			});
			if (connection) {
				setSelectedConnection(connection);
				setIsMappingDialogOpen(true);
			}
		},
		[entityConnections, selectedAttribute],
	);

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

	// Create nodes
	const nodes: EntityNode[] = useMemo(() => {
		return filteredEntities.map((entity) => {
			let highlightType: EntityNodeData["highlightType"] = "none";
			if (entity.id === selectedNode) {
				highlightType = "selected";
			} else if (upstreamNodes.has(entity.id)) {
				highlightType = "upstream";
			} else if (downstreamNodes.has(entity.id)) {
				highlightType = "downstream";
			}

			// Show all attrs for main entity
			const isMainEntity = entity.id === mainEntity.id;

			return {
				id: entity.id,
				type: "entityNode",
				position: { x: 0, y: 0 },
				data: {
					entity,
					isHighlighted: highlightType !== "none",
					highlightType,
					onNodeClick: handleNodeClick,
					onNodeDoubleClick: handleNodeDoubleClick,
					onAttrHover: handleAttrHover,
					onAttrClick: handleAttrClick,
					onToggleExpand: handleExpandToggle,
					isExpanded: expandedNodes.has(entity.id),
					graphId: mainEntity.id,
					upstreamCount: upstreamCounts.get(entity.id) || 0,
					downstreamCount: downstreamCounts.get(entity.id) || 0,
					highlightedSourceAttrs:
						entitySourceAttrs.get(entity.id) || new Set<string>(),
					highlightedTargetAttrs:
						entityTargetAttrs.get(entity.id) || new Set<string>(),
					hoverHighlightedAttrs: hoverHighlightedByEntity.get(entity.id),
					selectedHighlightedAttrs: selectedHighlightedByEntity.get(entity.id),
					showAllAttrs: isMainEntity,
				},
			};
		});
	}, [
		filteredEntities,
		selectedNode,
		upstreamNodes,
		downstreamNodes,
		upstreamCounts,
		downstreamCounts,
		handleNodeClick,
		handleNodeDoubleClick,
		handleAttrHover,
		handleAttrClick,
		handleExpandToggle,
		expandedNodes,
		mainEntity.id,
		entitySourceAttrs,
		entityTargetAttrs,
		hoverHighlightedByEntity,
		selectedHighlightedByEntity,
	]);

	// Create a map of connections for quick lookup
	const connectionMap = useMemo(() => {
		const map = new Map<string, EntityConnection>();
		entityConnections.forEach((conn) => {
			map.set(conn.id, conn);
		});
		return map;
	}, [entityConnections]);

	// Create edges
	const edges: Edge[] = useMemo(() => {
		const edgeList: Edge[] = [];
		const edgeSet = new Set<string>();

		attrEdges.forEach((attr) => {
			edgeList.push(attr);
		});

		if (attrEdges.length === 0) {
			mappings.forEach((mapping) => {
				if (!mapping.deps) return;

				mapping.deps.forEach((dep) => {
					// Only include edges between filtered entities
					if (
						!relatedEntityIds.has(dep.entityId) ||
						!relatedEntityIds.has(mapping.entityId)
					) {
						return;
					}

					const edgeId = `${dep.entityId}->${mapping.entityId}`;
					if (edgeSet.has(edgeId)) return;
					edgeSet.add(edgeId);

					const isHighlighted =
						(upstreamNodes.has(dep.entityId) &&
							upstreamNodes.has(mapping.entityId)) ||
						(downstreamNodes.has(dep.entityId) &&
							downstreamNodes.has(mapping.entityId)) ||
						dep.entityId === selectedNode ||
						mapping.entityId === selectedNode;

					const _isSelected =
						(dep.entityId === selectedAttribute?.entityId ||
							mapping.entityId === selectedAttribute?.entityId) &&
						attrEdges.length === 0;

					// Get description from connection
					const connection = connectionMap.get(edgeId);
					const label = connection?.description;

					edgeList.push({
						id: edgeId,
						source: dep.entityId,
						target: mapping.entityId,
						type: "smoothstep",
						animated: isHighlighted,
						label,
						labelStyle: {
							fontSize: 10,
							fontWeight: 500,
							fill: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#666",
						},
						labelBgStyle: {
							fill: "#fff",
							fillOpacity: 0.9,
						},
						labelBgPadding: [4, 2] as [number, number],
						labelBgBorderRadius: 4,
						style: {
							stroke: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
							strokeWidth: isHighlighted ? 2 : 1,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
						},
					});
				});
			});
		}

		return edgeList;
	}, [
		attrEdges,
		mappings,
		relatedEntityIds,
		upstreamNodes,
		downstreamNodes,
		connectionMap,
		selectedNode,
	]);

	// Apply layout (recalculates when expandedNodes changes)
	const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
		return getLayoutedElements(nodes, edges, layoutDirection, expandedNodes);
	}, [nodes, edges, layoutDirection, expandedNodes, selectedNode]);

	const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(
		layoutedNodes as Node[],
	);
	const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layoutedEdges);

	// Update nodes/edges when data changes
	useEffect(() => {
		setFlowNodes(layoutedNodes as Node[]);
		setFlowEdges(layoutedEdges);
	}, [layoutedNodes, layoutedEdges, setFlowNodes, setFlowEdges]);

	// Fit view on layout change
	useEffect(() => {
		const timer = setTimeout(() => {
			fitView({ padding: 0.15, duration: 300 });
		}, 100);
		return () => clearTimeout(timer);
	}, [layoutDirection, fitView]);

	// Notify parent about calculated entities
	useEffect(() => {
		if (onEntitiesCalculated) {
			onEntitiesCalculated(filteredEntities);
		}
	}, [filteredEntities, onEntitiesCalculated]);

	// Get selected entity
	const selectedEntity = useMemo(() => {
		if (!selectedNode) return null;
		return filteredEntities.find((e) => e.id === selectedNode) || null;
	}, [selectedNode, filteredEntities]);

	const { mode } = useColorScheme();

	return (
		<div style={{ width: "100%", height: "100%", position: "relative" }}>
			<ReactFlow
				nodes={flowNodes}
				edges={flowEdges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onEdgeDoubleClick={handleEdgeDoubleClick}
				onNodeContextMenu={handleNodeContextMenu}
				nodeTypes={nodeTypes}
				fitView
				minZoom={0.01}
				maxZoom={1}
				proOptions={{ hideAttribution: true }}
				colorMode={mode}
				onlyRenderVisibleElements
			>
				<Background color="#e0e0e0" gap={16} />
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
						borderRadius: 6,
					}}
				/>

				{/* Control Panel */}
				<Panel position="top-left">
					<div
						style={{
							background: "#fff",
							padding: 12,
							borderRadius: 8,
							boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							minWidth: 200,
						}}
					>
						<div style={{ marginBottom: 8 }}>
							<div style={{ fontSize: 11, color: "#666" }}>
								{filteredEntities.length} связанных сущностей
							</div>
						</div>

						{/* Layout Direction */}
						<div style={{ display: "flex", gap: 6 }}>
							<button
								onClick={() => setLayoutDirection("LR")}
								style={{
									flex: 1,
									padding: "5px 10px",
									border: "1px solid #ddd",
									borderRadius: 4,
									background: layoutDirection === "LR" ? "#1976d2" : "#fff",
									color: layoutDirection === "LR" ? "#fff" : "#333",
									cursor: "pointer",
									fontSize: 11,
								}}
							>
								↔ Горизонт.
							</button>
							<button
								onClick={() => setLayoutDirection("TB")}
								style={{
									flex: 1,
									padding: "5px 10px",
									border: "1px solid #ddd",
									borderRadius: 4,
									background: layoutDirection === "TB" ? "#1976d2" : "#fff",
									color: layoutDirection === "TB" ? "#fff" : "#333",
									cursor: "pointer",
									fontSize: 11,
								}}
							>
								↕ Вертикал.
							</button>
						</div>
					</div>
				</Panel>

				{/* Legend */}
				{/* <Panel position="bottom-left">
					<div
						style={{
							background: "#fff",
							padding: 8,
							borderRadius: 6,
							boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
							fontSize: 9,
						}}
					>
						<div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 8,
										height: 8,
										background: HIGHLIGHT_COLORS.selected,
										borderRadius: 2,
									}}
								/>
								выбрано
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 8,
										height: 8,
										background: HIGHLIGHT_COLORS.upstream,
										borderRadius: 2,
									}}
								/>
								источники
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 8,
										height: 8,
										background: HIGHLIGHT_COLORS.downstream,
										borderRadius: 2,
									}}
								/>
								потребители
							</div>
						</div>
						<div
							style={{
								borderTop: "1px solid #eee",
								paddingTop: 4,
								color: "#888",
								fontSize: 8,
							}}
						>
							💡 2× клик по узлу или связи — детали
						</div>
					</div>
				</Panel> */}
			</ReactFlow>

			{/* Selected Entity Info */}
			{selectedEntity && selectedEntity.id !== mainEntity.id && (
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
							<div style={{ fontWeight: 600, fontSize: 13 }}>
								{selectedEntity.name || selectedEntity.id}
							</div>
						</div>
						<button
							onClick={() => setSelectedNode(mainEntity.id)}
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
					connections={
						entityConnections.filter(
							(c) =>
								c.sourceId === dialogEntity.id ||
								c.targetId === dialogEntity.id,
						) as any
					}
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
};

// ============================================================================
// Main Component
// ============================================================================

interface EntityNodeViewProps {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
	onEntitiesCalculated?: (entities: DataLineageEntity[]) => void;
	highlightedAttr?: string | null;
	onSelectNode?: (data: any) => void;
}

export const EntityNodeView: React.FC<EntityNodeViewProps> = ({
	entity,
	mappings,
	onEntitiesCalculated,
	highlightedAttr,
	onSelectNode,
}) => {
	const { currentGraph } = useDataLineageStore();

	// Get all entities from the store
	const allEntities = useMemo(() => {
		if (!currentGraph?.entities) return [];
		return currentGraph.entities;
	}, [currentGraph?.entities]);

	if (!entity) {
		return (
			<div
				style={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#666",
				}}
			>
				Сущность не выбрана
			</div>
		);
	}

	return (
		<div style={{ height: "100%", width: "100%" }}>
			<ReactFlowProvider>
				<EntityGraphInner
					mainEntity={entity}
					allEntities={allEntities.length > 0 ? allEntities : [entity]}
					mappings={mappings}
					onEntitiesCalculated={onEntitiesCalculated}
					highlightedAttr={highlightedAttr}
					onSelectNode={onSelectNode}
				/>
			</ReactFlowProvider>
		</div>
	);
};
