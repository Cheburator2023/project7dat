import React, { useCallback, useMemo, memo } from "react";
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
	useNodesState,
	useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { styled, Box, Typography, Chip, useColorScheme } from "@mui/material";
import type { ObjectItem, AttributeConnection } from "../types";

// ============================================================================
// Types
// ============================================================================

interface ObjectNodeData {
	object: ObjectItem;
	isSelected: boolean;
	highlightType: "none" | "selected" | "related";
	onNodeClick: (id: string) => void;
	[key: string]: unknown;
}

type ObjectNode = Node<ObjectNodeData, "objectNode">;

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	Источник: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1" },
	Витрина: { bg: "#fff3e0", border: "#ef6c00", text: "#e65100" },
	Признак: { bg: "#e8f5e9", border: "#388e3c", text: "#1b5e20" },
};

const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	related: "#9c27b0",
};

// ============================================================================
// Dagre Layout
// ============================================================================

const getLayoutedElements = (
	nodes: ObjectNode[],
	edges: Edge[],
	direction: "TB" | "LR" = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const isHorizontal = direction === "LR";
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
			targetPosition: isHorizontal ? Position.Left : Position.Top,
			sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
		};
	});

	return { nodes: layoutedNodes, edges };
};

// ============================================================================
// Custom Node Component
// ============================================================================

const ObjectNodeComponent = memo(({ data, id }: NodeProps<ObjectNode>) => {
	const { object, highlightType, onNodeClick } = data;
	const colors = TYPE_COLORS[object.objectType] || TYPE_COLORS.Источник;

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
				minHeight: NODE_HEIGHT,
				boxShadow:
					highlightType !== "none"
						? `0 4px 16px ${borderColor}40`
						: "0 2px 6px rgba(0,0,0,0.1)",
				overflow: "hidden",
				cursor: "pointer",
				transition: "all 0.2s ease",
			}}
			onClick={() => onNodeClick(id)}
		>
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: colors.border }}
			/>

			{/* Header */}
			<div
				style={{
					background: colors.bg,
					padding: "8px 12px",
					borderBottom: `1px solid ${colors.border}20`,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 8,
					}}
				>
					<span
						style={{
							fontSize: 12,
							fontWeight: 600,
							color: colors.text,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							flex: 1,
						}}
						title={object.object}
					>
						{object.object}
					</span>
					<span
						style={{
							fontSize: 9,
							padding: "2px 6px",
							borderRadius: 4,
							background: colors.border,
							color: "#fff",
							fontWeight: 500,
							flexShrink: 0,
						}}
					>
						{object.objectType}
					</span>
				</div>
			</div>

			{/* Body */}
			<div style={{ padding: "6px 12px" }}>
				<div
					style={{
						fontSize: 10,
						color: "#666",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
					title={object.database}
				>
					{object.database}
				</div>
			</div>

			<Handle
				type="source"
				position={Position.Right}
				style={{ background: colors.border }}
			/>
		</div>
	);
});

ObjectNodeComponent.displayName = "ObjectNodeComponent";

const nodeTypes = {
	objectNode: ObjectNodeComponent,
};

// ============================================================================
// Graph Flow Component
// ============================================================================

interface ObjectGraphFlowProps {
	currentObject: ObjectItem;
	relatedObjects: ObjectItem[];
	allObjects: ObjectItem[];
	attributeConnections: AttributeConnection[];
}

const ObjectGraphFlow: React.FC<ObjectGraphFlowProps> = ({
	currentObject,
	relatedObjects,
	allObjects,
	attributeConnections,
}) => {
	const navigate = useNavigate();

	const handleNodeClick = useCallback(
		(objectId: string) => {
			navigate(`/objects/${encodeURIComponent(objectId)}`);
		},
		[navigate],
	);

	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: ObjectNode[] = [];
		const edges: Edge[] = [];
		const addedNodeIds = new Set<string>();

		// Helper to add a node if not already added
		const addNode = (
			obj: ObjectItem,
			highlightType: "selected" | "related" | "none",
		) => {
			if (addedNodeIds.has(obj.id)) return;
			addedNodeIds.add(obj.id);
			nodes.push({
				id: obj.id,
				type: "objectNode",
				position: { x: 0, y: 0 },
				data: {
					object: obj,
					isSelected: highlightType === "selected",
					highlightType,
					onNodeClick: handleNodeClick,
				},
			});
		};

		// Add current object as main node
		addNode(currentObject, "selected");

		// Add related objects (same entity attributes or parent)
		relatedObjects.forEach((obj) => {
			addNode(obj, "related");

			// Create edge based on object type relationship
			if (currentObject.objectType === "Признак") {
				edges.push({
					id: `contains-${obj.id}-${currentObject.id}`,
					source: obj.id,
					target: currentObject.id,
					type: "smoothstep",
					animated: true,
					style: { stroke: "#9c27b0", strokeWidth: 2 },
					markerEnd: {
						type: MarkerType.ArrowClosed,
						color: "#9c27b0",
					},
					label: "содержит",
					labelStyle: { fontSize: 10, fill: "#666" },
					labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
				});
			} else {
				edges.push({
					id: `contains-${currentObject.id}-${obj.id}`,
					source: currentObject.id,
					target: obj.id,
					type: "smoothstep",
					animated: true,
					style: { stroke: "#9c27b0", strokeWidth: 2 },
					markerEnd: {
						type: MarkerType.ArrowClosed,
						color: "#9c27b0",
					},
					label: "содержит",
					labelStyle: { fontSize: 10, fill: "#666" },
					labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
				});
			}
		});

		// Get the current entity ID for attribute connections
		const currentEntityId =
			currentObject.objectType === "Признак"
				? `${currentObject.graphId}::${currentObject.modelId}`
				: currentObject.id;

		// Add connected entities from attribute mappings
		attributeConnections.forEach((conn) => {
			// Find the other entity in this connection
			const isSource = conn.sourceEntityId === currentEntityId;
			const otherEntityId = isSource
				? conn.targetEntityId
				: conn.sourceEntityId;

			// Find the entity object
			const otherEntity = allObjects.find(
				(obj) => obj.id === otherEntityId && obj.objectType !== "Признак",
			);

			if (otherEntity) {
				addNode(otherEntity, "none");

				// Find attribute objects for source and target
				const sourceAttrId = `${conn.sourceEntityId}::${conn.sourceAttr}`;
				const targetAttrId = `${conn.targetEntityId}::${conn.targetAttr}`;

				const sourceAttr = allObjects.find((obj) => obj.id === sourceAttrId);
				const targetAttr = allObjects.find((obj) => obj.id === targetAttrId);

				// Add attribute nodes if found
				if (sourceAttr) addNode(sourceAttr, "none");
				if (targetAttr) addNode(targetAttr, "none");

				// Create edge for attribute mapping
				const edgeId = `attr-${conn.sourceEntityId}-${conn.sourceAttr}-${conn.targetEntityId}-${conn.targetAttr}`;
				const sourceNodeId = sourceAttr?.id || conn.sourceEntityId;
				const targetNodeId = targetAttr?.id || conn.targetEntityId;

				// Only add edge if both nodes exist
				if (addedNodeIds.has(sourceNodeId) && addedNodeIds.has(targetNodeId)) {
					edges.push({
						id: edgeId,
						source: sourceNodeId,
						target: targetNodeId,
						type: "smoothstep",
						animated: true,
						style: {
							stroke: "#2196f3",
							strokeWidth: 2,
							strokeDasharray: "5,5",
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: "#2196f3",
						},
						label: `${conn.sourceAttr} → ${conn.targetAttr}`,
						labelStyle: { fontSize: 9, fill: "#1976d2", fontWeight: 500 },
						labelBgStyle: { fill: "#e3f2fd", fillOpacity: 0.9 },
					});
				}
			}
		});

		// Apply dagre layout
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);

		return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
	}, [
		currentObject,
		relatedObjects,
		allObjects,
		attributeConnections,
		handleNodeClick,
	]);

	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, , onEdgesChange] = useEdgesState(initialEdges);
	const { mode } = useColorScheme();

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			nodeTypes={nodeTypes}
			fitView
			fitViewOptions={{ padding: 0.2 }}
			minZoom={0.3}
			maxZoom={2}
			defaultEdgeOptions={{
				type: "smoothstep",
				animated: true,
			}}
			proOptions={{ hideAttribution: true }}
			colorMode={mode}
		>
			<Background color="#e0e0e0" gap={16} />
			<Controls />
			<MiniMap
				nodeColor={(node) => {
					const data = node.data as ObjectNodeData;
					return TYPE_COLORS[data.object.objectType]?.border || "#1976d2";
				}}
				maskColor="rgba(0, 0, 0, 0.1)"
				style={{ background: "#f5f5f5" }}
			/>
		</ReactFlow>
	);
};

// ============================================================================
// Main Component
// ============================================================================

interface ObjectGraphViewProps {
	object: ObjectItem | null;
	relatedObjects: ObjectItem[];
	allObjects: ObjectItem[];
	attributeConnections: AttributeConnection[];
}

export const ObjectGraphView: React.FC<ObjectGraphViewProps> = ({
	object,
	relatedObjects,
	allObjects,
	attributeConnections,
}) => {
	if (!object) {
		return (
			<Container>
				<Typography variant="body1" color="text.secondary">
					Объект не выбран
				</Typography>
			</Container>
		);
	}

	const hasConnections =
		relatedObjects.length > 0 || attributeConnections.length > 0;

	if (!hasConnections) {
		return (
			<Container>
				<EmptyState>
					<Typography variant="body1" color="text.secondary" gutterBottom>
						Нет связанных объектов для отображения
					</Typography>
					<Chip
						label={object.object}
						color={
							object.objectType === "Источник"
								? "primary"
								: object.objectType === "Витрина"
									? "warning"
									: "success"
						}
						size="small"
					/>
				</EmptyState>
			</Container>
		);
	}

	return (
		<Container>
			<ReactFlowProvider>
				<ObjectGraphFlow
					currentObject={object}
					relatedObjects={relatedObjects}
					allObjects={allObjects}
					attributeConnections={attributeConnections}
				/>
			</ReactFlowProvider>
		</Container>
	);
};

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
	height: "100%",
	width: "100%",
	display: "flex",
	flexDirection: "column",
});

const EmptyState = styled(Box)({
	flex: 1,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: 8,
});
