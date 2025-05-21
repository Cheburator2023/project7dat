import { styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";

import { Spacer } from "@react-client/common/primitives/Spacer";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import { BottomBar } from "@react-client/features/navigation/organisms/BottomBar";
import { Header } from "../../features/navigation/organisms/Header";
import { SideMenu } from "../../features/navigation/organisms/SideMenu";
import { Flex } from "../primitives/Flex";

const MainWrapper = styled("div", {
	shouldForwardProp: (prop) => prop !== "open",
})<{
	open?: boolean;
}>(({ theme }) => ({
	flexGrow: 1,
	padding: 6,
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
		<Flex id="main_layout_container">
			<SideMenu open={store.isSideMenuVisible} />

			<MainWrapper id="main_layout_content" open={store.isSideMenuVisible}>
				<Spacer height={6} />
				<Header navbarVisible={navbarVisible} />
				<Spacer height={12} />
				{children}
			</MainWrapper>

			<BottomBar />
		</Flex>
	);
}
