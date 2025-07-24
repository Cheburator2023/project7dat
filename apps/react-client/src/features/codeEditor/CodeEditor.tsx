import { Editor as MonacoEditor } from "@monaco-editor/react";
import { CircularProgress, useColorScheme } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useRevealNode } from "./hooks/useRevealNode";
import { findNodeByPosition } from "./utils/jsonPosition";
import { debounce } from "lodash-es";

import {
	type ComponentPropsWithoutRef,
	useRef,
	useMemo,
	useCallback,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { dataLineageSchema } from "@react-client/schemas";

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
	readOnly?: boolean;
}

export function CodeEditor({ readOnly = false, ...props }: EditorProps) {
	const { mode } = useColorScheme();
	const editorRef = useRef<any>(null);

	const {
		currentGraph,
		selectedNodes,
		importGraph,
		selectNode,
		setRevealPosition,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
			importGraph: state.importGraph,
			selectNode: state.selectNode,
			setRevealPosition: state.setRevealPosition,
		})),
	);

	const editorValue = useMemo(() => {
		if (!currentGraph) return "{}";
		return JSON.stringify(currentGraph, null, 2);
	}, [currentGraph]);

	useRevealNode(editorRef.current, editorValue);

	const handleCursorPositionChange = useCallback(
		debounce((e: any) => {
			if (!editorRef.current || !currentGraph) return;

			const { lineNumber, column } = e.position;
			const nodeId = findNodeByPosition(
				editorValue,
				{ line: lineNumber, column },
				currentGraph,
			);

			if (nodeId && !selectedNodes.includes(nodeId)) {
				selectNode(nodeId);
				setRevealPosition({ nodeId, from: "editor" });
			}
		}, 200),
		[editorValue, currentGraph, selectedNodes, selectNode, setRevealPosition],
	);

	const handleEditorChange = async (value: string | undefined) => {
		if (readOnly || !value) return;

		try {
			const _parsedData = JSON.parse(value);
			await importGraph(value, "json");
		} catch (error) {
			console.warn("Invalid JSON in editor:", error);
		}
	};

	return (
		<MonacoEditor
			language="json"
			loading={<CircularProgress />}
			theme={mode === "dark" ? "vs-dark" : "light"}
			value={editorValue}
			onChange={handleEditorChange}
			options={{
				fontSize: 12,
				scrollBeyondLastLine: true,
				automaticLayout: true,
				wordWrap: "on",
				minimap: { enabled: true },
				readOnly,
				stickyScroll: {
					enabled: true,
					defaultModel: "foldingProviderModel",
				},
			}}
			onMount={(editor, monaco) => {
				monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [
						{
							uri: "http://data-lineage-schema.json",
							fileMatch: ["*"],
							schema: dataLineageSchema,
						},
					],
				});

				if (!window.monacoApi) {
					window.monacoApi = {
						KeyCode: monaco.KeyCode,
						MinimapPosition: monaco.editor.MinimapPosition,
						OverviewRulerLane: monaco.editor.OverviewRulerLane,
						Range: monaco.Range,
						RangeFromPositions: monaco.Range.fromPositions,
					};
				}

				editorRef.current = editor;

				editor.onDidChangeCursorPosition(handleCursorPositionChange);

				console.log("Data lineage editor initialized:", editor);
			}}
			{...props}
		/>
	);
}
