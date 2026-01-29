import dagre from "@dagrejs/dagre";
import type { Node, Edge, Position } from "@xyflow/react";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = "TB",
) => {
	const isHorizontal = direction === "LR";
	dagreGraph.setGraph({ rankdir: direction });

	nodes.forEach((node) => {
		const width = (node.data?.width as number) || 220;
		const height = (node.data?.height as number) || 120;
		dagreGraph.setNode(node.id, { width, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes: Node[] = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const width = (node.data?.width as number) || 220;
		const height = (node.data?.height as number) || 120;

		return {
			...node,
			targetPosition: (isHorizontal ? "left" : "top") as Position,
			sourcePosition: (isHorizontal ? "right" : "bottom") as Position,
			position: {
				x: nodeWithPosition.x - width / 2,
				y: nodeWithPosition.y - height / 2,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
};
