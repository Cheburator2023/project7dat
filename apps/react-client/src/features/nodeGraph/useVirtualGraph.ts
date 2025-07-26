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

		const flowNodes: NodeWithData[] = currentGraph.entities.map(
			(entity, index) => {
				const x = (index % 4) * (config.nodeWidth + config.nodeGap);
				const y = Math.floor(index / 4) * (config.nodeHeight + config.levelGap);

				const node: DataLineageNode = {
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
									fields: entity.attrSeq.map((attr) => ({
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
					position: { x, y },
					status: entity.modified ? "active" : "inactive",
				};

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
				};
			},
		);

		const flowEdges: EdgeWithData[] = currentGraph.mappings.flatMap(
			(mapping) =>
				mapping.deps?.map((dep) => ({
					id: `${mapping.entityId}-${dep.entityId}`,
					source: dep.entityId,
					target: mapping.entityId,
					type: "smoothstep" as const,
					data: {
						selected: selectedEdges.includes(
							`${mapping.entityId}-${dep.entityId}`,
						),
					},
					style: {
						stroke: selectedEdges.includes(
							`${mapping.entityId}-${dep.entityId}`,
						)
							? "#ff6b6b"
							: "#b1b1b7",
						strokeWidth: selectedEdges.includes(
							`${mapping.entityId}-${dep.entityId}`,
						)
							? 3
							: 1,
					},
				})) || [],
		);

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
