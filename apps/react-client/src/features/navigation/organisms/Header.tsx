import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { Button } from "@mui/material";
import { styled } from "@mui/system";

import { Flex } from "../../../common/primitives/Flex";
import { useGlobalSettingsStore } from "../../../common/store/globalSettingsStore";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { CustomDatePicker } from "../molecules/CustomDatePicker";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { AppNavbar } from "./AppNavbar";
import { Search } from "./Search";

export function Header() {
	const store = useGlobalSettingsStore();

	const toggleDrawer = () => {
		store.toggleSideMenu();
	};

	const toggleJsonPreviewEditor = () => {
		store.toggleJsonPreview();
	};

	return (
		<>
			<AppNavbar setSideMenuOpen={() => toggleDrawer()} />
			<StyledFlex
				width="100%"
				pad="10px 10px"
				gap={2}
				alignItems="center"
				justifyContent="space-between"
				position="absolute"
				zIndex={1000}
			>
				<Flex flexDirection="row" gap={10} alignItems="center">
					<MenuButton aria-label="menu" onClick={toggleDrawer}>
						<MenuRoundedIcon />
					</MenuButton>
					<NavbarBreadcrumbs />
				</Flex>
				<Flex flexDirection="row" gap={6} alignItems="center">
					<Search />
					<CustomDatePicker />
					<ColorModeIconDropdown />
					<Button variant="outlined" size="small" onClick={store.toggleMinimap}>
						{!store.isMinimapVisible
							? "Показать мини-карту"
							: "Скрыть мини-карту"}
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={toggleJsonPreviewEditor}
					>
						{!store.isJsonPreviewVisible ? "Показать json" : "Скрыть json"}
					</Button>
				</Flex>
			</StyledFlex>
		</>
	);
}

const StyledFlex = styled(Flex)`
	width: -moz-available;
	width: -webkit-fill-available;
	width: fill-available;
`;
