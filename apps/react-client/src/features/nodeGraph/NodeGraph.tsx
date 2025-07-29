import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	Background,
	Controls,
	type OnConnectStart,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import type { Node as FlowNode } from "@xyflow/react";
import { useRef, memo, useCallback, useMemo, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Box, styled } from "@mui/material";

import { DataLineageNodeComponent } from "./DataLineageNode";
import { MouseButton } from "./MouseButton";
import {
	useClearSearchHl,
	useRevealNode,
	useViewportChange,
} from "./useViewportChange";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { DataLineageNode } from "@react-client/types/dataLineage";

const GraphContainer = styled(Box)({
	position: "relative",
	width: "100%",
	height: "100%",
});

export const NodeGraph = memo(() => {
	return (
		<GraphContainer id="main_graph_reactflow">
			<ReactFlowProvider>
				<LayoutGraph />
			</ReactFlowProvider>
		</GraphContainer>
	);
});

const LayoutGraph = memo(() => {
	const ref = useRef<any>(null);
	const {
		selectNode,
		clearSelection,
		currentGraph,
		selectedNodes,
		selectedEdges,
		viewMode,
	} = useDataLineageStore(
		useShallow((state) => ({
			selectNode: state.selectNode,
			clearSelection: state.clearSelection,
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
			selectedEdges: state.selectedEdges,
			viewMode: state.viewMode,
		})),
	);

	// Simple node/edge creation without complex positioning algorithms
	const initialNodes = useMemo(() => {
		if (!currentGraph?.entities || viewMode !== "graph") return [];

		return currentGraph.entities.slice(0, 100).map((entity, index) => {
			const x = (index % 4) * 320; // Simple grid: 4 nodes per row
			const y = Math.floor(index / 4) * 200;

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
				},
				draggable: true,
				selectable: true,
				focusable: false,
			};
		});
	}, [currentGraph?.entities, selectedNodes, viewMode]);

	const initialEdges = useMemo(() => {
		if (!currentGraph?.mappings || viewMode !== "graph") return [];

		return currentGraph.mappings.slice(0, 50).flatMap(
			(mapping, mappingIndex) =>
				mapping.deps?.slice(0, 10).map((dep, depIndex) => {
					const edgeId = `${mapping.id}-${mappingIndex}-${dep.entityId}-${depIndex}`;
					const legacyEdgeId = `${mapping.entityId}-${dep.entityId}`;
					const isSelected =
						selectedEdges.includes(legacyEdgeId) ||
						selectedEdges.includes(edgeId);

					return {
						id: edgeId,
						source: dep.entityId,
						target: mapping.entityId,
						type: "simplebezier",
						data: { selected: isSelected },
						style: {
							stroke: isSelected ? "#ff6b6b" : "#b1b1b7",
							strokeWidth: isSelected ? 3 : 1,
						},
						animated: false,
						interactionWidth: 20,
						focusable: false,
					};
				}) || [],
		);
	}, [currentGraph?.mappings, selectedEdges, viewMode]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Update nodes and edges when data changes
	useEffect(() => {
		setNodes(initialNodes);
	}, [initialNodes, setNodes]);

	useEffect(() => {
		setEdges(initialEdges);
	}, [initialEdges, setEdges]);

	const { isZooming, isDragging } = useViewportChange(ref, setNodes, setEdges);
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

	const nodeTypes = useMemo(
		() => ({
			dataLineageNode: DataLineageNodeComponent,
		}),
		[],
	);

	const defaultEdgeOptions = useMemo(
		() => ({
			selectable: false,
			focusable: false,
			deletable: false,
			// Reduce edge complexity during zoom/drag for better performance
			animated: !isZooming && !isDragging,
			// Simplify edges during interactions
			style: {
				stroke: isZooming || isDragging ? "#999" : "#b1b1b7",
				strokeWidth: isZooming || isDragging ? 1 : 2,
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

	// Throttle node clicks to prevent rapid successive calls
	const handleNodeClick = useCallback(
		(_: React.MouseEvent, node: FlowNode) => {
			// Simple throttling mechanism
			const now = Date.now();
			if (now - (handleNodeClick as any).lastCall < 150) return;
			(handleNodeClick as any).lastCall = now;

			clearSearchHl(node.id);
			selectNode(node.id);
		},
		[clearSearchHl, selectNode],
	);

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
		<ReactFlow
			ref={ref}
			panOnScroll={true}
			panOnScrollSpeed={config.panOnScrollSpeed}
			minZoom={config.minZoom}
			maxZoom={config.maxZoom}
			reconnectRadius={config.reconnectRadius}
			colorMode={config.colorMode}
			attributionPosition={config.attributionPosition}
			zoomOnScroll={config.zoomOnScroll}
			zoomOnPinch={config.zoomOnPinch}
			zoomOnDoubleClick={config.zoomOnDoubleClick}
			nodeTypes={nodeTypes as any}
			defaultEdgeOptions={defaultEdgeOptions}
			onPaneClick={handlePaneClick}
			onNodeClick={handleNodeClick}
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
	);
});

const onError = (_code: string, message: string) => {
	console.error(message);
};
