import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
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
import { useDebounceFn } from "@react-client/common/json4u_leftovers/hooks";

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
	const { selectedNodes, currentGraph, isNeedReveal, enableSyncScroll } =
		useDataLineageStore(
			useShallow((state) => ({
				selectedNodes: state.selectedNodes,
				currentGraph: state.currentGraph,
				isNeedReveal: state.isNeedReveal,
				enableSyncScroll: state.enableSyncScroll,
			})),
		);

	const [lastRevealedNode, setLastRevealedNode] = useState<string | null>(null);

	// Debounced reveal function to prevent excessive calls
	const debouncedReveal = useDebounceFn(
		async (nodeToReveal: string, nodePosition: { x: number; y: number }) => {
			if (lastRevealedNode === nodeToReveal) return;

			const zoom = getZoom();
			// Reduce animation duration for better performance
			setCenter(nodePosition.x, nodePosition.y, { duration: 200, zoom });
			setLastRevealedNode(nodeToReveal);
			console.log("Revealing node:", nodeToReveal, nodePosition);
		},
		200, // Debounce delay
		[getZoom, setCenter, lastRevealedNode],
	);

	useEffect(() => {
		// Only reveal if sync scroll is enabled and reveal is needed from graph
		if (
			selectedNodes.length > 0 &&
			currentGraph &&
			enableSyncScroll &&
			isNeedReveal("graph")
		) {
			const nodeToReveal = selectedNodes[0];
			const node = nodes.find((n) => n.id === nodeToReveal);

			if (node && nodeToReveal !== lastRevealedNode) {
				debouncedReveal(nodeToReveal, node.position);
			}
		}
	}, [
		selectedNodes,
		nodes,
		currentGraph,
		enableSyncScroll,
		isNeedReveal,
		lastRevealedNode,
		debouncedReveal,
	]);
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
