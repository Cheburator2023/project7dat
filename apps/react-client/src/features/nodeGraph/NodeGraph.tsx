import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	Background,
	Controls,
	type OnConnectStart,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import type { Node as FlowNode } from "@xyflow/react";
import { useRef, memo, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Box, styled } from "@mui/material";

import { DataLineageNodeComponent } from "./DataLineageNode";
import { MouseButton } from "./MouseButton";
import {
	useClearSearchHl,
	useRevealNode,
	useViewportChange,
} from "./useViewportChange";
import { useVirtualGraph } from "./useVirtualGraph";

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
	const { selectNode, clearSelection } = useDataLineageStore(
		useShallow((state) => ({
			selectNode: state.selectNode,
			clearSelection: state.clearSelection,
		})),
	);

	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		translateExtent,
	} = useVirtualGraph();
	useViewportChange(ref, setNodes, setEdges);
	useRevealNode(nodes, setNodes, setEdges);
	const clearSearchHl = useClearSearchHl();

	const config = useMemo(
		() => ({
			panOnScrollSpeed: 0.5,
			minZoom: 0.1,
			maxZoom: 10,
			reconnectRadius: 20,
			colorMode: "light" as const,
			attributionPosition: "bottom-left" as const,
		}),
		[],
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
		}),
		[],
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
			nodeTypes={nodeTypes}
			defaultEdgeOptions={defaultEdgeOptions}
			translateExtent={translateExtent}
			onPaneClick={handlePaneClick}
			onNodeClick={handleNodeClick}
			onConnectStart={handleConnectStart}
			onError={onError}
			nodes={nodes}
			snapToGrid
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
