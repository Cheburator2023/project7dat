import { useEffect, useCallback, useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Stack,
	Chip,
	Alert,
	Paper,
} from "@mui/material";
import {
	ReactFlow,
	ReactFlowProvider,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	type Node,
	type Edge,
	type NodeTypes,
	type NodeProps,
	Handle,
	Position,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import type {
	DataLineageSchema,
	DataLineageEntity,
} from "@react-client/types/dataLineage";

interface DataLineageGraphProps {
	data: DataLineageSchema;
	onNodeSelect?: (entity: DataLineageEntity) => void;
}

interface NodeData extends Record<string, unknown> {
	entity: DataLineageEntity;
	label: string;
	isHighlighted: boolean;
	highlightType: "none" | "selected" | "upstream" | "downstream";
	upstreamCount: number;
	downstreamCount: number;
	onNodeClick: (id: string) => void;
}

// Constants
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
};

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	table: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	view: { bg: "#f3e5f5", border: "#7b1fa2", text: "#6a1b9a" },
	rdd: { bg: "#fff3e0", border: "#f57c00", text: "#e65100" },
	unresolved: { bg: "#fce4ec", border: "#c2185b", text: "#ad1457" },
};

const getEntityColor = (type: string): string => {
	return TYPE_COLORS[type]?.border || "#6B7280";
};

// Dagre layout
const getLayoutedElements = (
	nodes: Node<NodeData>[],
	edges: Edge[],
	direction: "TB" | "LR" = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

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

// Custom node component for data lineage entities
const DataLineageEntityNode = ({ id, data }: NodeProps) => {
	const nodeData = data as NodeData;
	const { entity, highlightType, onNodeClick, upstreamCount, downstreamCount } =
		nodeData;
	const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;

	// Detect lineage role
	const isDataMart = upstreamCount > 0 && downstreamCount === 0;
	const isSource = upstreamCount === 0 && downstreamCount > 0;

	const borderColor =
		highlightType !== "none"
			? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
			: colors.border;

	const borderWidth = highlightType !== "none" ? 3 : 2;

	return (
		<Paper
			elevation={highlightType !== "none" ? 8 : 2}
			onClick={() => onNodeClick(id)}
			sx={{
				width: NODE_WIDTH,
				minHeight: NODE_HEIGHT,
				border: `${borderWidth}px solid ${borderColor}`,
				borderRadius: 2,
				backgroundColor: colors.bg,
				transition: "all 0.2s ease",
				boxShadow:
					highlightType !== "none" ? `0 4px 20px ${borderColor}40` : undefined,
				"&:hover": {
					transform: "scale(1.02)",
				},
				cursor: "pointer",
				overflow: "hidden",
			}}
		>
			{/* Input handle */}
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

			<Box sx={{ p: 1.5 }}>
				{/* Header with type and badges */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						mb: 0.5,
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: colors.text,
							textTransform: "uppercase",
							fontWeight: 600,
							fontSize: "0.65rem",
						}}
					>
						{entity.type}
					</Typography>
					{entity.modified && (
						<Chip
							label="изм."
							size="small"
							sx={{
								height: 16,
								fontSize: "0.6rem",
								background: "#ff9800",
								color: "#fff",
							}}
						/>
					)}
					{isDataMart && (
						<Chip
							label="витрина"
							size="small"
							sx={{
								height: 16,
								fontSize: "0.6rem",
								background: "#9c27b0",
								color: "#fff",
							}}
						/>
					)}
					{isSource && (
						<Chip
							label="источник"
							size="small"
							sx={{
								height: 16,
								fontSize: "0.6rem",
								background: "#00897b",
								color: "#fff",
							}}
						/>
					)}
				</Box>

				{/* Name */}
				<Typography
					variant="body2"
					sx={{
						fontWeight: 600,
						lineHeight: 1.2,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
					title={entity.name || entity.id}
				>
					{entity.name || entity.id}
				</Typography>

				{/* Namespace */}
				{entity.namespace && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							display: "block",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							fontSize: "0.7rem",
						}}
						title={entity.namespace}
					>
						{entity.namespace}
					</Typography>
				)}

				{/* Connection counts */}
				<Box sx={{ display: "flex", gap: 1, mt: 0.5, fontSize: "0.7rem" }}>
					{upstreamCount > 0 && (
						<Typography
							variant="caption"
							sx={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}
						>
							← {upstreamCount}
						</Typography>
					)}
					{downstreamCount > 0 && (
						<Typography
							variant="caption"
							sx={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
						>
							→ {downstreamCount}
						</Typography>
					)}
					<Typography variant="caption" sx={{ color: "#888", ml: "auto" }}>
						{entity.attrSeq?.length ?? 0} атр.
					</Typography>
				</Box>
			</Box>

			{/* Output handle */}
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
		</Paper>
	);
};

const nodeTypes: NodeTypes = {
	dataLineageEntity: DataLineageEntityNode,
};

const DataLineageGraphContent = ({
	data,
	onNodeSelect,
}: DataLineageGraphProps) => {
	const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	// Calculate upstream/downstream counts
	const { upstreamMap, downstreamMap } = useMemo(() => {
		const upstream = new Map<string, Set<string>>();
		const downstream = new Map<string, Set<string>>();

		data?.mappings?.forEach((mapping) => {
			mapping.deps?.forEach((dep) => {
				// dep.entityId is upstream of mapping.entityId
				if (!upstream.has(mapping.entityId)) {
					upstream.set(mapping.entityId, new Set());
				}
				upstream.get(mapping.entityId)!.add(dep.entityId);

				// mapping.entityId is downstream of dep.entityId
				if (!downstream.has(dep.entityId)) {
					downstream.set(dep.entityId, new Set());
				}
				downstream.get(dep.entityId)!.add(mapping.entityId);
			});
		});

		return { upstreamMap: upstream, downstreamMap: downstream };
	}, [data?.mappings]);

	// Get all upstream/downstream entities recursively
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

	// Handle node click
	const handleNodeClick = useCallback(
		(nodeId: string) => {
			setSelectedNodeId((prev: string | null) =>
				prev === nodeId ? null : nodeId,
			);
			const entity = data?.entities?.find((e) => e.id === nodeId);
			if (entity && onNodeSelect) {
				onNodeSelect(entity);
			}
		},
		[data?.entities, onNodeSelect],
	);

	// Create edges from mappings
	const createEdges = useCallback(
		(
			mappings: DataLineageSchema["mappings"],
			entities: DataLineageEntity[],
		) => {
			const newEdges: Edge[] = [];

			if (mappings && mappings.length > 0) {
				// Use mappings from schema
				mappings.forEach((mapping) => {
					if (mapping.deps) {
						mapping.deps.forEach((dep, depIndex) => {
							newEdges.push({
								id: `edge-${mapping.id}-${depIndex}`,
								source: dep.entityId,
								target: mapping.entityId,
								type: "smoothstep",
								animated: true,
								style: {
									stroke: "#666",
									strokeWidth: 2,
								},
								markerEnd: {
									type: "arrowclosed",
									color: "#666",
								},
							});
						});
					}
				});
			} else {
				// Create edges based on logic: models connected to sources and datamarts
				const models = entities.filter(
					(e) => e.type.toLowerCase() === "table" && e.modified,
				);
				const sources = entities.filter((e) => !e.modified);
				const datamarts = entities.filter(
					(e) => e.type.toLowerCase() === "view" && e.modified,
				);

				models.forEach((model) => {
					const modelName = model.name || "";

					// Connect models with sources
					sources.forEach((source) => {
						const sourceName = source.name || "";
						if (
							modelName.toLowerCase().includes(sourceName.toLowerCase()) ||
							sourceName.toLowerCase().includes(modelName.toLowerCase())
						) {
							newEdges.push({
								id: `edge-${source.id}-${model.id}`,
								source: source.id,
								target: model.id,
								type: "smoothstep",
								animated: true,
								style: {
									stroke: "#666",
									strokeWidth: 2,
								},
								markerEnd: {
									type: "arrowclosed",
									color: "#666",
								},
							});
						}
					});

					// Connect models with datamarts
					datamarts.forEach((datamart) => {
						const datamartName = datamart.name || "";
						if (
							modelName.toLowerCase().includes(datamartName.toLowerCase()) ||
							datamartName.toLowerCase().includes(modelName.toLowerCase())
						) {
							newEdges.push({
								id: `edge-${model.id}-${datamart.id}`,
								source: model.id,
								target: datamart.id,
								type: "smoothstep",
								animated: true,
								style: {
									stroke: "#666",
									strokeWidth: 2,
								},
								markerEnd: {
									type: "arrowclosed",
									color: "#666",
								},
							});
						}
					});
				});
			}

			return newEdges;
		},
		[],
	);

	// Build nodes with highlighting
	useEffect(() => {
		if (!data?.entities || data.entities.length === 0) {
			setNodes([]);
			setEdges([]);
			return;
		}

		// Calculate highlighted sets
		const upstreamSet = selectedNodeId
			? getConnectedEntities(selectedNodeId, "upstream")
			: new Set<string>();
		const downstreamSet = selectedNodeId
			? getConnectedEntities(selectedNodeId, "downstream")
			: new Set<string>();

		// Create nodes with proper NodeData
		const newNodes: Node<NodeData>[] = data.entities.map((entity) => {
			let highlightType: NodeData["highlightType"] = "none";
			if (selectedNodeId === entity.id) {
				highlightType = "selected";
			} else if (upstreamSet.has(entity.id)) {
				highlightType = "upstream";
			} else if (downstreamSet.has(entity.id)) {
				highlightType = "downstream";
			}

			return {
				id: entity.id,
				type: "dataLineageEntity",
				position: { x: 0, y: 0 }, // Will be set by Dagre
				data: {
					entity,
					label: entity.name || entity.id,
					isHighlighted: highlightType !== "none",
					highlightType,
					upstreamCount: upstreamMap.get(entity.id)?.size ?? 0,
					downstreamCount: downstreamMap.get(entity.id)?.size ?? 0,
					onNodeClick: handleNodeClick,
				},
			};
		});

		const newEdges = createEdges(data.mappings, data.entities);

		// Apply Dagre layout
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			newNodes,
			newEdges,
			"LR",
		);

		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
	}, [
		data,
		selectedNodeId,
		upstreamMap,
		downstreamMap,
		getConnectedEntities,
		handleNodeClick,
		createEdges,
		setNodes,
		setEdges,
	]);

	return (
		<Box sx={{ height: "600px", width: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				fitView
				fitViewOptions={{
					padding: 0.2,
					includeHiddenNodes: false,
				}}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
				minZoom={0.1}
				maxZoom={2}
				attributionPosition="bottom-left"
			>
				<Background />
				<Controls />
				<MiniMap
					nodeColor={(node) => {
						const entity = (node.data as NodeData)?.entity;
						return entity ? getEntityColor(entity.type) : "#6B7280";
					}}
					nodeStrokeWidth={3}
					zoomable
					pannable
				/>
			</ReactFlow>
		</Box>
	);
};

export const DataLineageGraph = ({
	data,
	onNodeSelect,
}: DataLineageGraphProps) => {
	if (!data?.entities || data.entities.length === 0) {
		return <Alert severity="info">Нет данных для отображения графа</Alert>;
	}

	// Group types for legend
	const entityTypes = Array.from(
		new Set(data.entities.map((e) => e.type.toLowerCase())),
	);

	return (
		<Box>
			<Stack spacing={2}>
				{/* Graph information */}
				<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
					<Typography variant="body2" color="text.secondary">
						Объектов: {data.entities.length}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Связей:{" "}
						{data.mappings?.reduce(
							(acc, mapping) => acc + (mapping.deps?.length || 0),
							0,
						) || 0}
					</Typography>
				</Stack>

				{/* Legend */}
				<Card variant="outlined">
					<CardContent sx={{ py: 1 }}>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							flexWrap="wrap"
						>
							<Typography variant="body2" fontWeight="medium" sx={{ mr: 1 }}>
								Типы объектов:
							</Typography>
							{entityTypes.map((type) => (
								<Chip
									key={type}
									label={type}
									size="small"
									sx={{
										backgroundColor: getEntityColor(type),
										color: "white",
									}}
								/>
							))}
						</Stack>
					</CardContent>
				</Card>

				{/* Graph */}
				<Card variant="outlined">
					<CardContent sx={{ p: 0 }}>
						<ReactFlowProvider>
							<DataLineageGraphContent
								data={data}
								onNodeSelect={onNodeSelect}
							/>
						</ReactFlowProvider>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
};
