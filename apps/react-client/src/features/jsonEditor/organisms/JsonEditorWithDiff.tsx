import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Typography, styled, useColorScheme } from "@mui/material";
import { JsonEditor, githubDarkTheme, githubLightTheme } from "json-edit-react";
import { useEffect, useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

import { Flex } from "@react-client/common/primitives/Flex";
import { useEditor } from "@react-client/features/json4u/stores/editorStore";
import { BooleanToggleDefinition } from "@react-client/features/jsonEditor/molecules/BooleanToggleComponent";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
// import schema from "../../../../../../etc/json_schema.json";

const EMPTY_HUNKS: any[] = [];

export function JsonEditorWithDiff() {
	const main = useEditor("main");

	const [newDataSet, setNewData] = useState();
	const { mode } = useColorScheme();

	const handleUpdate = ({
		currentData,
		currentValue,
		newValue,
		newData,
		path,
	}: any) => {
		console.log("🚀 ~ JsonEditorWithDiff ~ path:", path);
		setNewData(newData);
	};

	const data = JSON.parse(main?.tree.text || "{}");
	const oldText = main?.tree.text || "";
	const newText = JSON.stringify(newDataSet, null, 2);

	const handleEdit = ({
		currentData,
		currentValue,
		newValue,
		newData,
		path,
	}: any) => {
		console.log("handleEdit", {
			currentData,
			currentValue,
			newValue,
			newData,
			path,
		});
	};

	const handleClick = (clickArrgs: any) => {
		console.log("clickedArrgs", clickArrgs);
	};

	useEffect(() => {
		console.log("🚀 ~ JsonEditorWithDiff ~ main:", main);
	}, [main?.tree.text]);

	return (
		<Wrapper id="json_editor_wrapper">
			<PanelGroup
				autoSaveId="JsonEditorWithDiff"
				direction="horizontal"
				style={{ height: "inherit" }}
			>
				<Panel id="json_editor_panel" style={{ height: "inherit" }}>
					<JsonEditor
						id="json_editor_main_component"
						data={data}
						onUpdate={handleUpdate}
						// onEdit={handleEdit}
						theme={mode === "dark" ? githubDarkTheme : githubLightTheme}
						restrictDelete={true}
						rootFontSize={12}
						restrictAdd={true}
						collapseAnimationTime={100}
						maxWidth="100%"
						rootName=""
						restrictEdit={(props) => {
							const onlyPrimitiveVals =
								typeof props.value === "object" ||
								typeof props.value === "function";

							return onlyPrimitiveVals;
						}}
						enableClipboard={false}
						restrictTypeSelection={(inputProps) => {
							if (typeof inputProps.value === "boolean") return ["boolean"];
							if (typeof inputProps.value === "string") return ["string"];
							if (typeof inputProps.value === "number") return ["number"];
							return ["string", "number", "boolean"]; // no "null"
						}}
						customNodeDefinitions={[BooleanToggleDefinition]}
					/>
				</Panel>
				<PanelResizeHandleStyled>
					<DragIndicatorIcon />
				</PanelResizeHandleStyled>
				<Panel minSize={30}>
					{newText ? (
						<ReactDiffViewer
							oldValue={oldText}
							newValue={newText}
							splitView={true}
							compareMethod={DiffMethod.CHARS}
							useDarkTheme={mode === "dark"}
							showDiffOnly
							leftTitle="old"
							rightTitle="new"
						/>
					) : (
						<Flex
							width="100%"
							height="100%"
							alignItems="center"
							justifyContent="center"
						>
							<Typography>Введите изменения</Typography>
						</Flex>
					)}
				</Panel>
			</PanelGroup>
		</Wrapper>
	);
}

const Wrapper = styled(Flex)`
	height: 100%;

	#wrapper {
	counter-reset: line-number;
	}

	.jer-editor-container  {
		overflow: auto;
		max-height: inherit;
		height: 100%;
	}
	.jer-collection-inner .jer-collection-element {
	counter-increment: line-number;
	}
	.jer-collection-inner .jer-collection-element:before {
	content: counter(line-number)": ";
	}
`;

const PanelResizeHandleStyled = styled(PanelResizeHandle)<{
	vertical?: boolean;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 18px;

	svg {
		${(props) => (props.vertical ? "transform: rotate(90deg); height: 100%;" : "width: 100%;")}
	}

	${(props) => props.vertical && "width: 100%; height: 18px;"}
`;
