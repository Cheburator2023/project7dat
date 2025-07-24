import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node as FlowNode } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

export interface NodeWithData extends FlowNode {
	data: {
		node: DataLineageNode;
		selected: boolean;
		width: number;
		height: number;
	};
}

export interface EdgeWithData extends Edge {
	data: {
		selected: boolean;
	};
}

const config = {
	translateMargin: 1000,
	nodeWidth: 200,
	nodeHeight: 100,
	nodeGap: 50,
	levelGap: 150,
};

export function useVirtualGraph() {
	const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

	const translateExtentRef = useRef<[[number, number], [number, number]]>([
		[-config.translateMargin, -config.translateMargin],
		[config.translateMargin, config.translateMargin],
	]);

	const { currentGraph, selectedNodes, selectedEdges, viewMode } =
		useDataLineageStore(
			useShallow((state) => ({
				currentGraph: state.currentGraph,
				selectedNodes: state.selectedNodes,
				selectedEdges: state.selectedEdges,
				viewMode: state.viewMode,
			})),
		);

	useEffect(() => {
		if (!currentGraph || viewMode !== "graph") {
			setNodes([]);
			setEdges([]);
			return;
		}

		const flowNodes: NodeWithData[] = currentGraph.nodes.map((node, index) => {
			const x = (index % 4) * (config.nodeWidth + config.nodeGap);
			const y = Math.floor(index / 4) * (config.nodeHeight + config.levelGap);

			return {
				id: node.id,
				type: "dataLineageNode",
				position: node.position || { x, y },
				data: {
					node,
					selected: selectedNodes.includes(node.id),
					width: config.nodeWidth,
					height: config.nodeHeight,
				},
				draggable: true,
				selectable: true,
			};
		});

		const flowEdges: EdgeWithData[] = currentGraph.edges.map((edge) => ({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			type: "smoothstep",
			data: {
				selected: selectedEdges.includes(edge.id),
			},
			style: {
				stroke: selectedEdges.includes(edge.id) ? "#ff6b6b" : "#b1b1b7",
				strokeWidth: selectedEdges.includes(edge.id) ? 3 : 1,
			},
		}));

		setNodes(flowNodes);
		setEdges(flowEdges);

		const maxX = Math.max(...flowNodes.map((n) => n.position.x));
		const maxY = Math.max(...flowNodes.map((n) => n.position.y));
		const px = Math.max(config.translateMargin, maxX + config.nodeWidth);
		const py = Math.max(config.translateMargin, maxY + config.nodeHeight);

		translateExtentRef.current = [
			[-config.translateMargin, -config.translateMargin],
			[px, py],
		];
	}, [currentGraph, selectedNodes, selectedEdges, viewMode]);

	return {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		translateExtent: translateExtentRef.current,
	};
}
