import Box from "@mui/material/Box";
import { alpha, styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { useState } from "react";

import { Header } from "../../features/navigation/organisms/Header";
import { SideMenu } from "../../features/navigation/organisms/SideMenu";
import { Flex } from "../primitives/Flex";

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

export function MainLayout({ children }: { children: React.ReactNode }) {
	const [sideMenuOpen, setSideMenuOpen] = useState(true);
	const [jsonPreviewEditorOpen, setJsonPreviewEditorOpen] = useState(true);

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
						{children}
					</Flex>
				</Box>
			</MainWrapper>
		</Flex>
	);
}
