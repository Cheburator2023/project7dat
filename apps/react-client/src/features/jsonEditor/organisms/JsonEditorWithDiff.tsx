import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Typography, styled, useColorScheme } from "@mui/material";
import { generateObjectFromSchema } from "@react-client/utils/jsonGenerator";
import { JsonEditor, githubDarkTheme, githubLightTheme } from "json-edit-react";
import { useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

import { Flex } from "@react-client/common/primitives/Flex";
import { BooleanToggleDefinition } from "@react-client/features/jsonEditor/molecules/BooleanToggleComponent";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useNavigate } from "react-router";
import schema from "../../../../../../etc/json_schema.json";

const EMPTY_HUNKS: any[] = [];

const numEntities = 8;
const generatedObjects = generateObjectFromSchema(schema, numEntities);

const dummyData = generatedObjects;

export function JsonEditorWithDiff() {
	const [newDataSet, setNewData] = useState();
	const { mode } = useColorScheme();

	const handleUpdate = ({
		currentData,
		currentValue,
		newValue,
		newData,
		path,
	}: any) => {
		setNewData(newData);
	};

	const oldText = JSON.stringify(dummyData, null, 2);
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

	const navigate = useNavigate();

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
						data={dummyData}
						onUpdate={handleUpdate}
						// onEdit={handleEdit}
						theme={mode === "dark" ? githubDarkTheme : githubLightTheme}
						restrictDelete={true}
						rootFontSize={12}
						restrictAdd={true}
						collapseAnimationTime={100}
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
							rightTitle={"new"}
						/>
					) : (
						<Typography>Введите изменения</Typography>
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
