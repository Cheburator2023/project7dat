import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	Background,
	Controls,
	type OnConnectStart,
	ReactFlow,
	ReactFlowProvider,
	MarkerType,
	BaseEdge,
	EdgeProps,
	getBezierPath,
} from "@xyflow/react";
import type { Node as FlowNode } from "@xyflow/react";
import { useRef, memo, useCallback, useMemo, useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	Box,
	styled,
	useColorScheme,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { DataLineageNodeComponent } from "./DataLineageNode";
import { MouseButton } from "./MouseButton";
import {
	useClearSearchHl,
	useRevealNode,
	useViewportChange,
} from "./useViewportChange";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { DataLineageNode } from "@react-client/types/dataLineage";

// Custom Edge with tooltip
const CustomEdge = memo((props: EdgeProps) => {
	const {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		style,
		markerEnd,
		data,
	} = props;

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const edgeLabel = data?.label || data?.description || "";

	return (
		<g>
			<BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
			{edgeLabel && (
				<g>
					{/* @ts-ignore - SVG title element */}
					<title>{edgeLabel}</title>
					<circle
						cx={labelX}
						cy={labelY}
						r={10}
						fill="#fff"
						stroke="#b1b1b7"
						strokeWidth={2}
						style={{ cursor: "help" }}
					/>
					<text
						x={labelX}
						y={labelY}
						textAnchor="middle"
						dominantBaseline="middle"
						style={{
							fontSize: "10px",
							fontWeight: "bold",
							fill: "#666",
							pointerEvents: "none",
						}}
					>
						i
					</text>
				</g>
			)}
		</g>
	);
});

CustomEdge.displayName = "CustomEdge";

const nodeTypes = {
	dataLineageNode: DataLineageNodeComponent,
};

const edgeTypes = {
	custom: CustomEdge,
};

const GraphContainer = styled(Box)({
	position: "relative",
	width: "100%",
	height: "100%",
});

type LayoutType = "grid" | "force" | "hierarchical" | "circular" | "random";

export const NodeGraph = memo(({ layoutType }: { layoutType: LayoutType }) => {
	return (
		<GraphContainer id="main_graph_reactflow">
			<ReactFlowProvider>
				<LayoutGraph layoutType={layoutType} />
			</ReactFlowProvider>
		</GraphContainer>
	);
});

const LayoutGraph = memo(
	({ layoutType }: { layoutType: LayoutType }): React.ReactElement => {
		const ref = useRef<any>(null);
		const theme = useColorScheme();

		// Track expanded nodes (nodes whose children are visible)
		const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

		// Context menu state
		const [contextMenu, setContextMenu] = useState<{
			mouseX: number;
			mouseY: number;
			nodeId: string;
			graphId?: string;
		} | null>(null);

		const navigate = useNavigate();

		const {
			selectNode,
			clearSelection,
			currentGraph,
			currentGraphId,
			selectedNodes,
			selectedEdges,
			viewMode,
		} = useDataLineageStore(
			useShallow((state) => ({
				selectNode: state.selectNode,
				clearSelection: state.clearSelection,
				currentGraph: state.currentGraph,
				currentGraphId: state.currentGraphId,
				selectedNodes: state.selectedNodes,
				selectedEdges: state.selectedEdges,
				viewMode: state.viewMode,
			})),
		);

		// Layout calculation functions
		const calculateLayout = useCallback((entities: any[], type: LayoutType) => {
			const nodeWidth = 200;
			const nodeHeight = 100;
			const spacing = 50;

			switch (type) {
				case "grid": {
					const cols = Math.ceil(Math.sqrt(entities.length));
					return entities.map((_, index) => ({
						x: (index % cols) * (nodeWidth + spacing),
						y: Math.floor(index / cols) * (nodeHeight + spacing),
					}));
				}
				case "circular": {
					const radius = Math.max(200, entities.length * 30);
					const centerX = radius;
					const centerY = radius;
					return entities.map((_, index) => {
						const angle = (index / entities.length) * 2 * Math.PI;
						return {
							x: centerX + radius * Math.cos(angle),
							y: centerY + radius * Math.sin(angle),
						};
					});
				}
				case "hierarchical": {
					const _levels = Math.ceil(entities.length / 5);
					return entities.map((_, index) => {
						const level = Math.floor(index / 5);
						const posInLevel = index % 5;
						return {
							x: posInLevel * (nodeWidth + spacing),
							y: level * (nodeHeight + spacing * 2),
						};
					});
				}
				case "force": {
					// Simple force-directed simulation
					return entities.map((_, _index) => {
						const angle = Math.random() * 2 * Math.PI;
						const distance = Math.random() * 400 + 100;
						return {
							x: 400 + distance * Math.cos(angle),
							y: 300 + distance * Math.sin(angle),
						};
					});
				}
				case "random": {
					return entities.map(() => ({
						x: Math.random() * 1000,
						y: Math.random() * 600,
					}));
				}
				default:
					return entities.map((_, index) => ({
						x: (index % 4) * 320,
						y: Math.floor(index / 4) * 200,
					}));
			}
		}, []);

		// Get child entity IDs for a given entity
		const getChildEntityIds = useCallback(
			(entityId: string): string[] => {
				if (!currentGraph?.mappings) return [];

				const mapping = currentGraph.mappings.find(
					(m) => m.entityId === entityId,
				);
				if (!mapping?.deps) return [];

				return mapping.deps.map((dep) => dep.entityId);
			},
			[currentGraph?.mappings],
		);

		// Get all visible entity IDs based on expansion state
		const visibleEntityIds = useMemo(() => {
			if (!currentGraph?.entities) return new Set<string>();

			// Show ALL entities by default - no filtering based on expansion
			// Expansion only affects which edges are shown, not which nodes
			const visible = new Set<string>();

			currentGraph.entities.forEach((entity) => {
				visible.add(entity.id);
			});

			console.log("[NodeGraph] Visibility:", {
				totalEntities: currentGraph.entities.length,
				visibleCount: visible.size,
				expandedNodes: Array.from(expandedNodes),
			});

			return visible;
		}, [currentGraph?.entities, expandedNodes]);

		// Node creation with dynamic layout positioning
		const initialNodes = useMemo(() => {
			console.log("[NodeGraph] initialNodes calculation:", {
				hasCurrentGraph: !!currentGraph,
				entitiesCount: currentGraph?.entities?.length || 0,
				viewMode,
				viewModeCheck: viewMode !== "graph",
			});

			if (!currentGraph?.entities || viewMode !== "graph") {
				console.log("[NodeGraph] Returning empty nodes - check failed");
				return [];
			}

			// Filter entities based on visibility - show all visible entities
			const entities = currentGraph.entities.filter((entity) =>
				visibleEntityIds.has(entity.id),
			);

			console.log("[NodeGraph] Filtered entities:", {
				totalEntities: currentGraph.entities.length,
				filteredCount: entities.length,
				visibleIdsSize: visibleEntityIds.size,
			});

			const positions = calculateLayout(entities, layoutType);

			return entities.map((entity, index) => {
				const { x, y } = positions[index] || { x: 0, y: 0 };
				const hasChildren = getChildEntityIds(entity.id).length > 0;
				const isExpanded = expandedNodes.has(entity.id);

				return {
					id: entity.id,
					type: "dataLineageNode",
					position: { x, y },
					data: {
						node: {
							id: entity.id,
							name: entity.name,
							type: entity.type === "table" ? "dataset" : "view",
							description: `${entity.namespace ? `${entity.namespace}.` : ""}${entity.name}`,
							metadata: {
								created: new Date().toISOString(),
								updated: new Date().toISOString(),
								tags: [],
							},
							position: { x, y },
							status: entity.modified ? "active" : "inactive",
						} as DataLineageNode,
						selected: selectedNodes.includes(entity.id),
						width: 200,
						height: 100,
						hasChildren,
						isExpanded,
					},
					draggable: true,
					selectable: true,
					focusable: false,
				};
			});
		}, [
			currentGraph?.entities,
			viewMode,
			layoutType,
			calculateLayout,
			visibleEntityIds,
			expandedNodes,
			getChildEntityIds,
			selectedNodes,
		]);

		const initialEdges = useMemo(() => {
			if (!currentGraph?.mappings || viewMode !== "graph") return [];

			// Only show edges between visible nodes
			return currentGraph.mappings
				.flatMap(
					(mapping, mappingIndex) =>
						mapping.deps
							?.map((dep, depIndex) => {
								// Only create edge if both source and target are visible
								if (
									!visibleEntityIds.has(dep.entityId) ||
									!visibleEntityIds.has(mapping.entityId)
								) {
									return null;
								}

								const edgeId = `${mapping.id}-${mappingIndex}-${dep.entityId}-${depIndex}`;
								const legacyEdgeId = `${mapping.entityId}-${dep.entityId}`;
								const isSelected =
									selectedEdges.includes(legacyEdgeId) ||
									selectedEdges.includes(edgeId);

								// Build edge description from attribute mappings
								const attrMaps = dep.attrMaps || [];
								const description =
									attrMaps.length > 0
										? `Маппинг атрибутов: ${attrMaps.map((am: any) => `${am.src} → ${am.dst}`).join(", ")}`
										: "Связь между объектами";

								return {
									id: edgeId,
									source: dep.entityId,
									target: mapping.entityId,
									type: "custom",
									data: {
										selected: isSelected,
										description,
										label: description,
									},
									style: {
										stroke: isSelected ? "#ff6b6b" : "#b1b1b7",
										strokeWidth: isSelected ? 3 : 2,
									},
									markerEnd: {
										type: MarkerType.ArrowClosed,
										color: isSelected ? "#ff6b6b" : "#b1b1b7",
									},
									animated: false,
									interactionWidth: 20,
									focusable: false,
								};
							})
							.filter(Boolean) || [],
				)
				.filter(Boolean) as any[];
		}, [currentGraph?.mappings, selectedEdges, viewMode, visibleEntityIds]);
		console.log("🐸 Pepe said >> currentGraph:", currentGraph);

		const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
		const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

		// Update nodes when initialNodes changes
		useEffect(() => {
			setNodes(initialNodes);
		}, [initialNodes, setNodes]);

		// Update edges when initialEdges changes
		useEffect(() => {
			setEdges(initialEdges);
		}, [initialEdges, setEdges]);

		// Debug logging for nodes
		useEffect(() => {
			console.log("[NodeGraph] Nodes state:", {
				initialNodesCount: initialNodes.length,
				currentNodesCount: nodes.length,
				viewMode,
				hasCurrentGraph: !!currentGraph,
				entitiesCount: currentGraph?.entities?.length || 0,
			});
		}, [initialNodes, nodes, viewMode, currentGraph]);

		// Toggle node expansion
		const toggleNodeExpansion = useCallback((nodeId: string) => {
			setExpandedNodes((prev) => {
				const next = new Set(prev);
				if (next.has(nodeId)) {
					next.delete(nodeId);
				} else {
					next.add(nodeId);
				}
				return next;
			});
		}, []);

		const { isZooming, isDragging } = useViewportChange(
			ref,
			setNodes,
			setEdges,
		);
		useRevealNode(nodes, setNodes, setEdges);
		const clearSearchHl = useClearSearchHl();

		const config = useMemo(
			() => ({
				panOnScrollSpeed: isDragging ? 1.2 : 0.8, // Faster pan during drag
				minZoom: 0.1,
				maxZoom: 10,
				reconnectRadius: 20,
				colorMode: "light" as const,
				attributionPosition: "bottom-left" as const,
				// Zoom performance optimizations
				zoomOnScroll: true,
				zoomOnPinch: true,
				zoomOnDoubleClick: false, // Disable to prevent conflicts
				panOnScrollMode: "free" as const,
			}),
			[isDragging],
		);

		const defaultEdgeOptions = useMemo(
			() => ({
				selectable: false,
				focusable: false,
				deletable: false,
				type: "custom",
				animated: false,
				style: {
					stroke: isZooming || isDragging ? "#999" : "#b1b1b7",
					strokeWidth: isZooming || isDragging ? 1 : 2,
				},
				markerEnd: {
					type: MarkerType.ArrowClosed,
				},
			}),
			[isZooming, isDragging],
		);

		const fitViewOptions = useMemo(
			() => ({ padding: 0.1, includeHiddenNodes: false }),
			[],
		);
		const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);
		const proOptions = useMemo(() => ({ hideAttribution: true }), []);

		const handlePaneClick = useCallback(
			(_: React.MouseEvent) => {
				clearSearchHl();
				clearSelection();
			},
			[clearSearchHl, clearSelection],
		);

		// Handle node click - toggle expansion and select
		const handleNodeClick = useCallback(
			(event: React.MouseEvent, node: FlowNode) => {
				// Simple throttling mechanism
				const now = Date.now();
				if (now - (handleNodeClick as any).lastCall < 150) return;
				(handleNodeClick as any).lastCall = now;

				clearSearchHl(node.id);
				selectNode(node.id);

				// Toggle expansion if node has children and it's a double click or ctrl+click
				if (node.data?.hasChildren) {
					if (event.detail === 2 || event.ctrlKey || event.metaKey) {
						toggleNodeExpansion(node.id);
					}
				}
			},
			[clearSearchHl, selectNode, toggleNodeExpansion],
		);

		// Handle node context menu (right click)
		const handleNodeContextMenu = useCallback(
			(event: React.MouseEvent, node: FlowNode) => {
				event.preventDefault();
				setContextMenu(
					contextMenu === null
						? {
								mouseX: event.clientX + 2,
								mouseY: event.clientY - 6,
								nodeId: node.id,
								graphId: currentGraphId || undefined,
							}
						: null,
				);
			},
			[contextMenu, currentGraphId],
		);

		// Handle context menu close
		const handleContextMenuClose = useCallback(() => {
			setContextMenu(null);
		}, []);

		// Handle navigate to object card
		const handleNavigateToCard = useCallback(() => {
			if (!contextMenu) return;
			const objectId = contextMenu.graphId
				? `${contextMenu.graphId}::${contextMenu.nodeId}`
				: contextMenu.nodeId;
			navigate(`/objects/${encodeURIComponent(objectId)}`);
			handleContextMenuClose();
		}, [contextMenu, navigate, handleContextMenuClose]);

		const handleConnectStart: OnConnectStart = useCallback(
			(_, { nodeId, handleId, handleType }) => {
				if (handleType === "target" || !(nodeId && handleId)) {
					return;
				}
				console.log("Connect start:", nodeId, handleId);
			},
			[],
		);

		return (
			<>
				<ReactFlow
					ref={ref}
					panOnScroll={true}
					panOnScrollSpeed={config.panOnScrollSpeed}
					minZoom={config.minZoom}
					maxZoom={config.maxZoom}
					reconnectRadius={config.reconnectRadius}
					colorMode={theme.mode}
					attributionPosition={config.attributionPosition}
					zoomOnScroll={config.zoomOnScroll}
					zoomOnPinch={config.zoomOnPinch}
					zoomOnDoubleClick={config.zoomOnDoubleClick}
					nodeTypes={nodeTypes as any}
					edgeTypes={edgeTypes as any}
					defaultEdgeOptions={defaultEdgeOptions}
					onPaneClick={handlePaneClick}
					onNodeClick={handleNodeClick}
					onNodeContextMenu={handleNodeContextMenu}
					onConnectStart={handleConnectStart}
					onError={onError}
					nodes={nodes}
					snapToGrid={!isDragging}
					fitView
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					nodesDraggable={true}
					nodesConnectable={false}
					proOptions={proOptions}
					elevateNodesOnSelect={false}
					selectNodesOnDrag={false}
					panOnDrag={[1, 2]}
					deleteKeyCode={null}
					connectOnClick={false}
					fitViewOptions={fitViewOptions}
					defaultViewport={defaultViewport}
					selectionKeyCode={null}
					onlyRenderVisibleElements={true}
					disableKeyboardA11y={true}
					multiSelectionKeyCode={null}
				>
					<Controls showInteractive={false}>
						<MouseButton />
					</Controls>
					<Background />
				</ReactFlow>

				{/* Context Menu */}
				<Menu
					open={contextMenu !== null}
					onClose={handleContextMenuClose}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null
							? { top: contextMenu.mouseY, left: contextMenu.mouseX }
							: undefined
					}
				>
					<MenuItem onClick={handleNavigateToCard}>
						<ListItemIcon>
							<VisibilityIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Открыть карточку объекта</ListItemText>
					</MenuItem>
				</Menu>
			</>
		);
	},
);

const onError = (_code: string, message: string) => {
	console.error(message);
};
