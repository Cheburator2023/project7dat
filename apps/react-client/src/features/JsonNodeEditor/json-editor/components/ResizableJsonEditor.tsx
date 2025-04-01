"use client";

import { Resizable } from "re-resizable";
import { useJsonEditorViewStore } from "../../store/json-editor-view/json-editor-view.store";
import { JsonEditor } from "./JsonEditor";

export const ResizableJsonEditor = () => {
	const isJsonEditorVisible = useJsonEditorViewStore(
		(state) => state.isJsonEditorVisible,
	);

	return (
		<Resizable
			style={{
				overflow: "hidden",
				display: isJsonEditorVisible ? "initial" : "none",
			}}
			defaultSize={{
				width: 320,
				height: "100%",
			}}
			minWidth={272}
			maxWidth={
				typeof window !== "undefined" ? window.innerWidth / 2 : undefined
			}
			enable={{
				right: true,
			}}
		>
			<JsonEditor />
		</Resizable>
	);
};
