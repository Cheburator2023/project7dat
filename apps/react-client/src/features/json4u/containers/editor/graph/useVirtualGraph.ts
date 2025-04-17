import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import {
	config,
	initialViewport,
} from "@react-client/features/json4u/lib/graph/layout";
import type {
	EdgeWithData,
	NodeWithData,
} from "@react-client/features/json4u/lib/graph/types";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTreeVersion } from "@react-client/features/json4u/stores/treeStore";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import type { XYPosition } from "@xyflow/react";
import { maxBy } from "lodash-es";
import { useEffect, useRef } from "react";

import { useShallow } from "zustand/react/shallow";

const viewportSize: [number, number] = [0, 0];

export default function useVirtualGraph() {
	const treeVersion = useTreeVersion();
	// nodes and edges are not all that are in the graph, but rather the ones that will be rendered.
	const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

	const translateExtentRef = useRef<[[number, number], [number, number]]>([
		[-config.translateMargin, -config.translateMargin],
		[config.translateMargin, config.translateMargin],
	]);

	const { setViewport, getZoom } = useReactFlow();
	const { count, usable } = useUserStore(
		useShallow((state) => ({
			count: state.count,
			usable: state.usable("graphModeView"),
		})),
	);
	const { isGraphView, resetFoldStatus, setShowPricingOverlay } =
		useStatusStore(
			useShallow((state) => ({
				isGraphView: state.viewMode === ViewMode.Graph,
				resetFoldStatus: state.resetFoldStatus,
				setShowPricingOverlay: state.setShowPricingOverlay,
			})),
		);

	useEffect(() => {
		// @ts-ignore
		if (!(window.worker && isGraphView)) {
			// @ts-ignore
			console.l("skip graph render:", isGraphView, treeVersion);
			return;
		}

		if (!usable) {
			// @ts-ignore
			console.l("skip graph render because reach out of free quota.");
			setShowPricingOverlay(true);
			return;
		}

		(async () => {
			const {
				graph: { levelMeta },
				renderable: { nodes, edges },
				// @ts-ignore
			} = await window.worker.createGraph();

			setNodes(nodes);
			setEdges(edges);
			setViewport({ ...initialViewport, zoom: getZoom() });
			resetFoldStatus();

			const [w, h] = viewportSize;
			const px = Math.max(config.translateMargin, w / 2);
			const py = Math.max(config.translateMargin, h / 2);
			const maxX = maxBy<XYPosition>(levelMeta, "x")?.x ?? 0;
			const maxY = maxBy<XYPosition>(levelMeta, "y")?.y ?? 0;

			// fix https://github.com/xyflow/xyflow/issues/3633
			translateExtentRef.current = [
				[-px, -py],
				[maxX + px, maxY + py],
			];
			// @ts-ignore
			console.l(
				"create a new graph:",
				treeVersion,
				translateExtentRef.current,
				nodes.length,
				edges.length,
				nodes.slice(0, 10),
				edges.slice(0, 10),
			);
			nodes.length > 0 && count("graphModeView");
		})();
	}, [usable, isGraphView, treeVersion]);

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

export function setViewportSize(width: number, height: number) {
	if (width) {
		viewportSize[0] = width;
	}
	if (height) {
		viewportSize[1] = height;
	}
}
