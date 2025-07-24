import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { findNodePositionInJson } from "../utils/jsonPosition";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

export function useRevealNode(editor: any, jsonText: string) {
	const { isNeedReveal, revealPosition, currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			isNeedReveal: state.isNeedReveal("editor"),
			revealPosition: state.revealPosition,
			currentGraph: state.currentGraph,
		})),
	);

	useEffect(() => {
		const { nodeId } = revealPosition;

		if (editor && isNeedReveal && nodeId && currentGraph) {
			const position = findNodePositionInJson(jsonText, nodeId, currentGraph);
			if (position) {
				const pos = { lineNumber: position.line, column: position.column };
				editor.setPosition(pos);
				editor.revealPositionInCenter(pos);
				editor.focus();
			}
		}
	}, [editor, revealPosition, isNeedReveal, jsonText, currentGraph]);
}
