import { Typography } from "@mui/material";
import { MainLayout } from "@react-client/common/layouts/MainLayout";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { JsonEditorSvelte } from "@react-client/features/jsonEditor/organisms/JsonEditorSvelte";
import { JsonEditorWithDiff } from "@react-client/features/jsonEditor/organisms/JsonEditorWithDiff";
import { Fragment } from "react/jsx-runtime";

const data = [
	{ name: "JsonEditorWithDiff", Component: JsonEditorWithDiff },
	{ name: "JsonEditorSvelte", Component: JsonEditorSvelte },
];

export const PlaygroundPage = () => {
	return (
		<MainLayout navbarVisible={false}>
			<Flex sx={{ padding: "40px" }} flexDirection="column">
				<Typography variant="h1">
					<b>Плейграунд</b>
				</Typography>
				<Spacer />

				{data.map((item) => (
					<Fragment key={item.name}>
						<div>
							<Typography variant="h2">{item.name}</Typography>
							<Spacer />
							<item.Component />
						</div>
						<Spacer />
					</Fragment>
				))}

				<Spacer />
			</Flex>
		</MainLayout>
	);
};
