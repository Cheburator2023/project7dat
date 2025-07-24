import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useDebounceFn } from "@react-client/features/json4u/lib/hooks";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import {
	type Dispatch,
	type RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import { useResizeObserver } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";
import type { EdgeWithData, NodeWithData } from "./useVirtualGraph";

const refreshInterval = 100;

export function useViewportChange(
	ref: RefObject<HTMLDivElement>,
	setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
	setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
	const { setPan, setZoom } = useDataLineageStore(
		useShallow((state) => ({
			setPan: state.setPan,
			setZoom: state.setZoom,
		})),
	);

	const onResize = useDebounceFn(
		async ({ width, height }) => {
			if (!(width && height)) {
				return;
			}
			console.log("Graph resized:", width, height);
		},
		refreshInterval,
		[setNodes, setEdges],
	);

	const onViewportChange = useDebounceFn(
		async ({ x, y, zoom }) => {
			const viewport = { x: -x, y: -y };
			setPan(viewport);
			setZoom(zoom);
			console.log("Viewport changed:", viewport, zoom);
		},
		refreshInterval,
		[setPan, setZoom],
	);

	useResizeObserver({ ref, onResize });
	useOnViewportChange({ onChange: onViewportChange });
}

export function useRevealNode(
	nodes: NodeWithData[],
	_setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
	_setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
	const { getZoom, setCenter } = useReactFlow();
	const { selectedNodes, currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			selectedNodes: state.selectedNodes,
			currentGraph: state.currentGraph,
		})),
	);

	const [_waitToReveal, _setWaitToReveal] = useState<string[]>([]);

	useEffect(() => {
		if (selectedNodes.length > 0 && currentGraph) {
			const nodeToReveal = selectedNodes[0];
			const node = nodes.find((n) => n.id === nodeToReveal);

			if (node) {
				const zoom = getZoom();
				setCenter(node.position.x, node.position.y, { duration: 500, zoom });
				console.log("Revealing node:", nodeToReveal, node.position);
			}
		}
	}, [selectedNodes, nodes, currentGraph, getZoom, setCenter]);
}

export function useClearSearchHl() {
	const { clearSelection } = useDataLineageStore(
		useShallow((state) => ({
			clearSelection: state.clearSelection,
		})),
	);

	return useCallback(
		(nodeId?: string) => {
			if (!nodeId) {
				clearSelection();
			}
		},
		[clearSelection],
	);
}
