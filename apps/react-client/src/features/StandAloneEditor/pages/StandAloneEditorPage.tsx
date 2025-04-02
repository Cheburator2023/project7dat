import Editor, { DiffEditor } from "@monaco-editor/react";
import { useColorScheme } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { useCallback } from "react";

import { MainLayout } from "../../../common/layouts/MainLayout";
import { Spacer } from "../../../common/primitives/Spacer";
import { useJsonDiagramViewStore } from "../../jsonNodeEditor/store/json-diagram-view/json-diagram-view.store";
import { DEFAULT_STRINGIFIED_JSON } from "../../jsonNodeEditor/store/json-engine/json-engine.constant";
import { useJsonEngineStore } from "../../jsonNodeEditor/store/json-engine/json-engine.store";
import { isValidJson } from "../../jsonNodeEditor/utils/json.util";

export function StandAloneEditorPage() {
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
		<MainLayout>
			<Spacer space={100} />
			<Editor
				defaultLanguage="json"
				defaultValue={DEFAULT_STRINGIFIED_JSON}
				value={stringifiedJson}
				onChange={handleEditorChange}
				height="calc(100vh - 102px)"
				theme={mode === "dark" ? "vs-dark" : "light"}
			/>

			<Spacer />

			<DiffEditor
				height="calc(100vh - 102px)"
				theme={mode === "dark" ? "vs-dark" : "light"}
				language="json"
				original={DEFAULT_STRINGIFIED_JSON}
				modified={stringifiedJson}
			/>
		</MainLayout>
	);
}
