import { useState, useMemo, useCallback, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	Button,
	Box,
	Chip,
	Typography,
	IconButton,
	Paper,
	CircularProgress,
	Alert,
	Divider,
	useColorScheme,
} from "@mui/material";
import {
	ReactFlow,
	ReactFlowProvider,
	Node,
	Edge,
	Controls,
	Background,
	MiniMap,
	useNodesState,
	useEdgesState,
	ConnectionMode,
	NodeTypes,
	MarkerType,
	Handle,
	Position,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { Close, Visibility, ExpandMore, ExpandLess } from "@mui/icons-material";

import { ObjectDetailsDialog } from "../molecules/ObjectDetailsDialog";
import { ConnectionDetailsDialog } from "../molecules/ConnectionDetailsDialog";
import { jsonDataService } from "@react-client/api/hooks/jsonDataApi";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

export interface ModelObject {
	id: string;
	name: string;
	type: "model" | "vector" | "datamart" | "source";
	description: string;
	attributes: ObjectAttribute[];
	connections: ObjectConnection[];
}

export interface ObjectAttribute {
	id: string;
	name: string;
	type: string;
	description: string;
	isKey?: boolean;
}

export interface ObjectConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	processName: string;
	processId?: number | null;
	processCode?: string;
	description: string;
	mappings: AttributeMapping[];
	functions?: AttributeFunction[];
}

export interface AttributeMapping {
	id: string;
	sourceAttribute: string;
	sourceDescription: string;
	targetAttribute: string;
	targetDescription: string;
}

export interface AttributeFunction {
	id: string;
	attribute: string;
	function: string;
	description: string;
}

interface ModelGraphWindowProps {
	isOpen: boolean;
	onClose: () => void;
	model: any;
}

// Constants matching DataLinageGraph2
const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const MAX_VISIBLE_ATTRS = 3;

const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
};

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	model: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	vector: { bg: "#f3e5f5", border: "#7b1fa2", text: "#6a1b9a" },
	datamart: { bg: "#e8f5e9", border: "#388e3c", text: "#2e7d32" },
	source: { bg: "#fff3e0", border: "#f57c00", text: "#e65100" },
};

const getTypeLabel = (type: ModelObject["type"]) => {
	switch (type) {
		case "model":
			return "Модель";
		case "vector":
			return "Вектор";
		case "datamart":
			return "Витрина";
		case "source":
			return "Источник";
		default:
			return type;
	}
};

// Dagre layout function
const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction: "TB" | "LR" = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 120 });

	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		return {
			...node,
			position: {
				x: nodeWithPosition.x - NODE_WIDTH / 2,
				y: nodeWithPosition.y - NODE_HEIGHT / 2,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
};

// Кастомный компонент узла - matching DataLinageGraph2 style
interface CustomNodeData {
	id: string;
	name: string;
	type: ModelObject["type"];
	description: string;
	attributes: ObjectAttribute[];
	onView: () => void;
	onDoubleClick: () => void;
	onNodeClick: (id: string) => void;
	isExpanded?: boolean;
	canExpand?: boolean;
	onToggleExpand?: () => void;
	// New fields for highlighting
	highlightType: "none" | "selected" | "upstream" | "downstream";
	upstreamCount: number;
	downstreamCount: number;
}

const CustomNode = ({ data, id }: { data: CustomNodeData; id: string }) => {
	const colors = TYPE_COLORS[data.type] || TYPE_COLORS.model;
	const attrs = data.attributes || [];
	const visibleAttrs = attrs.slice(0, MAX_VISIBLE_ATTRS);
	const moreCount = attrs.length - MAX_VISIBLE_ATTRS;

	// Detect lineage role
	const isDataMart = data.upstreamCount > 0 && data.downstreamCount === 0;
	const isSource = data.upstreamCount === 0 && data.downstreamCount > 0;

	const borderColor =
		data.highlightType !== "none"
			? HIGHLIGHT_COLORS[data.highlightType as keyof typeof HIGHLIGHT_COLORS]
			: colors.border;

	const borderWidth = data.highlightType !== "none" ? 3 : 2;

	return (
		<div
			style={{
				background: "#fff",
				border: `${borderWidth}px solid ${borderColor}`,
				borderRadius: 8,
				width: NODE_WIDTH,
				boxShadow:
					data.highlightType !== "none"
						? `0 4px 20px ${borderColor}40`
						: "0 2px 8px rgba(0,0,0,0.1)",
				overflow: "hidden",
				cursor: "pointer",
				transition: "all 0.2s ease",
			}}
			onClick={() => data.onNodeClick(id)}
			onDoubleClick={data.onDoubleClick}
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
							{getTypeLabel(data.type)}
							{/* {isDataMart && (
								<span
									style={{
										marginLeft: 6,
										background: "#9c27b0",
										color: "#fff",
										padding: "1px 4px",
										borderRadius: 3,
										fontSize: 9,
									}}
									title="Витрина данных — конечная точка"
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
									title="Источник данных — начальная точка"
								>
									источник
								</span>
							)} */}
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
							title={data.name}
						>
							{data.name}
						</div>
					</div>
					<div style={{ display: "flex", gap: 2 }}>
						{data.canExpand && data.onToggleExpand && (
							<IconButton
								size="small"
								title={data.isExpanded ? "Свернуть связи" : "Развернуть связи"}
								onClick={(e) => {
									e.stopPropagation();
									data.onToggleExpand?.();
								}}
								sx={{
									padding: "2px",
									bgcolor: data.isExpanded ? "primary.main" : "transparent",
									color: data.isExpanded ? "white" : "inherit",
									"&:hover": {
										bgcolor: data.isExpanded ? "primary.dark" : "action.hover",
									},
								}}
							>
								{data.isExpanded ? (
									<ExpandLess fontSize="small" />
								) : (
									<ExpandMore fontSize="small" />
								)}
							</IconButton>
						)}
						<IconButton
							size="small"
							title="Просмотр деталей"
							onClick={(e) => {
								e.stopPropagation();
								data.onView();
							}}
							sx={{ padding: "2px" }}
						>
							<Visibility fontSize="small" />
						</IconButton>
					</div>
				</div>
				{/* Connection counts */}
				<div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10 }}>
					{data.upstreamCount > 0 && (
						<span style={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}>
							← {data.upstreamCount}
						</span>
					)}
					{data.downstreamCount > 0 && (
						<span
							style={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
						>
							→ {data.downstreamCount}
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
								padding: "4px 12px",
								fontSize: 11,
								borderBottom:
									idx < visibleAttrs.length - 1 ? "1px solid #f0f0f0" : "none",
								background: idx % 2 === 0 ? "#fafafa" : "#fff",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<span
								style={{
									color: "#555",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{attr.name}
							</span>
							<span
								style={{
									color: "#888",
									fontSize: 10,
									background: "#eee",
									padding: "1px 4px",
									borderRadius: 2,
								}}
							>
								{attr.type}
							</span>
						</div>
					))}
					{moreCount > 0 && (
						<div
							style={{
								padding: "4px 12px",
								fontSize: 10,
								color: "#888",
								textAlign: "center",
								background: "#f5f5f5",
							}}
						>
							+{moreCount} ещё
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
};

const nodeTypes: NodeTypes = {
	custom: CustomNode,
};

export const ModelGraphWindow = ({
	isOpen,
	onClose,
	model,
}: ModelGraphWindowProps) => {
	const [schema, setSchema] = useState<DataLineageSchema | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [selectedObject, setSelectedObject] = useState<ModelObject | null>(
		null,
	);
	const [selectedConnection, setSelectedConnection] =
		useState<ObjectConnection | null>(null);
	const [isObjectDetailsOpen, setIsObjectDetailsOpen] = useState(false);
	const [isConnectionDetailsOpen, setIsConnectionDetailsOpen] = useState(false);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
		new Set([model.id]),
	);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		const graphId: string | undefined =
			(model as JsonDataItem | any).graphId ?? model.graphId;
		if (!graphId) {
			setSchema(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);

		jsonDataService
			.getById(graphId)
			.then((item) => {
				if (cancelled) return;
				console.log("[ModelGraphWindow] Schema loaded:", {
					graphId,
					modelId: model.id,
					entities: item.data?.entities?.length,
					mappings: item.data?.mappings?.length,
				});
				setSchema(item.data as DataLineageSchema);
			})
			.catch((e) => {
				if (cancelled) return;
				setError(e instanceof Error ? e : new Error("Ошибка загрузки графа"));
				setSchema(null);
			})
			.finally(() => {
				if (cancelled) return;
				setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, model]);

	// Build full graph with all entities and connections
	const { allObjects, allConnections } = useMemo(() => {
		if (!schema) {
			return { allObjects: [], allConnections: [] };
		}

		const entitiesById = new Map<string, DataLineageEntity>();
		schema.entities.forEach((entity) => {
			entitiesById.set(entity.id, entity);
		});

		const toModelObjectType = (
			entity: DataLineageEntity,
		): ModelObject["type"] => {
			if (entity.id === model.id) return "model";
			if (entity.type === "view") return "datamart";
			return "source";
		};

		const makeAttributes = (entity: DataLineageEntity): ObjectAttribute[] => {
			return (entity.attrSeq ?? []).map((attr, index) => ({
				id: `${entity.id}__${attr.name ?? index}`,
				name: attr.name,
				type: attr.type,
				description: attr.comment ?? "",
				isKey: false,
			}));
		};

		// Deduplicate entities by ID - take the first occurrence
		const uniqueEntitiesMap = new Map<string, DataLineageEntity>();
		schema.entities.forEach((entity) => {
			if (!uniqueEntitiesMap.has(entity.id)) {
				uniqueEntitiesMap.set(entity.id, entity);
			}
		});

		const objects: ModelObject[] = [];
		uniqueEntitiesMap.forEach((entity) => {
			objects.push({
				id: entity.id,
				name: entity.name ?? entity.id,
				type: toModelObjectType(entity),
				description: "",
				attributes: makeAttributes(entity),
				connections: [],
			});
		});

		const connections: ObjectConnection[] = [];
		const mappings: DataLineageMapping[] = schema.mappings ?? [];

		mappings.forEach((mapping) => {
			if (!mapping.deps || mapping.deps.length === 0) return;
			if (!mapping.entityId) {
				console.warn(
					"[ModelGraphWindow] Skipping mapping - no entityId:",
					mapping,
				);
				return;
			}

			const targetEntity = entitiesById.get(mapping.entityId);
			if (!targetEntity) return;

			mapping.deps.forEach((dep, depIndex) => {
				if (!dep.entityId) {
					console.warn("[ModelGraphWindow] Skipping dep - no entityId:", dep);
					return;
				}

				const sourceEntity = entitiesById.get(dep.entityId);
				if (!sourceEntity) return;
				const attrMaps = dep.attrMaps ?? [];
				if (attrMaps.length === 0) return;
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

				const mappingsList: AttributeMapping[] = attrMaps.map((am, idx) => {
					const srcAttr = sourceEntity.attrSeq?.find((a) => a.name === am.src);
					const dstAttr = targetEntity.attrSeq?.find((a) => a.name === am.dst);
					return {
						id: `${mapping.id}__${depIndex}__${idx}`,
						sourceAttribute: am.src,
						sourceDescription: srcAttr?.comment ?? "",
						targetAttribute: am.dst,
						targetDescription: dstAttr?.comment ?? "",
					};
				});

				connections.push({
					id: `conn__${mapping.id}__${dep.entityId}__${mapping.entityId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name ?? sourceEntity.id,
					targetName: targetEntity.name ?? targetEntity.id,
					processName,
					processId: mapping.processId,
					processCode: mapping.system_code || dep.system_code,
					description:
						mapping.entityId === model.id
							? "Трансформация источника в модель"
							: dep.entityId === model.id
								? "Трансформация модели в витрину"
								: "Трансформация данных",
					mappings: mappingsList,
					functions: [],
				});
			});
		});

		console.log("[ModelGraphWindow] Full graph data:", {
			modelId: model.id,
			schemaEntities: schema.entities?.length,
			uniqueEntities: uniqueEntitiesMap.size,
			duplicatesRemoved: schema.entities.length - uniqueEntitiesMap.size,
			schemaMappings: schema.mappings?.length,
			objects: objects.length,
			connections: connections.length,
		});

		return { allObjects: objects, allConnections: connections };
	}, [schema, model.id]);

	// Filter objects and connections based on expanded nodes
	const { objects, connections } = useMemo(() => {
		if (allObjects.length === 0) {
			return { objects: [], connections: [] };
		}

		const visibleNodeIds = new Set<string>(expandedNodes);
		const visibleConnections: ObjectConnection[] = [];

		// Add all connections involving expanded nodes
		allConnections.forEach((conn) => {
			if (
				expandedNodes.has(conn.sourceId) ||
				expandedNodes.has(conn.targetId)
			) {
				visibleConnections.push(conn);
				visibleNodeIds.add(conn.sourceId);
				visibleNodeIds.add(conn.targetId);
			}
		});

		const visibleObjects = allObjects.filter((obj) =>
			visibleNodeIds.has(obj.id),
		);

		console.log("[ModelGraphWindow] Visible graph:", {
			expandedNodes: Array.from(expandedNodes),
			visibleNodeIds: Array.from(visibleNodeIds),
			allObjectIds: allObjects.map((o) => o.id),
			visibleObjectIds: visibleObjects.map((o) => o.id),
			visibleObjects: visibleObjects.length,
			visibleConnections: visibleConnections.length,
			connectionDetails: visibleConnections.map((c) => ({
				id: c.id,
				source: c.sourceId,
				target: c.targetId,
			})),
		});

		return { objects: visibleObjects, connections: visibleConnections };
	}, [allObjects, allConnections, expandedNodes]);

	// Calculate upstream/downstream counts for highlighting
	const { upstreamMap, downstreamMap } = useMemo(() => {
		const upstream = new Map<string, Set<string>>();
		const downstream = new Map<string, Set<string>>();

		allConnections.forEach((conn) => {
			if (!upstream.has(conn.targetId)) {
				upstream.set(conn.targetId, new Set());
			}
			upstream.get(conn.targetId)!.add(conn.sourceId);

			if (!downstream.has(conn.sourceId)) {
				downstream.set(conn.sourceId, new Set());
			}
			downstream.get(conn.sourceId)!.add(conn.targetId);
		});

		return { upstreamMap: upstream, downstreamMap: downstream };
	}, [allConnections]);

	// Get connected entities recursively for highlighting
	const getConnectedEntities = useCallback(
		(entityId: string, direction: "upstream" | "downstream") => {
			const result = new Set<string>();
			const map = direction === "upstream" ? upstreamMap : downstreamMap;
			const queue = [entityId];

			while (queue.length > 0) {
				const current = queue.shift()!;
				const connected = map.get(current);
				if (connected) {
					connected.forEach((id) => {
						if (!result.has(id)) {
							result.add(id);
							queue.push(id);
						}
					});
				}
			}
			return result;
		},
		[upstreamMap, downstreamMap],
	);

	// Handle node click for highlighting
	const handleNodeClick = useCallback((nodeId: string) => {
		setSelectedNodeId((prev: string | null) =>
			prev === nodeId ? null : nodeId,
		);
	}, []);

	const toggleNodeExpansion = useCallback(
		(nodeId: string) => {
			setExpandedNodes((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(nodeId)) {
					// When collapsing, only remove the node if it's not the main model
					if (nodeId !== model.id) {
						newSet.delete(nodeId);
					}
				} else {
					newSet.add(nodeId);
				}
				return newSet;
			});
		},
		[model.id],
	);

	const initialNodes: Node[] = useMemo(() => {
		// Calculate highlighted sets
		const upstreamSet = selectedNodeId
			? getConnectedEntities(selectedNodeId, "upstream")
			: new Set<string>();
		const downstreamSet = selectedNodeId
			? getConnectedEntities(selectedNodeId, "downstream")
			: new Set<string>();

		const nodes = objects.map((obj) => {
			const hasConnections = allConnections.some(
				(conn) => conn.sourceId === obj.id || conn.targetId === obj.id,
			);
			const isExpanded = expandedNodes.has(obj.id);

			// Determine highlight type
			let highlightType: "none" | "selected" | "upstream" | "downstream" =
				"none";
			if (selectedNodeId === obj.id) {
				highlightType = "selected";
			} else if (upstreamSet.has(obj.id)) {
				highlightType = "upstream";
			} else if (downstreamSet.has(obj.id)) {
				highlightType = "downstream";
			}

			return {
				id: obj.id,
				type: "custom",
				position: { x: 0, y: 0 }, // Will be set by Dagre
				data: {
					...obj,
					isExpanded,
					canExpand: hasConnections,
					onToggleExpand: () => toggleNodeExpansion(obj.id),
					onNodeClick: handleNodeClick,
					onDoubleClick: () => {
						setSelectedObject(obj);
						setIsObjectDetailsOpen(true);
					},
					onView: () => {
						setSelectedObject(obj);
						setIsObjectDetailsOpen(true);
					},
					// New fields for DataLinageGraph2 style
					highlightType,
					upstreamCount: upstreamMap.get(obj.id)?.size ?? 0,
					downstreamCount: downstreamMap.get(obj.id)?.size ?? 0,
				},
			};
		});

		return nodes;
	}, [
		objects,
		allConnections,
		expandedNodes,
		toggleNodeExpansion,
		selectedNodeId,
		getConnectedEntities,
		handleNodeClick,
		upstreamMap,
		downstreamMap,
	]);

	const initialEdges: Edge[] = useMemo(() => {
		const nodeIdSet = new Set(objects.map((obj) => obj.id));

		// Filter connections to only include those where both source and target nodes exist
		const validConnections = connections.filter((conn) => {
			// Check if sourceId and targetId are valid strings
			if (
				!conn.sourceId ||
				!conn.targetId ||
				typeof conn.sourceId !== "string" ||
				typeof conn.targetId !== "string"
			) {
				console.warn("[ModelGraphWindow] Skipping edge - invalid IDs:", {
					edgeId: conn.id,
					sourceId: conn.sourceId,
					sourceIdType: typeof conn.sourceId,
					targetId: conn.targetId,
					targetIdType: typeof conn.targetId,
				});
				return false;
			}

			const sourceExists = nodeIdSet.has(conn.sourceId);
			const targetExists = nodeIdSet.has(conn.targetId);

			if (!sourceExists || !targetExists) {
				console.warn("[ModelGraphWindow] Skipping edge - missing node:", {
					edgeId: conn.id,
					sourceId: conn.sourceId,
					sourceExists,
					targetId: conn.targetId,
					targetExists,
					availableNodeIds: Array.from(nodeIdSet).slice(0, 10), // Show first 10 for debugging
				});
				return false;
			}
			return true;
		});

		const edges = validConnections.map((conn) => ({
			id: conn.id,
			source: conn.sourceId,
			target: conn.targetId,
			type: "default",
			style: { strokeWidth: 2, stroke: "#666" },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: "#666",
			},
			label: conn.description,
			animated: false,
		}));

		console.log("[ModelGraphWindow] Edges created:", {
			totalConnections: connections.length,
			validConnections: validConnections.length,
			edgesCount: edges.length,
			nodeCount: nodeIdSet.size,
			sampleEdge: edges[0],
			edges: edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		});

		// Debug: Log if edges are empty
		if (edges.length === 0) {
			console.error(
				"[ModelGraphWindow] No valid edges created! Check node IDs.",
			);
		}

		return edges;
	}, [connections, objects]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

	// Apply Dagre layout and update nodes/edges
	useEffect(() => {
		if (initialNodes.length === 0) {
			setNodes([]);
			setEdges([]);
			return;
		}

		// Apply Dagre layout
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			initialNodes,
			initialEdges,
			"LR",
		);

		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
	}, [initialNodes, initialEdges, setNodes, setEdges]);

	// Fit view after nodes and edges are set
	useEffect(() => {
		if (reactFlowInstance && nodes.length > 0) {
			setTimeout(() => {
				reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
			}, 100);
		}
	}, [reactFlowInstance, nodes, edges]);

	// Debug: log current state
	useEffect(() => {
		console.log("[ModelGraphWindow] Current state:", {
			nodesCount: nodes.length,
			edgesCount: edges.length,
			nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
			edges: edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		});
	}, [nodes, edges]);

	const onEdgeDoubleClick = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			const connection = connections.find((conn) => conn.id === edge.id);
			if (connection) {
				setSelectedConnection(connection);
				setIsConnectionDetailsOpen(true);
			}
		},
		[connections],
	);

	const handleCloseObjectDetails = () => {
		setIsObjectDetailsOpen(false);
		setSelectedObject(null);
	};

	const handleCloseConnectionDetails = () => {
		setIsConnectionDetailsOpen(false);
		setSelectedConnection(null);
	};

	const { mode } = useColorScheme();

	return (
		<>
			<Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth>
				<DialogTitle>
					<Box display="flex" alignItems="center" gap={2}>
						<Typography variant="h6">Граф объектов: {model.name}</Typography>
						<Chip
							label={model.type === "view" ? "Витрина" : "Модель"}
							color={model.type === "view" ? "success" : "primary"}
							size="small"
						/>
						{model.status && (
							<Chip
								label={
									model.status === "active"
										? "Активная"
										: model.status === "draft"
											? "Черновик"
											: "Архивная"
								}
								color={
									model.status === "active"
										? "success"
										: model.status === "draft"
											? "warning"
											: "error"
								}
								size="small"
							/>
						)}
					</Box>
				</DialogTitle>
				<DialogContent>
					{/* Метаданные модели */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Метаданные модели
						</Typography>
						<Divider sx={{ mb: 2 }} />
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
								gap: 2,
							}}
						>
							<Box>
								<Typography variant="caption" color="text.secondary">
									ID
								</Typography>
								<Typography variant="body2" fontFamily="monospace">
									{model.id}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Пространство имен
								</Typography>
								<Typography variant="body2">
									{model.namespace || "—"}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Автор
								</Typography>
								<Typography variant="body2">{model.author || "—"}</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Версия
								</Typography>
								<Typography variant="body2">{model.version || "—"}</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Количество атрибутов
								</Typography>
								<Typography variant="body2">
									{model.objectsCount || 0}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Дата создания
								</Typography>
								<Typography variant="body2">
									{model.createdDate
										? new Date(model.createdDate).toLocaleDateString()
										: "—"}
								</Typography>
							</Box>
						</Box>
						{model.description && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="caption" color="text.secondary">
									Описание
								</Typography>
								<Typography variant="body2">{model.description}</Typography>
							</Box>
						)}
					</Paper>

					{/* Граф связей */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Граф связей
						</Typography>
						<Divider sx={{ mb: 2 }} />
						{schema && (
							<Box
								sx={{ mb: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}
							>
								<Typography variant="caption" color="text.secondary">
									Отладка: Сущностей в схеме: {schema.entities?.length || 0} |
									Объектов для отображения: {objects.length} | Связей:{" "}
									{connections.length} | Model ID: {model.id}
								</Typography>
							</Box>
						)}
						{objects.length === 0 && !isLoading && !error && schema && (
							<Alert severity="info" sx={{ mb: 2 }}>
								Для данной модели нет связей с другими объектами. Всего
								сущностей в схеме: {schema.entities?.length || 0}
							</Alert>
						)}
						{!schema && !isLoading && !error && (
							<Alert severity="warning" sx={{ mb: 2 }}>
								Не удалось загрузить схему данных для модели. GraphId:{" "}
								{model.graphId || "отсутствует"}
							</Alert>
						)}
					</Paper>

					<Box
						sx={{
							height: "600px",
							width: "100%",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 1,
						}}
					>
						{isLoading ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									height: "100%",
								}}
							>
								<CircularProgress />
							</Box>
						) : error ? (
							<Box
								sx={{
									p: 2,
									height: "100%",
									boxSizing: "border-box",
								}}
							>
								<Alert severity="error">
									Ошибка загрузки графа модели: {error.message}
								</Alert>
							</Box>
						) : (
							<>
								{console.log("[ModelGraphWindow] Rendering ReactFlow:", {
									nodesCount: nodes.length,
									edgesCount: edges.length,
									nodeIds: nodes.map((n) => n.id),
									edges: edges.map((e) => ({
										id: e.id,
										source: e.source,
										sourceType: typeof e.source,
										target: e.target,
										targetType: typeof e.target,
										type: e.type,
									})),
									firstEdge: edges[0],
								})}
								<ReactFlowProvider>
									<ReactFlow
										nodes={nodes}
										edges={edges}
										onNodesChange={onNodesChange}
										onEdgesChange={onEdgesChange}
										onEdgeDoubleClick={onEdgeDoubleClick}
										onInit={setReactFlowInstance}
										nodeTypes={nodeTypes}
										connectionMode={ConnectionMode.Loose}
										minZoom={0.01}
										maxZoom={1}
										defaultEdgeOptions={{
											type: "default",
											animated: false,
										}}
										proOptions={{ hideAttribution: true }}
										colorMode={mode}
										onlyRenderVisibleElements
									>
										<Controls />
										<Background />
										<MiniMap
											nodeColor={(node: Node) => {
												const data = node.data as unknown as CustomNodeData;
												const colors =
													TYPE_COLORS[data?.type] || TYPE_COLORS.model;
												return colors.border;
											}}
											nodeStrokeWidth={3}
											zoomable
											pannable
										/>
									</ReactFlow>
								</ReactFlowProvider>
							</>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" onClick={onClose} startIcon={<Close />}>
						Закрыть
					</Button>
				</DialogActions>
			</Dialog>

			{/* Диалог деталей объекта */}
			{selectedObject && (
				<ObjectDetailsDialog
					open={isObjectDetailsOpen}
					onClose={handleCloseObjectDetails}
					object={selectedObject}
					connections={allConnections.filter(
						(conn) =>
							conn.sourceId === selectedObject.id ||
							conn.targetId === selectedObject.id,
					)}
					onExpandNode={toggleNodeExpansion}
				/>
			)}

			{/* Диалог деталей связи */}
			{selectedConnection && (
				<ConnectionDetailsDialog
					open={isConnectionDetailsOpen}
					onClose={handleCloseConnectionDetails}
					connection={selectedConnection}
				/>
			)}
		</>
	);
};
