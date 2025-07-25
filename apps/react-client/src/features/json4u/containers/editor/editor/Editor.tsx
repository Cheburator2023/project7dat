import { Editor as MonacoEditor } from "@monaco-editor/react";
import { CircularProgress, useColorScheme } from "@mui/material";
import {
	EditorWrapper,
	type Kind,
} from "@react-client/features/json4u/lib/editor/editor";
import type { editor } from "@react-client/features/json4u/lib/editor/types";
import {
	useEditor,
	useEditorStore,
} from "@react-client/features/json4u/stores/editorStore";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { getTree } from "@react-client/features/json4u/stores/treeStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";

import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
	kind: Kind;
}

const defaultValue = ["{", "", "}"].join("\n");

export function Editor({ kind, ...props }: EditorProps) {
	const translations = useTranslations();
	const setEditor = useEditorStore((state) => state.setEditor);
	const setTranslations = useEditorStore((state) => state.setTranslations);
	const { mode } = useColorScheme();
	const _editorRef = useRef<editor.IStandaloneCodeEditor>(null);
	const _restrictions = [];

	useRevealNode();

	return (
		<MonacoEditor
			language="json"
			loading={<CircularProgress />}
			theme={mode === "dark" ? "vs-dark" : "light"}
			defaultValue={defaultValue}
			options={{
				fontSize: 12,
				scrollBeyondLastLine: true,
				automaticLayout: true,
				wordWrap: "on",
				minimap: { enabled: true },
				stickyScroll: {
					enabled: true,
					defaultModel: "foldingProviderModel",
				},
			}}
			onMount={(editor, monaco) => {
				console.log("🐸 Pepe said >> monaco:", monaco);

				monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [
						{
							uri: "http://myserver/foo-schema.json", // id of the first schema
							fileMatch: ["*"], // associate with our model
							schema: {
								type: "object",
								properties: {
									summer: { type: "integer" },
									winter: { type: "integer" },
									xmas: { type: "integer" },
								},
								required: ["summer", "winter", "xmas"],
								// properties: {
								//   p1: {
								//     enum: ["v1", "v2"],
								//   },
								//   p2: {
								//     $ref: "http://myserver/bar-schema.json", // reference the second schema
								//   },
								// },
							},
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
				// used for e2e tests.
				window.monacoApi[kind] = editor;

				const wrapper = new EditorWrapper(editor, kind);
				wrapper.init();
				setEditor(wrapper);
				setTranslations(translations);
				console.log(`finished initial editor ${kind}:`, wrapper);
			}}
			{...props}
		/>
	);
}

// reveal position in text
export function useRevealNode() {
	const editor = useEditor("main");
	const { isNeedReveal, revealPosition } = useStatusStore(
		useShallow((state) => ({
			isNeedReveal: state.isNeedReveal("editor"),
			revealPosition: state.revealPosition,
		})),
	);

	useEffect(() => {
		const { treeNodeId, type } = revealPosition;

		if (editor && isNeedReveal && treeNodeId) {
			const node = getTree().node(treeNodeId);
			if (node) {
				editor.revealOffset(
					(type === "key" ? node.boundOffset : node.offset) + 1,
				);
			}
		}
	}, [editor, revealPosition, isNeedReveal]);
}
