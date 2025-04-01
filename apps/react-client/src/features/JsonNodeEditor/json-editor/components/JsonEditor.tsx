import Editor from "@monaco-editor/react";
import { useColorScheme } from "@mui/material";
import { useCallback } from "react";

import { useJsonDiagramViewStore } from "../../store/json-diagram-view/json-diagram-view.store";
import { DEFAULT_STRINGIFIED_JSON } from "../../store/json-engine/json-engine.constant";
import { useJsonEngineStore } from "../../store/json-engine/json-engine.store";
import { isValidJson } from "../../utils/json.util";
import { JsonEditorConsole } from "./JsonEditorConsole";
import { JsonValidityStatus } from "./JsonValidityStatus";

// TODO: useDefferedValue hook to optimize?
const _JsonEditor = () => {
	const [stringifiedJson, setStringifiedJson] = useJsonEngineStore((state) => [
		state.stringifiedJson,
		state.setStringifiedJson,
	]);
	const resetSelectedNode = useJsonDiagramViewStore(
		(state) => state.resetSelectedNode,
	);

	const { mode, systemMode, setMode } = useColorScheme();

	const handleEditorChange = useCallback(
		(value: string | undefined) => {
			if (value === undefined) return;

			setStringifiedJson(value);

			if (isValidJson(value)) {
				resetSelectedNode();
			}
		},
		[setStringifiedJson, resetSelectedNode],
	);

	return (
		<div className="relative h-full w-full">
			<Editor
				theme={mode === "dark" ? "vs-dark" : "light"}
				defaultLanguage="json"
				options={{
					minimap: {
						enabled: false,
					},
					scrollbar: {
						horizontal: "hidden",
					},
					overviewRulerLanes: 0,
				}}
				defaultValue={DEFAULT_STRINGIFIED_JSON}
				value={stringifiedJson}
				onChange={handleEditorChange}
			/>

			<JsonValidityStatus />

			<JsonEditorConsole />
		</div>
	);
};

export const JsonEditor = _JsonEditor;
