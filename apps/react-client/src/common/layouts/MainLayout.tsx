import { styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";

import { Header } from "../../features/navigation/organisms/Header";
import { SideMenu } from "../../features/navigation/organisms/SideMenu";
import { Flex } from "../primitives/Flex";
import { useGlobalSettingsStore } from "../store/globalSettingsStore";

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

export function MainLayout({
	children,
	navbarVisible = true,
}: { children: React.ReactNode; navbarVisible?: boolean }) {
	const store = useGlobalSettingsStore();

	return (
		<Flex>
			<SideMenu open={store.isSideMenuVisible} />
			<MainWrapper open={store.isSideMenuVisible}>
				<Flex flexDirection="column" gap={2}>
					<Header navbarVisible={navbarVisible} />
					{children}
				</Flex>
			</MainWrapper>
		</Flex>
	);
}
