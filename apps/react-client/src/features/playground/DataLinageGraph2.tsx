import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { useNavigate } from "react-router";
import {
	ReactFlow,
	Node,
	Edge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
	NodeProps,
	MarkerType,
	Panel,
	useReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";

// ============================================================================
// Types
// ============================================================================

interface EntityNodeData {
	entity: DataLineageEntity;
	isHighlighted: boolean;
	highlightType: "none" | "selected" | "upstream" | "downstream";
	onNodeClick: (id: string) => void;
	upstreamCount: number;
	downstreamCount: number;
	[key: string]: unknown;
}

type EntityNode = Node<EntityNodeData, "entityNode">;

interface FilterState {
	search: string;
	entityTypes: string[];
	modifiedOnly: boolean;
	namespaces: string[];
	hasUpstream: "any" | "yes" | "no";
	hasDownstream: "any" | "yes" | "no";
	attrCountMin: string;
	attrCountMax: string;
}

const initialFilters: FilterState = {
	search: "",
	entityTypes: [],
	modifiedOnly: false,
	namespaces: [],
	hasUpstream: "any",
	hasDownstream: "any",
	attrCountMin: "",
	attrCountMax: "",
};

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 280;
const NODE_HEADER_HEIGHT = 60;
const ATTR_ROW_HEIGHT = 22;
const MAX_VISIBLE_ATTRS = 4;

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	table: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	view: { bg: "#f3e5f5", border: "#7b1fa2", text: "#6a1b9a" },
	rdd: { bg: "#fff3e0", border: "#f57c00", text: "#e65100" },
	unresolved: { bg: "#fce4ec", border: "#c2185b", text: "#ad1457" },
};

const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
};

// ============================================================================
// Custom Node Component (simplified - click opens detail panel)
// ============================================================================

const EntityNodeComponent = memo(({ data, id }: NodeProps<EntityNode>) => {
	const { entity, highlightType, onNodeClick, upstreamCount, downstreamCount } =
		data;
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
	const attrs = entity.attrSeq || [];
	const visibleAttrs = attrs.slice(0, MAX_VISIBLE_ATTRS);
	const moreCount = attrs.length - MAX_VISIBLE_ATTRS;

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
						? `0 4px 20px ${borderColor}40`
						: "0 2px 8px rgba(0,0,0,0.1)",
				overflow: "hidden",
				cursor: "pointer",
				transition: "all 0.2s ease",
			}}
			onClick={() => onNodeClick(id)}
		>
			{/* Header */}
			<div
				style={{
					background: colors.bg,
					padding: "8px 12px",
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
								fontSize: 11,
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
										fontSize: 9,
									}}
								>
									изм.
								</span>
							)}
							{isDataMart && (
								<span
									style={{
										marginLeft: 6,
										background: "#9c27b0",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
									title="Витрина данных — конечная точка, данные не передаются дальше"
								>
									витрина
								</span>
							)}
							{isSource && (
								<span
									style={{
										marginLeft: 6,
										background: "#00897b",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
									title="Источник данных — начальная точка, данные не поступают извне"
								>
									источник
								</span>
							)}
						</div>
						<div
							style={{
								fontWeight: 600,
								fontSize: 13,
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
									fontSize: 10,
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
				<div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10 }}>
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
				<div>
					{visibleAttrs.map((attr, idx) => (
						<div
							key={attr.name}
							style={{
								display: "flex",
								justifyContent: "space-between",
								padding: "3px 12px",
								fontSize: 10,
								borderBottom:
									idx < visibleAttrs.length - 1 ? "1px solid #f5f5f5" : "none",
								background: idx % 2 === 0 ? "#fafafa" : "#fff",
							}}
						>
							<span
								style={{
									color: "#555",
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
						</div>
					))}
					{moreCount > 0 && (
						<div
							style={{
								padding: "4px 12px",
								fontSize: 10,
								color: "#1976d2",
								background: "#f8f9fa",
								textAlign: "center",
							}}
						>
							+{moreCount} ещё...
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
					width: 10,
					height: 10,
					border: "2px solid #fff",
				}}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{
					background: colors.border,
					width: 10,
					height: 10,
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
// Entity Detail Panel Component
// ============================================================================

interface EntityDetailPanelProps {
	entity: DataLineageEntity;
	upstreamCount: number;
	downstreamCount: number;
	onClose: () => void;
}

const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
	entity,
	upstreamCount,
	downstreamCount,
	onClose,
}) => {
	const navigate = useNavigate();
	const [attrSearch, setAttrSearch] = useState("");
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
	const attrs = entity.attrSeq || [];

	// Filter attributes by search query
	const filteredAttrs = attrSearch
		? attrs.filter(
				(attr) =>
					attr.name.toLowerCase().includes(attrSearch.toLowerCase()) ||
					attr.type?.toLowerCase().includes(attrSearch.toLowerCase()) ||
					attr.comment?.toLowerCase().includes(attrSearch.toLowerCase()),
			)
		: attrs;

	const handleOpenFullPage = () => {
		// Encode the entity ID for URL safety (handles special chars like /)
		const encodedId = encodeURIComponent(entity.id);
		navigate(`/entity/${encodedId}`);
	};

	return (
		<div
			data-name="floating-card"
			style={{
				position: "absolute",
				top: 16,
				right: 16,
				width: 380,
				maxHeight: "calc(100% - 32px)",
				background: "#fff",
				borderRadius: 12,
				boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
				overflow: "hidden",
				zIndex: 1000,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header */}
			<div
				style={{
					background: colors.bg,
					padding: "16px 20px",
					borderBottom: `2px solid ${colors.border}`,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
					}}
				>
					<div style={{ flex: 1 }}>
						<div
							style={{
								fontSize: 12,
								color: colors.text,
								textTransform: "uppercase",
								marginBottom: 4,
							}}
						>
							{entity.type}
							{entity.modified && (
								<span
									style={{
										marginLeft: 8,
										background: "#ff9800",
										color: "#fff",
										padding: "2px 6px",
										borderRadius: 4,
										fontSize: 10,
									}}
								>
									изменено
								</span>
							)}
						</div>
						<div
							style={{
								fontSize: 16,
								fontWeight: 600,
								color: "#333",
								wordBreak: "break-word",
							}}
						>
							{entity.name || entity.id}
						</div>
						{entity.namespace && (
							<div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
								{entity.namespace}
							</div>
						)}
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: 24,
							cursor: "pointer",
							color: "#666",
							padding: 0,
							lineHeight: 1,
						}}
					>
						×
					</button>
				</div>

				{/* Stats */}
				<div style={{ display: "flex", gap: 16, marginTop: 12 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
						<span
							style={{
								width: 8,
								height: 8,
								background: HIGHLIGHT_COLORS.upstream,
								borderRadius: "50%",
							}}
						/>
						<span style={{ fontSize: 12, color: "#666" }}>
							Источники: {upstreamCount}
						</span>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
						<span
							style={{
								width: 8,
								height: 8,
								background: HIGHLIGHT_COLORS.downstream,
								borderRadius: "50%",
							}}
						/>
						<span style={{ fontSize: 12, color: "#666" }}>
							Потребители: {downstreamCount}
						</span>
					</div>
				</div>
			</div>

			{/* Attributes */}
			<div style={{ flex: 1, overflow: "auto" }}>
				<div
					style={{
						padding: "12px 20px",
						borderBottom: "1px solid #eee",
						background: "#f8f9fa",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 8,
						}}
					>
						<span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
							Атрибуты ({filteredAttrs.length}/{attrs.length})
						</span>
					</div>
					<input
						type="text"
						placeholder="Поиск по атрибутам..."
						value={attrSearch}
						onChange={(e) => setAttrSearch(e.target.value)}
						style={{
							width: "100%",
							padding: "8px 12px",
							border: "1px solid #ddd",
							borderRadius: 6,
							fontSize: 13,
							outline: "none",
							boxSizing: "border-box",
						}}
						onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
						onBlur={(e) => (e.target.style.borderColor = "#ddd")}
					/>
				</div>
				{filteredAttrs.length > 0 ? (
					<div style={{ maxHeight: 400, overflow: "auto" }}>
						{filteredAttrs.map((attr, idx) => (
							<div
								key={attr.name}
								style={{
									padding: "10px 20px",
									borderBottom: "1px solid #f0f0f0",
									background: idx % 2 === 0 ? "#fff" : "#fafafa",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<span
										style={{ fontSize: 13, color: "#333", fontWeight: 500 }}
									>
										{attr.name}
									</span>
									<span
										style={{
											fontSize: 11,
											color: "#fff",
											background: colors.border,
											padding: "2px 8px",
											borderRadius: 4,
										}}
									>
										{attr.type}
									</span>
								</div>
								{attr.comment && (
									<div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
										{attr.comment}
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div style={{ padding: 20, textAlign: "center", color: "#888" }}>
						{attrSearch ? "Ничего не найдено" : "Нет атрибутов"}
					</div>
				)}
			</div>

			{/* Footer */}
			<div
				style={{
					padding: "12px 20px",
					borderTop: "1px solid #eee",
					background: "#f8f9fa",
				}}
			>
				<button
					onClick={handleOpenFullPage}
					style={{
						width: "100%",
						padding: "10px 16px",
						background: "#1976d2",
						color: "#fff",
						border: "none",
						borderRadius: 8,
						fontSize: 13,
						fontWeight: 500,
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						marginBottom: 8,
						transition: "background 0.2s",
					}}
					onMouseOver={(e) => (e.currentTarget.style.background = "#1565c0")}
					onMouseOut={(e) => (e.currentTarget.style.background = "#1976d2")}
				>
					<span>↗</span>
					Открыть полную карточку
				</button>
				<div
					style={{
						fontSize: 10,
						color: "#888",
						fontFamily: "monospace",
						wordBreak: "break-all",
					}}
				>
					ID: {entity.id}
				</div>
			</div>
		</div>
	);
};

// ============================================================================
// Layout Utilities
// ============================================================================

const getLayoutedElements = (
	nodes: EntityNode[],
	edges: Edge[],
	direction: "LR" | "TB" = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 80,
		ranksep: 150,
		marginx: 50,
		marginy: 50,
	});

	nodes.forEach((node) => {
		const attrCount = node.data.entity.attrSeq?.length || 0;
		const visibleAttrs = Math.min(attrCount, MAX_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrs * ATTR_ROW_HEIGHT +
			(attrCount > MAX_VISIBLE_ATTRS ? 24 : 0);

		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const attrCount = node.data.entity.attrSeq?.length || 0;
		const visibleAttrs = Math.min(attrCount, MAX_VISIBLE_ATTRS);
		const height =
			NODE_HEADER_HEIGHT +
			visibleAttrs * ATTR_ROW_HEIGHT +
			(attrCount > MAX_VISIBLE_ATTRS ? 24 : 0);

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
// Data Transformation
// ============================================================================

const transformDataToGraph = (
	data: DataLineageSchema,
	selectedNode: string | null,
	upstreamNodes: Set<string>,
	downstreamNodes: Set<string>,
	upstreamCounts: Map<string, number>,
	downstreamCounts: Map<string, number>,
	onNodeClick: (id: string) => void,
): { nodes: EntityNode[]; edges: Edge[] } => {
	// Create entity map for quick lookup
	const entityMap = new Map<string, DataLineageEntity>();
	for (const entity of data.entities) {
		entityMap.set(entity.id, entity);
	}

	// Create nodes
	const nodes: EntityNode[] = data.entities.map((entity) => {
		let highlightType: EntityNodeData["highlightType"] = "none";
		if (entity.id === selectedNode) {
			highlightType = "selected";
		} else if (upstreamNodes.has(entity.id)) {
			highlightType = "upstream";
		} else if (downstreamNodes.has(entity.id)) {
			highlightType = "downstream";
		}

		return {
			id: entity.id,
			type: "entityNode",
			position: { x: 0, y: 0 },
			data: {
				entity,
				isHighlighted: highlightType !== "none",
				highlightType,
				onNodeClick,
				upstreamCount: upstreamCounts.get(entity.id) || 0,
				downstreamCount: downstreamCounts.get(entity.id) || 0,
			},
		};
	});

	// Create edges from mappings
	const edges: Edge[] = [];
	const edgeSet = new Set<string>();

	data.mappings.forEach((mapping) => {
		if (!mapping.deps) return;

		mapping.deps.forEach((dep) => {
			const edgeId = `${dep.entityId}->${mapping.entityId}`;
			if (edgeSet.has(edgeId)) return;
			edgeSet.add(edgeId);

			// Check if both entities exist
			if (!entityMap.has(dep.entityId) || !entityMap.has(mapping.entityId)) {
				return;
			}

			const isHighlighted =
				(upstreamNodes.has(dep.entityId) &&
					upstreamNodes.has(mapping.entityId)) ||
				(downstreamNodes.has(dep.entityId) &&
					downstreamNodes.has(mapping.entityId)) ||
				dep.entityId === selectedNode ||
				mapping.entityId === selectedNode;

			edges.push({
				id: edgeId,
				source: dep.entityId,
				target: mapping.entityId,
				type: "smoothstep",
				animated: isHighlighted,
				style: {
					stroke: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
					strokeWidth: isHighlighted ? 2 : 1,
				},
				markerEnd: {
					type: MarkerType.ArrowClosed,
					color: isHighlighted ? HIGHLIGHT_COLORS.downstream : "#b1b1b7",
				},
				data: {
					attrMaps: dep.attrMaps,
					atrDeps: dep.atrDeps,
				},
			});
		});
	});

	return { nodes, edges };
};

// ============================================================================
// Build Lineage Graph (for upstream/downstream traversal)
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
			// dep.entityId -> mapping.entityId (source -> target)
			// upstream of mapping.entityId includes dep.entityId
			if (!upstream.has(mapping.entityId)) {
				upstream.set(mapping.entityId, new Set());
			}
			upstream.get(mapping.entityId)!.add(dep.entityId);

			// downstream of dep.entityId includes mapping.entityId
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
// Main Component (Inner)
// ============================================================================

const DataLineageGraphInner: React.FC<{ data: DataLineageSchema }> = ({
	data,
}) => {
	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [showUpstream, setShowUpstream] = useState(true);
	const [showDownstream, setShowDownstream] = useState(true);
	const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");

	const { fitView } = useReactFlow();

	// Build lineage graph for traversal
	const lineageGraph = useMemo(
		() => buildLineageGraph(data.mappings),
		[data.mappings],
	);

	// Get unique values for filters
	const filterOptions = useMemo(() => {
		const entityTypes = [...new Set(data.entities.map((e) => e.type))];
		const namespaces = [
			...new Set(data.entities.map((e) => e.namespace).filter(Boolean)),
		] as string[];
		return { entityTypes, namespaces };
	}, [data.entities]);

	// Calculate upstream/downstream counts for each entity
	const { upstreamCounts, downstreamCounts } = useMemo(() => {
		const upCounts = new Map<string, number>();
		const downCounts = new Map<string, number>();

		for (const entity of data.entities) {
			const upNodes = getUpstreamNodes(entity.id, lineageGraph.upstream);
			upNodes.delete(entity.id);
			upCounts.set(entity.id, upNodes.size);

			const downNodes = getDownstreamNodes(entity.id, lineageGraph.downstream);
			downNodes.delete(entity.id);
			downCounts.set(entity.id, downNodes.size);
		}

		return { upstreamCounts: upCounts, downstreamCounts: downCounts };
	}, [data.entities, lineageGraph]);

	// Calculate upstream/downstream for selected node
	const { upstreamNodes, downstreamNodes } = useMemo(() => {
		if (!selectedNode) {
			return {
				upstreamNodes: new Set<string>(),
				downstreamNodes: new Set<string>(),
			};
		}

		const upstream = showUpstream
			? getUpstreamNodes(selectedNode, lineageGraph.upstream)
			: new Set<string>();
		const downstream = showDownstream
			? getDownstreamNodes(selectedNode, lineageGraph.downstream)
			: new Set<string>();

		upstream.delete(selectedNode);
		downstream.delete(selectedNode);

		return { upstreamNodes: upstream, downstreamNodes: downstream };
	}, [selectedNode, lineageGraph, showUpstream, showDownstream]);

	// Handlers
	const handleNodeClick = useCallback((id: string) => {
		setSelectedNode(id);
	}, []);

	const updateFilter = useCallback(
		<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const resetFilters = useCallback(() => {
		setFilters(initialFilters);
	}, []);

	const getActiveFilterCount = useCallback(() => {
		let count = 0;
		if (filters.search) count++;
		if (filters.entityTypes.length) count++;
		if (filters.modifiedOnly) count++;
		if (filters.namespaces.length) count++;
		if (filters.hasUpstream !== "any") count++;
		if (filters.hasDownstream !== "any") count++;
		if (filters.attrCountMin || filters.attrCountMax) count++;
		return count;
	}, [filters]);

	// Filter entities based on all filters
	const filteredData = useMemo(() => {
		let entities = data.entities;

		// Quick search
		if (filters.search.trim()) {
			const query = filters.search.toLowerCase();
			entities = entities.filter(
				(e) =>
					e.id.toLowerCase().includes(query) ||
					e.name?.toLowerCase().includes(query) ||
					e.namespace?.toLowerCase().includes(query) ||
					e.attrSeq?.some((attr) => attr.name.toLowerCase().includes(query)),
			);
		}

		// Entity type filter
		if (filters.entityTypes.length > 0) {
			entities = entities.filter((e) => filters.entityTypes.includes(e.type));
		}

		// Modified only
		if (filters.modifiedOnly) {
			entities = entities.filter((e) => e.modified);
		}

		// Namespace filter
		if (filters.namespaces.length > 0) {
			entities = entities.filter(
				(e) => e.namespace && filters.namespaces.includes(e.namespace),
			);
		}

		// Has upstream filter
		if (filters.hasUpstream !== "any") {
			entities = entities.filter((e) => {
				const count = upstreamCounts.get(e.id) || 0;
				return filters.hasUpstream === "yes" ? count > 0 : count === 0;
			});
		}

		// Has downstream filter
		if (filters.hasDownstream !== "any") {
			entities = entities.filter((e) => {
				const count = downstreamCounts.get(e.id) || 0;
				return filters.hasDownstream === "yes" ? count > 0 : count === 0;
			});
		}

		// Attribute count filter
		if (filters.attrCountMin || filters.attrCountMax) {
			const min = filters.attrCountMin
				? Number.parseInt(filters.attrCountMin, 10)
				: 0;
			const max = filters.attrCountMax
				? Number.parseInt(filters.attrCountMax, 10)
				: Number.POSITIVE_INFINITY;
			entities = entities.filter((e) => {
				const count = e.attrSeq?.length || 0;
				return count >= min && count <= max;
			});
		}

		return { ...data, entities };
	}, [data, filters, upstreamCounts, downstreamCounts]);

	// Transform data to graph
	const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
		return transformDataToGraph(
			filteredData,
			selectedNode,
			upstreamNodes,
			downstreamNodes,
			upstreamCounts,
			downstreamCounts,
			handleNodeClick,
		);
	}, [
		filteredData,
		selectedNode,
		upstreamNodes,
		downstreamNodes,
		upstreamCounts,
		downstreamCounts,
		handleNodeClick,
	]);

	// Apply layout
	const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
		return getLayoutedElements(initialNodes, initialEdges, layoutDirection);
	}, [initialNodes, initialEdges, layoutDirection]);

	const [nodes, setNodes, onNodesChange] = useNodesState(
		layoutedNodes as Node[],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

	// Update nodes/edges when data changes
	useEffect(() => {
		setNodes(layoutedNodes as Node[]);
		setEdges(layoutedEdges);
	}, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

	// Fit view on layout change
	useEffect(() => {
		const timer = setTimeout(() => {
			fitView({ padding: 0.1, duration: 300 });
		}, 100);
		return () => clearTimeout(timer);
	}, [layoutDirection, fitView, filteredData]);

	// Get selected entity info
	const selectedEntity = useMemo(() => {
		if (!selectedNode) return null;
		return data.entities.find((e) => e.id === selectedNode) || null;
	}, [selectedNode, data.entities]);

	const activeFilterCount = getActiveFilterCount();

	return (
		<div style={{ width: "100%", height: "100%", position: "relative" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
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

				{/* Search & Filter Panel */}
				<Panel position="top-left">
					<div
						style={{
							background: "#fff",
							padding: 16,
							borderRadius: 12,
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
							minWidth: 340,
							maxWidth: 400,
						}}
					>
						{/* Header */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<div>
								<div style={{ fontWeight: 600, fontSize: 15 }}>
									Граф Data Lineage
								</div>
								<div style={{ fontSize: 11, color: "#888" }}>
									{filteredData.entities.length} из {data.entities.length}{" "}
									сущностей
								</div>
							</div>
							<div style={{ display: "flex", gap: 6 }}>
								<button
									onClick={() =>
										setLayoutDirection(layoutDirection === "LR" ? "TB" : "LR")
									}
									style={{
										padding: "6px 10px",
										border: "1px solid #ddd",
										borderRadius: 6,
										background: "#fff",
										cursor: "pointer",
										fontSize: 11,
									}}
								>
									{layoutDirection === "LR" ? "↔" : "↕"}
								</button>
							</div>
						</div>

						{/* Quick Search */}
						<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
							<div style={{ flex: 1, position: "relative" }}>
								<input
									type="text"
									placeholder="Быстрый поиск..."
									value={filters.search}
									onChange={(e) => updateFilter("search", e.target.value)}
									style={{
										width: "100%",
										padding: "10px 12px",
										paddingRight: filters.search ? 32 : 12,
										border: "2px solid #e0e0e0",
										borderRadius: 8,
										fontSize: 13,
										outline: "none",
										transition: "border-color 0.2s",
									}}
									onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
									onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
								/>
								{filters.search && (
									<button
										onClick={() => updateFilter("search", "")}
										style={{
											position: "absolute",
											right: 8,
											top: "50%",
											transform: "translateY(-50%)",
											background: "none",
											border: "none",
											cursor: "pointer",
											fontSize: 16,
											color: "#999",
										}}
									>
										×
									</button>
								)}
							</div>
							<button
								onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
								style={{
									padding: "10px 14px",
									border: "2px solid #e0e0e0",
									borderRadius: 8,
									background: showAdvancedFilters ? "#1976d2" : "#fff",
									color: showAdvancedFilters ? "#fff" : "#333",
									cursor: "pointer",
									fontSize: 12,
									fontWeight: 500,
									display: "flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								Фильтры
								{activeFilterCount > 0 && (
									<span
										style={{
											background: showAdvancedFilters ? "#fff" : "#f44336",
											color: showAdvancedFilters ? "#1976d2" : "#fff",
											borderRadius: 10,
											padding: "2px 6px",
											fontSize: 10,
											fontWeight: 600,
										}}
									>
										{activeFilterCount}
									</span>
								)}
							</button>
						</div>

						{/* Advanced Filters */}
						{showAdvancedFilters && (
							<div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
								{/* Entity Type */}
								<div style={{ marginBottom: 12 }}>
									<div
										style={{
											fontSize: 11,
											fontWeight: 600,
											color: "#666",
											marginBottom: 6,
										}}
									>
										Тип сущности
									</div>
									<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
										{filterOptions.entityTypes.map((type) => (
											<button
												key={type}
												onClick={() => {
													const newTypes = filters.entityTypes.includes(type)
														? filters.entityTypes.filter((t) => t !== type)
														: [...filters.entityTypes, type];
													updateFilter("entityTypes", newTypes);
												}}
												style={{
													padding: "4px 10px",
													border: "1px solid",
													borderColor: filters.entityTypes.includes(type)
														? TYPE_COLORS[type]?.border
														: "#ddd",
													borderRadius: 12,
													background: filters.entityTypes.includes(type)
														? TYPE_COLORS[type]?.bg
														: "#fff",
													color: filters.entityTypes.includes(type)
														? TYPE_COLORS[type]?.text
														: "#666",
													cursor: "pointer",
													fontSize: 11,
													fontWeight: filters.entityTypes.includes(type)
														? 600
														: 400,
												}}
											>
												{type}
											</button>
										))}
									</div>
								</div>

								{/* Namespace */}
								{filterOptions.namespaces.length > 0 && (
									<div style={{ marginBottom: 12 }}>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: "#666",
												marginBottom: 6,
											}}
										>
											Схема / Namespace
										</div>
										<div
											style={{
												display: "flex",
												flexWrap: "wrap",
												gap: 6,
												maxHeight: 80,
												overflow: "auto",
											}}
										>
											{filterOptions.namespaces.slice(0, 10).map((ns) => (
												<button
													key={ns}
													onClick={() => {
														const newNs = filters.namespaces.includes(ns)
															? filters.namespaces.filter((n) => n !== ns)
															: [...filters.namespaces, ns];
														updateFilter("namespaces", newNs);
													}}
													style={{
														padding: "4px 10px",
														border: "1px solid",
														borderColor: filters.namespaces.includes(ns)
															? "#1976d2"
															: "#ddd",
														borderRadius: 12,
														background: filters.namespaces.includes(ns)
															? "#e3f2fd"
															: "#fff",
														color: filters.namespaces.includes(ns)
															? "#1976d2"
															: "#666",
														cursor: "pointer",
														fontSize: 10,
														fontWeight: filters.namespaces.includes(ns)
															? 600
															: 400,
														maxWidth: 150,
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
													title={ns}
												>
													{ns}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Switches row */}
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: 12,
										marginBottom: 12,
									}}
								>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											cursor: "pointer",
											fontSize: 11,
										}}
									>
										<input
											type="checkbox"
											checked={filters.modifiedOnly}
											onChange={(e) =>
												updateFilter("modifiedOnly", e.target.checked)
											}
										/>
										Только изменённые
									</label>
								</div>

								{/* Connection filters */}
								<div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
									<div style={{ flex: 1 }}>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: "#666",
												marginBottom: 4,
											}}
										>
											Источники
										</div>
										<select
											value={filters.hasUpstream}
											onChange={(e) =>
												updateFilter(
													"hasUpstream",
													e.target.value as FilterState["hasUpstream"],
												)
											}
											style={{
												width: "100%",
												padding: "6px 8px",
												border: "1px solid #ddd",
												borderRadius: 6,
												fontSize: 11,
											}}
										>
											<option value="any">Любые</option>
											<option value="yes">Есть</option>
											<option value="no">Нет</option>
										</select>
									</div>
									<div style={{ flex: 1 }}>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: "#666",
												marginBottom: 4,
											}}
										>
											Потребители
										</div>
										<select
											value={filters.hasDownstream}
											onChange={(e) =>
												updateFilter(
													"hasDownstream",
													e.target.value as FilterState["hasDownstream"],
												)
											}
											style={{
												width: "100%",
												padding: "6px 8px",
												border: "1px solid #ddd",
												borderRadius: 6,
												fontSize: 11,
											}}
										>
											<option value="any">Любые</option>
											<option value="yes">Есть</option>
											<option value="no">Нет</option>
										</select>
									</div>
								</div>

								{/* Attribute count */}
								<div style={{ marginBottom: 12 }}>
									<div
										style={{
											fontSize: 11,
											fontWeight: 600,
											color: "#666",
											marginBottom: 4,
										}}
									>
										Кол-во атрибутов
									</div>
									<div style={{ display: "flex", gap: 8 }}>
										<input
											type="number"
											placeholder="Мин"
											value={filters.attrCountMin}
											onChange={(e) =>
												updateFilter("attrCountMin", e.target.value)
											}
											style={{
												flex: 1,
												padding: "6px 8px",
												border: "1px solid #ddd",
												borderRadius: 6,
												fontSize: 11,
											}}
										/>
										<input
											type="number"
											placeholder="Макс"
											value={filters.attrCountMax}
											onChange={(e) =>
												updateFilter("attrCountMax", e.target.value)
											}
											style={{
												flex: 1,
												padding: "6px 8px",
												border: "1px solid #ddd",
												borderRadius: 6,
												fontSize: 11,
											}}
										/>
									</div>
								</div>

								{/* Reset button */}
								{activeFilterCount > 0 && (
									<button
										onClick={resetFilters}
										style={{
											width: "100%",
											padding: "8px",
											border: "1px solid #f44336",
											borderRadius: 6,
											background: "#fff",
											color: "#f44336",
											cursor: "pointer",
											fontSize: 12,
										}}
									>
										Сбросить фильтры
									</button>
								)}
							</div>
						)}

						{/* Lineage Options when node selected */}
						{selectedNode && (
							<div
								style={{
									borderTop: "1px solid #eee",
									paddingTop: 12,
									marginTop: 12,
								}}
							>
								<div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
									Просмотр связей
								</div>
								<div style={{ display: "flex", gap: 12 }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											cursor: "pointer",
											fontSize: 11,
										}}
									>
										<input
											type="checkbox"
											checked={showUpstream}
											onChange={(e) => setShowUpstream(e.target.checked)}
										/>
										<span
											style={{
												width: 10,
												height: 10,
												background: HIGHLIGHT_COLORS.upstream,
												borderRadius: 2,
											}}
										/>
										Источники ({upstreamNodes.size})
									</label>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											cursor: "pointer",
											fontSize: 11,
										}}
									>
										<input
											type="checkbox"
											checked={showDownstream}
											onChange={(e) => setShowDownstream(e.target.checked)}
										/>
										<span
											style={{
												width: 10,
												height: 10,
												background: HIGHLIGHT_COLORS.downstream,
												borderRadius: 2,
											}}
										/>
										Потребители ({downstreamNodes.size})
									</label>
								</div>
							</div>
						)}
					</div>
				</Panel>

				{/* Legend */}
				<Panel position="bottom-left">
					<div
						style={{
							background: "#fff",
							padding: 10,
							borderRadius: 8,
							boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
							display: "flex",
							gap: 12,
							fontSize: 10,
						}}
					>
						{Object.entries(TYPE_COLORS).map(([type, colors]) => (
							<div
								key={type}
								style={{ display: "flex", alignItems: "center", gap: 4 }}
							>
								<span
									style={{
										display: "inline-block",
										width: 10,
										height: 10,
										background: colors.bg,
										border: `2px solid ${colors.border}`,
										borderRadius: 3,
									}}
								/>
								{type}
							</div>
						))}
						<div
							style={{
								borderLeft: "1px solid #ddd",
								paddingLeft: 12,
								display: "flex",
								gap: 12,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 10,
										height: 10,
										background: HIGHLIGHT_COLORS.selected,
										borderRadius: 3,
									}}
								/>
								выбрано
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 10,
										height: 10,
										background: HIGHLIGHT_COLORS.upstream,
										borderRadius: 3,
									}}
								/>
								источники
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span
									style={{
										width: 10,
										height: 10,
										background: HIGHLIGHT_COLORS.downstream,
										borderRadius: 3,
									}}
								/>
								потребители
							</div>
						</div>
					</div>
				</Panel>
			</ReactFlow>

			{/* Entity Detail Panel */}
			{selectedEntity && (
				<EntityDetailPanel
					entity={selectedEntity}
					upstreamCount={upstreamNodes.size}
					downstreamCount={downstreamNodes.size}
					onClose={() => setSelectedNode(null)}
				/>
			)}
		</div>
	);
};

// ============================================================================
// Main Component (with Provider)
// ============================================================================

interface DataLineageGraph2Props {
	data?: DataLineageSchema;
}

export const DataLinageGraph2: React.FC<DataLineageGraph2Props> = ({
	data = dataLineageExampleData,
}) => {
	return (
		<div style={{ width: "100%", height: "100vh" }}>
			<ReactFlowProvider>
				<DataLineageGraphInner data={data} />
			</ReactFlowProvider>
		</div>
	);
};
