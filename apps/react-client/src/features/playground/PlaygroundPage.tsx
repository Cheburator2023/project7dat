import { Typography } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { CodeEditorDemo } from "@react-client/features/codeEditor";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { JsonEditorSvelte } from "@react-client/features/playground/jsonEditor/organisms/JsonEditorSvelte";
import { JsonEditorWithDiff } from "@react-client/features/playground/jsonEditor/organisms/JsonEditorWithDiff";
import { MonacoJSONwithValidation } from "@react-client/features/playground/MonacoJSONwithValidation";
import { SyncDemo } from "@react-client/features/syncDemo";
import { Fragment } from "react/jsx-runtime";

const data = [
	{ name: "CodeEditorDemo", Component: CodeEditorDemo },
	{ name: "SyncDemo", Component: SyncDemo },
	{ name: "JsonEditorWithDiff", Component: JsonEditorWithDiff },
	{ name: "JsonEditorSvelte", Component: JsonEditorSvelte },
	{ name: "MonacoJSONwithValidation", Component: MonacoJSONwithValidation },
];

export const PlaygroundPage = () => {
	return (
		<div>
			<Header />
			<Flex sx={{ padding: "40px" }} flexDirection="column">
				<Typography variant="h1">
					<b>Плейграунд</b>
				</Typography>

				<Spacer />

				{data.map((item) => (
					<Fragment key={item.name}>
						<Card>
							<Typography variant="h2">{item.name}</Typography>
							<Spacer />
							<item.Component />
						</Card>
						<Spacer />
					</Fragment>
				))}

				<Spacer />
			</Flex>
		</div>
	);
};
