import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node as FlowNode } from "@xyflow/react";
import { useEffect, useRef, useMemo, useCallback } from "react";
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
	nodeGap: 120, // Increased horizontal spacing between nodes
	levelGap: 200, // Increased vertical spacing between rows
};

// Alternative positioning algorithms:
// 1. Grid Layout (current) - Simple grid with configurable spacing
// 2. Hierarchical Layout - Top-down tree structure
// 3. Force-directed Layout - Physics-based positioning
// 4. Circular Layout - Nodes arranged in circles
// 5. Dagre Layout - Directed graph layout (requires @dagrejs/dagre)
// 6. ELK Layout - Eclipse Layout Kernel (requires elkjs)

// Grid positioning function
const _getGridPosition = (index: number, nodesPerRow = 3) => {
	const x = (index % nodesPerRow) * (config.nodeWidth + config.nodeGap);
	const y =
		Math.floor(index / nodesPerRow) * (config.nodeHeight + config.levelGap);
	return { x, y };
};

// Hierarchical positioning function
const _getHierarchicalPosition = (index: number, level = 0) => {
	const nodesPerLevel = 2 ** level; // 1, 2, 4, 8, etc.
	const levelWidth = nodesPerLevel * (config.nodeWidth + config.nodeGap);
	const startX = -levelWidth / 2;
	const x =
		startX + (index % nodesPerLevel) * (config.nodeWidth + config.nodeGap);
	const y = level * (config.nodeHeight + config.levelGap);
	return { x, y };
};

// Circular positioning function
const _getCircularPosition = (
	index: number,
	totalNodes: number,
	radius = 300,
) => {
	const angle = (2 * Math.PI * index) / totalNodes;
	const x = radius * Math.cos(angle);
	const y = radius * Math.sin(angle);
	return { x, y };
};

// Staggered grid positioning function
const getStaggeredPosition = (index: number, nodesPerRow = 4) => {
	const row = Math.floor(index / nodesPerRow);
	const col = index % nodesPerRow;
	const staggerOffset = ((row % 2) * (config.nodeWidth + config.nodeGap)) / 2;
	const x = col * (config.nodeWidth + config.nodeGap) + staggerOffset;
	const y = row * (config.nodeHeight + config.levelGap);
	return { x, y };
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

	const createDataLineageNode = useCallback(
		(entity: any, _index: number): DataLineageNode => {
			return {
				id: entity.id,
				name: entity.name,
				type: entity.type === "table" ? "dataset" : "view",
				description: `${entity.namespace ? `${entity.namespace}.` : ""}${entity.name}`,
				metadata: {
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					tags: [],
					schema: entity.attrSeq
						? {
								fields: entity.attrSeq.map((attr: any) => ({
									name: attr.name,
									type: attr.type as
										| "string"
										| "number"
										| "boolean"
										| "date"
										| "timestamp"
										| "json"
										| "array",
									nullable: true,
									description: attr.comment,
								})),
							}
						: undefined,
				},
				position: { x: 0, y: 0 }, // Position will be set in flowNodes mapping
				status: entity.modified ? "active" : "inactive",
			};
		},
		[],
	);

	const flowNodes = useMemo(() => {
		if (!currentGraph?.entities || viewMode !== "graph") return [];

		// Limit nodes for performance - only render first 100 nodes
		const entitiesToRender = currentGraph.entities.slice(0, 100);

		return entitiesToRender.map((entity, index) => {
			// Choose positioning algorithm - change this to experiment with different layouts:
			// const { x, y } = getGridPosition(index, 3); // Grid with 3 nodes per row
			const { x, y } = getStaggeredPosition(index, 4); // Staggered grid
			// const { x, y } = getCircularPosition(index, entitiesToRender.length); // Circular
			// const { x, y } = getHierarchicalPosition(index, Math.floor(index / 4)); // Hierarchical

			// Current: Grid layout with increased spacing
			// const { x, y } = getGridPosition(index, 3); // 3 nodes per row with more spacing
			const node = createDataLineageNode(entity, index);

			return {
				id: entity.id,
				type: "dataLineageNode",
				position: { x, y },
				data: {
					node,
					selected: selectedNodes.includes(entity.id),
					width: config.nodeWidth,
					height: config.nodeHeight,
				},
				draggable: true,
				selectable: true,
				focusable: false,
			} as NodeWithData;
		});
	}, [currentGraph?.entities, selectedNodes, viewMode, createDataLineageNode]);

	const flowEdges = useMemo(() => {
		if (!currentGraph?.mappings || viewMode !== "graph") return [];

		// Limit mappings for performance - only render first 50 mappings
		const mappingsToRender = currentGraph.mappings.slice(0, 50);

		return mappingsToRender.flatMap(
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
						type: "straight" as const,
						data: {
							selected: isSelected,
						},
						style: {
							stroke: isSelected ? "#ff6b6b" : "#b1b1b7",
							strokeWidth: isSelected ? 3 : 1,
							strokeDasharray: undefined,
						},
						animated: false,
						interactionWidth: 20,
						focusable: false,
					} as EdgeWithData;
				}) || [],
		);
	}, [currentGraph?.mappings, selectedEdges, viewMode]);

	const translateExtent = useMemo(() => {
		if (flowNodes.length === 0) {
			return [
				[-config.translateMargin, -config.translateMargin],
				[config.translateMargin, config.translateMargin],
			] as [[number, number], [number, number]];
		}

		const maxX = Math.max(...flowNodes.map((n) => n.position.x));
		const maxY = Math.max(...flowNodes.map((n) => n.position.y));
		const px = Math.max(config.translateMargin, maxX + config.nodeWidth);
		const py = Math.max(config.translateMargin, maxY + config.nodeHeight);

		return [
			[-config.translateMargin, -config.translateMargin],
			[px, py],
		] as [[number, number], [number, number]];
	}, [flowNodes]);

	useEffect(() => {
		setNodes(flowNodes);
		setEdges(flowEdges);
		translateExtentRef.current = translateExtent;
	}, [flowNodes, flowEdges, translateExtent, setNodes, setEdges]);

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
