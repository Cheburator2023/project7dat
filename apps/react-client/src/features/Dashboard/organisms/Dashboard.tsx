import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { alpha, styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { useState } from "react";
import { Flex } from "../../../common/primitives/Flex";
import { Header } from "../molecules/Header";
import { SideMenu } from "../molecules/SideMenu";
import { MainGrid } from "./MainGrid";

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

export function Dashboard(props: { disableCustomTheme?: boolean }) {
	const [sideMenuOpen, setSideMenuOpen] = useState(false);

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
					<Stack
						spacing={2}
						sx={{
							alignItems: "center",
							mx: 0,
							pb: 5,
							mt: { xs: 8, md: 0 },
						}}
					>
						<Header setSideMenuOpen={() => setSideMenuOpen(!sideMenuOpen)} />
						<MainGrid />
					</Stack>
				</Box>
			</MainWrapper>
		</Flex>
	);
}
