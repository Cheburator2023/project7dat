import { type Monaco, Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor as TEditor } from "@react-client/features/json4u/lib/editor/types";

export const MonacoJSONwithValidation = () => {
	const onMount = (editor: TEditor.IStandaloneCodeEditor, monaco: Monaco) => {
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
				{
					uri: "http://myserver/bar-schema.json", // id of the first schema
					schema: {
						type: "object",
						properties: {
							q1: {
								enum: ["x1", "x2"],
							},
						},
					},
				},
			],
		});
	};
	return (
		<MonacoEditor
			height="666px"
			language="json"
			value={JSON.stringify(
				{
					p1: "v3",
					p2: false,
				},
				null,
				2,
			)}
			onMount={onMount}
			onValidate={(markers) =>
				console.log("🚀 ~ MonacoJSONwithValidation ~ markers:", markers)
			}
		/>
	);
};
