import { Typography, styled, useColorScheme } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { generateObjectFromSchema } from "@react-client/utils/jsonGenerator";
import { JsonEditor, githubDarkTheme, githubLightTheme } from "json-edit-react";
import { useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { BooleanToggleDefinition } from "@react-client/features/jsonEditor/molecules/BooleanToggleComponent";
import schema from "../../../../../../etc/json_schema.json";

const EMPTY_HUNKS: any[] = [];

const numEntities = 30;
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

	return (
		<Wrapper>
			<Card maxHeight={"500px"}>
				<JsonEditor
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
			</Card>
			<Spacer />
			<Card>
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
			</Card>
		</Wrapper>
	);
}

const Wrapper = styled(Flex)`
	#wrapper {
	counter-reset: line-number;
	}
	.jer-collection-inner .jer-collection-element {
	counter-increment: line-number;
	}
	.jer-collection-inner .jer-collection-element:before {
	content: counter(line-number)": ";
	}
`;
