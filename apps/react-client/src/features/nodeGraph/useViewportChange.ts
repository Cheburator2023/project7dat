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
import { useDebounceFn } from "@react-client/common/json4u_leftovers/hooks";

const refreshInterval = 100;
const zoomRefreshInterval = 16; // ~60fps for smooth zoom
const dragRefreshInterval = 8; // ~120fps for ultra-smooth drag
const panRefreshInterval = 12; // ~80fps for smooth panning

export function useViewportChange(
	ref: RefObject<HTMLDivElement>,
	setNodes: Dispatch<SetStateAction<any[]>>,
	setEdges: Dispatch<SetStateAction<any[]>>,
) {
	const { setPan, setZoom } = useDataLineageStore(
		useShallow((state) => ({
			setPan: state.setPan,
			setZoom: state.setZoom,
		})),
	);

	const [lastZoom, setLastZoom] = useState<number>(1);
	const [lastPan, setLastPan] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const [isZooming, setIsZooming] = useState<boolean>(false);
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [dragStartTime, setDragStartTime] = useState<number>(0);

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

	// Separate handlers for zoom, pan, and drag for optimal performance
	const onZoomChange = useDebounceFn(
		async (zoom: number) => {
			setZoom(zoom);
			setIsZooming(false);
		},
		zoomRefreshInterval,
		[setZoom],
	);

	const onPanChange = useDebounceFn(
		async (viewport: { x: number; y: number }) => {
			setPan(viewport);
		},
		panRefreshInterval,
		[setPan],
	);

	// Ultra-fast drag handler for smooth dragging
	const onDragChange = useDebounceFn(
		async (viewport: { x: number; y: number }) => {
			setPan(viewport);
			setIsDragging(false);
		},
		dragRefreshInterval,
		[setPan],
	);

	const onViewportChange = useCallback(
		({ x, y, zoom }: { x: number; y: number; zoom: number }) => {
			const viewport = { x: -x, y: -y };
			const now = Date.now();

			// Handle zoom changes with higher frequency
			if (Math.abs(zoom - lastZoom) > 0.01) {
				setIsZooming(true);
				setLastZoom(zoom);
				onZoomChange(zoom);
				return; // Skip pan handling during zoom
			}

			// Detect movement for optimized handling
			const deltaX = viewport.x - lastPan.x;
			const deltaY = viewport.y - lastPan.y;
			const panDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			// Use faster pan handler for any movement to improve responsiveness
			if (panDistance > 1) {
				// Lower threshold for better responsiveness
				if (panDistance > 8) {
					// Rapid movement - likely drag operation
					if (!isDragging) {
						setIsDragging(true);
						setDragStartTime(now);
					}
					setLastPan(viewport);
					onDragChange(viewport); // Use ultra-fast drag handler
				} else {
					// Normal panning - use optimized pan handler
					if (isDragging && now - dragStartTime > 50) {
						setIsDragging(false);
					}
					setLastPan(viewport);
					console.log("🚀 ~ viewport:", viewport);

					onPanChange(viewport); // Use fast pan handler
				}
			} else {
				// Minimal movement - end drag state
				if (isDragging && now - dragStartTime > 50) {
					setIsDragging(false);
				}
				setLastPan(viewport);
			}
		},
		[
			lastZoom,
			lastPan,
			isDragging,
			dragStartTime,
			onZoomChange,
			onPanChange,
			onDragChange,
		],
	);

	useResizeObserver({ ref, onResize });
	useOnViewportChange({ onChange: onViewportChange });

	// Return interaction states for performance optimizations
	return { isZooming, isDragging };
}

export function useRevealNode(
	nodes: any[],
	_setNodes: Dispatch<SetStateAction<any[]>>,
	_setEdges: Dispatch<SetStateAction<any[]>>,
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
