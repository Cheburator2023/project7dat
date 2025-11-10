import { useEffect, useCallback, useMemo } from "react";
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
import "@xyflow/react/dist/style.css";
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
}

const getEntityColor = (type: string): string => {
	const colors: Record<string, string> = {
		table: "#3B82F6", // blue
		model: "#10B981", // green
		source: "#F59E0B", // amber
		datamart: "#8B5CF6", // purple
		dataset: "#06B6D4", // cyan
		pipeline: "#F97316", // orange
		view: "#8B5CF6", // purple
	};
	return colors[type.toLowerCase()] || "#6B7280"; // gray as default
};

// Custom node component for data lineage entities
const DataLineageEntityNode = ({ id, data, selected }: NodeProps) => {
	const entity = data.entity as DataLineageEntity;
	const nodeColor = getEntityColor(entity.type);

	return (
		<Paper
			elevation={selected ? 8 : 2}
			sx={{
				width: "100%",
				height: "100%",
				minHeight: 80,
				border: `2px solid ${nodeColor}`,
				borderRadius: 2,
				backgroundColor: selected ? `${nodeColor}20` : "white",
				transition: "all 0.2s ease",
				"&:hover": {
					elevation: 4,
					backgroundColor: `${nodeColor}10`,
					transform: "scale(1.02)",
				},
				cursor: "pointer",
			}}
		>
			{/* Input handle */}
			<Handle
				type="target"
				position={Position.Left}
				style={{
					background: nodeColor,
					width: 8,
					height: 8,
				}}
			/>

			<Box sx={{ p: 1.5 }}>
				<Chip
					label={entity.type}
					size="small"
					sx={{
						backgroundColor: nodeColor,
						color: "white",
						fontSize: "0.7rem",
						height: "20px",
						mb: 1,
					}}
				/>
				<Typography
					variant="body2"
					sx={{
						fontWeight: "medium",
						lineHeight: 1.2,
						overflow: "hidden",
						textOverflow: "ellipsis",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
					}}
				>
					{entity.name || "Unnamed Entity"}
				</Typography>
				{entity.description && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							display: "block",
							mt: 0.5,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{entity.description}
					</Typography>
				)}
			</Box>

			{/* Output handle */}
			<Handle
				type="source"
				position={Position.Right}
				style={{
					background: nodeColor,
					width: 8,
					height: 8,
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

	// Calculate layout positions
	const calculateLayout = useCallback((entities: DataLineageEntity[]) => {
		// Group entities by type for better layout
		const entityGroups: Record<string, DataLineageEntity[]> = {};
		entities.forEach((entity) => {
			const type = entity.type.toLowerCase();
			if (!entityGroups[type]) {
				entityGroups[type] = [];
			}
			entityGroups[type].push(entity);
		});

		const newNodes: Node<NodeData>[] = [];
		const typeKeys = Object.keys(entityGroups);
		const nodeWidth = 200;
		const nodeHeight = 120;
		const horizontalSpacing = 300;
		const verticalSpacing = 150;

		// Arrange types in columns
		typeKeys.forEach((type, typeIndex) => {
			const entities = entityGroups[type];
			const x = typeIndex * horizontalSpacing;

			entities.forEach((entity, entityIndex) => {
				const y = entityIndex * verticalSpacing;

				newNodes.push({
					id: entity.id,
					type: "dataLineageEntity",
					position: { x, y },
					data: {
						entity,
						label: entity.name || "Unnamed Entity",
					},
					style: {
						width: nodeWidth,
						height: nodeHeight,
					},
				});
			});
		});

		return newNodes;
	}, []);

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

	// Update nodes and edges when data changes
	useEffect(() => {
		if (!data?.entities || data.entities.length === 0) {
			setNodes([]);
			setEdges([]);
			return;
		}

		const newNodes = calculateLayout(data.entities);
		const newEdges = createEdges(data.mappings, data.entities);

		setNodes(newNodes);
		setEdges(newEdges);
	}, [data, calculateLayout, createEdges, setNodes, setEdges]);

	// Handle node click
	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			const nodeData = node.data as NodeData;
			if (nodeData?.entity && onNodeSelect) {
				onNodeSelect(nodeData.entity);
			}
		},
		[onNodeSelect],
	);

	// Group types for legend
	const _entityTypes = useMemo(() => {
		if (!data?.entities) return [];
		return Array.from(new Set(data.entities.map((e) => e.type.toLowerCase())));
	}, [data?.entities]);

	return (
		<Box sx={{ height: "600px", width: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeClick={onNodeClick}
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
