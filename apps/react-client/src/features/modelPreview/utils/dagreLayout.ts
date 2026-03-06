import dagre from "@dagrejs/dagre";
import type { Node, Edge, Position } from "@xyflow/react";

export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = "TB",
) => {
	const isHorizontal = direction === "LR";
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	// Динамический расчёт расстояний на основе количества нод
	const nodeCount = nodes.length;

	// Увеличенные базовые расстояния для горизонтального layout
	// nodesep - расстояние между нодами на одном уровне (по вертикали в LR)
	// ranksep - расстояние между уровнями (по горизонтали в LR)
	const baseNodeSep = isHorizontal ? 100 : 60;
	const baseRankSep = isHorizontal ? 200 : 120;

	// Увеличиваем расстояния для больших графов
	const nodeSep = nodeCount > 10 ? baseNodeSep * 1.5 : baseNodeSep;
	const rankSep = nodeCount > 10 ? baseRankSep * 1.3 : baseRankSep;

	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: nodeSep,
		ranksep: rankSep,
		marginx: 30,
		marginy: 30,
	});

	nodes.forEach((node) => {
		// Используем реальные размеры нод из ModelNodePreviewComponent (280x140)
		const width = (node.data?.width as number) || 280;
		const height = (node.data?.height as number) || 140;
		dagreGraph.setNode(node.id, { width, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	const layoutedNodes: Node[] = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const width = (node.data?.width as number) || 280;
		const height = (node.data?.height as number) || 140;

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
