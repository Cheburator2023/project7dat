import { useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import type {
	Content,
	ContextMenuItem,
	Mode,
	RenderContextMenuContext,
} from "vanilla-jsoneditor";

import { Typography } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { generateObjectFromSchema } from "@react-client/utils/jsonGenerator";
import schema from "../../../../../../etc/json_schema.json";
import { VanillaJSONEditor } from "./VanillaJSONEditor";

const numEntities = 30;
const generatedObjects = generateObjectFromSchema(schema, numEntities);

export const JsonEditorSvelte = () => {
	const [showEditor, setShowEditor] = useState(true);
	const [readOnly, setReadOnly] = useState(false);
	const [content, setContent] = useState<{
		json?: any;
		text?: any;
	}>({
		json: generatedObjects,
		text: undefined,
	});

	const oldText = JSON.stringify(generatedObjects, null, 2);
	const newText = JSON.stringify(content.json, null, 2);

	const onChangeMode = (mode: Mode) => {
		if (mode === "text" || mode === "table") {
			setReadOnly(true);
		} else {
			setReadOnly(false);
		}
	};

	const onRenderContextMenu = (
		items: ContextMenuItem[],
		context: RenderContextMenuContext,
	): ContextMenuItem[] | false | undefined => {
		console.log("🐸 Pepe said >> JsonEditorSvelte >> items:", items);

		const menu = items;

		return items;
	};

	return (
		<div>
			<p>
				<label>
					<input
						type="checkbox"
						checked={showEditor}
						onChange={() => setShowEditor(!showEditor)}
					/>{" "}
					Show editor
				</label>
			</p>
			<p>
				<label>
					<input
						type="checkbox"
						checked={readOnly}
						onChange={() => setReadOnly(!readOnly)}
					/>{" "}
					Read only
				</label>
			</p>

			{showEditor && (
				<>
					<h2>Editor</h2>
					<div className="my-editor">
						<VanillaJSONEditor
							content={content as Content}
							readOnly={readOnly}
							onChange={setContent}
							onChangeMode={onChangeMode}
							onRenderContextMenu={onRenderContextMenu}
						/>
					</div>
				</>
			)}

			<Card>
				{newText ? (
					<ReactDiffViewer
						oldValue={oldText}
						newValue={newText}
						splitView={true}
						compareMethod={DiffMethod.CHARS}
						showDiffOnly
						leftTitle="old"
						rightTitle={"new"}
					/>
				) : (
					<Typography>Введите изменения</Typography>
				)}
			</Card>
		</div>
	);
};
