import Editor from "@monaco-editor/react";

import Box from "@mui/material/Box";
import { alpha, styled, useColorScheme } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { useCallback, useState } from "react";
import { Flex } from "../../../common/primitives/Flex";
import { Spacer } from "../../../common/primitives/Spacer";
import { Header } from "../../Dashboard/molecules/Header";
import { SideMenu } from "../../Dashboard/molecules/SideMenu";
import { useJsonDiagramViewStore } from "../../JsonNodeEditor/store/json-diagram-view/json-diagram-view.store";
import { DEFAULT_STRINGIFIED_JSON } from "../../JsonNodeEditor/store/json-engine/json-engine.constant";
import { useJsonEngineStore } from "../../JsonNodeEditor/store/json-engine/json-engine.store";
import { isValidJson } from "../../JsonNodeEditor/utils/json.util";

const MainWrapper = styled("div", {
	shouldForwardProp: (prop) => prop !== "open",
})<{
	open?: boolean;
}>(({ theme }) => ({
	flexGrow: 1,
	padding: 0,
	transition: theme.transitions.create("margin", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	marginLeft: `-${240}px`,
	variants: [
		{
			props: ({ open }) => open,
			style: {
				transition: theme.transitions.create("margin", {
					easing: theme.transitions.easing.easeOut,
					duration: theme.transitions.duration.enteringScreen,
				}),
				marginLeft: 0,
			},
		},
	],
}));

export function StandAloneEditorPage() {
	const [sideMenuOpen, setSideMenuOpen] = useState(true);
	const [jsonPreviewEditorOpen, setJsonPreviewEditorOpen] = useState(true);

	const [stringifiedJson, setStringifiedJson] = useJsonEngineStore((state) => [
		state.stringifiedJson,
		state.setStringifiedJson,
	]);
	const resetSelectedNode = useJsonDiagramViewStore(
		(state) => state.resetSelectedNode,
	);

	const { mode, systemMode, setMode } = useColorScheme();
	console.log("🐸 Pepe said >> StandAloneEditorPage >> mode:", mode);

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
		<Flex>
			<SideMenu open={sideMenuOpen} />
			<MainWrapper open={sideMenuOpen}>
				<Box
					component="main"
					sx={(theme) => ({
						flexGrow: 1,
						backgroundColor: theme.vars
							? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
							: alpha(theme.palette.background.default, 1),
						overflow: "auto",
					})}
				>
					<Flex flexDirection="column" gap={2}>
						<Header
							jsonPreviewEditorOpen={jsonPreviewEditorOpen}
							setJsonPreviewEditorOpen={() =>
								setJsonPreviewEditorOpen(!jsonPreviewEditorOpen)
							}
							setSideMenuOpen={() => setSideMenuOpen(!sideMenuOpen)}
						/>
						<Spacer space={100} />
						<Editor
							height="calc(100vh - 102px)"
							theme={mode === "dark" ? "vs-dark" : "light"}
							defaultLanguage="json"
							defaultValue={DEFAULT_STRINGIFIED_JSON}
							value={stringifiedJson}
							onChange={handleEditorChange}
						/>
					</Flex>
				</Box>
			</MainWrapper>
		</Flex>
	);
}
