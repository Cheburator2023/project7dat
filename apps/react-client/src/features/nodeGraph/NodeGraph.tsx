import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	Background,
	Controls,
	type OnConnectStart,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import type { Node as FlowNode } from "@xyflow/react";
import { debounce } from "lodash-es";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { DataLineageNodeComponent } from "./DataLineageNode";
import { MouseButton } from "./MouseButton";
import {
	useClearSearchHl,
	useRevealNode,
	useViewportChange,
} from "./useViewportChange";
import { useVirtualGraph } from "./useVirtualGraph";

export function NodeGraph() {
	return (
		<div id="main_graph_reactflow" className="relative w-full h-full">
			<ReactFlowProvider>
				<LayoutGraph />
			</ReactFlowProvider>
		</div>
	);
}

function LayoutGraph() {
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

	const config = {
		panOnScrollSpeed: 0.5,
		minZoom: 0.1,
		maxZoom: 4,
		reconnectRadius: 20,
		colorMode: "light" as const,
		attributionPosition: "bottom-left" as const,
	};

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
			nodeTypes={{
				dataLineageNode: DataLineageNodeComponent,
			}}
			defaultEdgeOptions={{
				selectable: false,
				focusable: false,
				deletable: false,
			}}
			translateExtent={translateExtent}
			onPaneClick={(_: React.MouseEvent) => {
				clearSearchHl();
				clearSelection();
			}}
			onNodeClick={(_: React.MouseEvent, node: FlowNode) => {
				clearSearchHl(node.id);
				selectNode(node.id);
			}}
			onConnectStart={(
				_: any,
				{ nodeId, handleId, handleType }: Parameters<OnConnectStart>[1],
			) => {
				if (handleType === "target" || !(nodeId && handleId)) {
					return;
				}
				console.log("Connect start:", nodeId, handleId);
			}}
			onError={onError}
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			nodesDraggable={true}
			nodesConnectable={true}
			connectOnClick={false}
			deleteKeyCode={null}
			selectionKeyCode={null}
			multiSelectionKeyCode={null}
		>
			<Controls showInteractive={false}>
				<MouseButton />
			</Controls>
			<Background />
		</ReactFlow>
	);
}

const print008Error = debounce(
	(_code: string, message: string) => console.error(message),
	100,
	{ leading: true },
);

const onError = (code: string, message: string) => {
	if (code === "008") {
		print008Error(code, message);
	} else {
		console.error(message);
	}
};
