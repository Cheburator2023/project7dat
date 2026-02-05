import React, {
	useCallback,
	useMemo,
	memo,
	useEffect,
	useRef,
	useState,
} from "react";
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
	Panel,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
	styled,
	Box,
	Typography,
	Chip,
	useColorScheme,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
} from "@mui/material";
import {
	CenterFocusStrong,
	ContentCopy,
	OpenInNew,
	Info,
} from "@mui/icons-material";
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

interface ObjectContextMenuState {
	x: number;
	y: number;
	objectId: string;
}

const ObjectGraphFlow: React.FC<ObjectGraphFlowProps> = ({
	currentObject,
	relatedObjects,
	allObjects,
	attributeConnections,
}) => {
	const navigate = useNavigate();
	const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("LR");
	const { setCenter, getNode } = useReactFlow();
	const hasFocusedInitiallyRef = useRef(false);
	const [contextMenu, setContextMenu] = useState<ObjectContextMenuState | null>(
		null,
	);

	const handleNodeClick = useCallback(
		(objectId: string) => {
			navigate(`/objects/${encodeURIComponent(objectId)}`);
		},
		[navigate],
	);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	const contextMenuObject = useMemo(() => {
		if (!contextMenu) return null;
		return allObjects.find((obj) => obj.id === contextMenu.objectId) ?? null;
	}, [allObjects, contextMenu]);

	const handleGoToObject = useCallback(() => {
		if (!contextMenuObject) return;
		navigate(`/objects/${encodeURIComponent(contextMenuObject.id)}`);
		handleCloseContextMenu();
	}, [contextMenuObject, handleCloseContextMenu, navigate]);

	const handleOpenObjectInNewTab = useCallback(() => {
		if (!contextMenuObject) return;
		window.open(
			`/objects/${encodeURIComponent(contextMenuObject.id)}`,
			"_blank",
		);
		handleCloseContextMenu();
	}, [contextMenuObject, handleCloseContextMenu]);

	const handleCopyId = useCallback(() => {
		if (!contextMenuObject) return;
		navigator.clipboard.writeText(contextMenuObject.id);
		handleCloseContextMenu();
	}, [contextMenuObject, handleCloseContextMenu]);

	const handleGoToEntity = useCallback(() => {
		if (!contextMenuObject) return;
		const entityId =
			contextMenuObject.objectType === "Признак"
				? contextMenuObject.graphId
					? `${contextMenuObject.graphId}::${contextMenuObject.modelId}`
					: null
				: contextMenuObject.id;
		if (!entityId) return;
		navigate(`/entity/${encodeURIComponent(entityId)}`);
		handleCloseContextMenu();
	}, [contextMenuObject, handleCloseContextMenu, navigate]);

	const handleGoToModel = useCallback(() => {
		if (!contextMenuObject) return;
		navigate(
			`/services/models/${encodeURIComponent(contextMenuObject.modelId)}`,
		);
		handleCloseContextMenu();
	}, [contextMenuObject, handleCloseContextMenu, navigate]);

	const handleNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			event.preventDefault();
			setContextMenu({
				x: event.clientX,
				y: event.clientY,
				objectId: node.id,
			});
		},
		[],
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
			layoutDirection,
		);

		return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
	}, [
		currentObject,
		relatedObjects,
		allObjects,
		attributeConnections,
		handleNodeClick,
		layoutDirection,
	]);

	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, , onEdgesChange] = useEdgesState(initialEdges);
	const { mode } = useColorScheme();

	const focusMainNode = useCallback(() => {
		const node = getNode(currentObject.id);
		if (!node) return;
		const x = node.position.x + (node.measured?.width ?? NODE_WIDTH) / 2;
		const y = node.position.y + (node.measured?.height ?? NODE_HEIGHT) / 2;
		setCenter(x, y, { duration: 400 });
	}, [currentObject.id, getNode, setCenter]);

	useEffect(() => {
		if (hasFocusedInitiallyRef.current) return;
		const exists = nodes.some((n) => n.id === currentObject.id);
		if (!exists) return;
		const handle = window.setTimeout(() => {
			focusMainNode();
			hasFocusedInitiallyRef.current = true;
		}, 120);
		return () => window.clearTimeout(handle);
	}, [currentObject.id, focusMainNode, nodes]);

	useEffect(() => {
		const exists = nodes.some((n) => n.id === currentObject.id);
		if (!exists) return;
		const handle = window.setTimeout(() => {
			focusMainNode();
		}, 120);
		return () => window.clearTimeout(handle);
	}, [currentObject.id, focusMainNode, layoutDirection, nodes]);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onNodeContextMenu={handleNodeContextMenu}
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
			<Controls>
				<div data-name="scroll_to_main_node">
					<button
						onClick={focusMainNode}
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
						title="К основной ноде"
						type="button"
					>
						<CenterFocusStrong style={{ fontSize: 16, color: "#666" }} />
					</button>
				</div>
			</Controls>
			<MiniMap
				nodeColor={(node) => {
					const data = node.data as ObjectNodeData;
					return TYPE_COLORS[data.object.objectType]?.border || "#1976d2";
				}}
				maskColor="rgba(0, 0, 0, 0.1)"
				style={{ background: "#f5f5f5" }}
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
							Граф объектов
						</div>
						<div style={{ fontSize: 11, color: "#666" }}>
							{nodes.length} узлов, {edges.length} связей
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
					</div>
				</div>
			</Panel>
			<Menu
				open={contextMenu !== null}
				onClose={handleCloseContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
				}
			>
				<MenuItem onClick={handleGoToObject}>
					<ListItemIcon>
						<Info fontSize="small" />
					</ListItemIcon>
					<ListItemText>Открыть карточку объекта</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleOpenObjectInNewTab}>
					<ListItemIcon>
						<OpenInNew fontSize="small" />
					</ListItemIcon>
					<ListItemText>Открыть в новой вкладке</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleCopyId}>
					<ListItemIcon>
						<ContentCopy fontSize="small" />
					</ListItemIcon>
					<ListItemText>Скопировать ID</ListItemText>
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={handleGoToEntity}
					disabled={
						!contextMenuObject ||
						(contextMenuObject.objectType === "Признак" &&
							!contextMenuObject.graphId)
					}
				>
					<ListItemText>Перейти к сущности</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleGoToModel} disabled={!contextMenuObject}>
					<ListItemText>Перейти к модели</ListItemText>
				</MenuItem>
			</Menu>
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
