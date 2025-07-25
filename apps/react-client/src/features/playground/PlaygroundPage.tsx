import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { JsonEditorSvelte } from "@react-client/features/playground/jsonEditor/organisms/JsonEditorSvelte";
import { JsonEditorWithDiff } from "@react-client/features/playground/jsonEditor/organisms/JsonEditorWithDiff";
import { MonacoJSONwithValidation } from "@react-client/features/playground/MonacoJSONwithValidation";
import { SyncDemo } from "@react-client/features/syncDemo";

const data = [
	{ name: "SyncDemo", Component: SyncDemo },
	{ name: "JsonEditorWithDiff", Component: JsonEditorWithDiff },
	{ name: "JsonEditorSvelte", Component: JsonEditorSvelte },
	{ name: "MonacoJSONwithValidation", Component: MonacoJSONwithValidation },
];

export const PlaygroundPage = () => {
	return (
		<div>
			<Header />
			<Flex flexDirection="column" gap={8}>
				{data.map((item) => (
					<Card key={item.name}>
						<item.Component />
					</Card>
				))}
			</Flex>
		</div>
	);
};
