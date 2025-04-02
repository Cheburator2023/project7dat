import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { Button } from "@mui/material";
import { styled } from "@mui/system";

import { Flex } from "../../../common/primitives/Flex";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { CustomDatePicker } from "../molecules/CustomDatePicker";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { AppNavbar } from "./AppNavbar";
import { Search } from "./Search";

interface HeaderProps {
	setSideMenuOpen: () => void;
	setJsonPreviewEditorOpen: () => void;
	jsonPreviewEditorOpen: boolean;
}

export function Header({
	setSideMenuOpen,
	setJsonPreviewEditorOpen,
	jsonPreviewEditorOpen,
}: HeaderProps) {
	const toggleDrawer = () => {
		setSideMenuOpen();
	};

	const toggleJsonPreviewEditor = () => {
		setJsonPreviewEditorOpen();
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
					<MenuButton showBadge aria-label="Open notifications">
						<NotificationsRoundedIcon />
					</MenuButton>
					<ColorModeIconDropdown />
					<Button
						variant="outlined"
						size="small"
						onClick={toggleJsonPreviewEditor}
					>
						{!jsonPreviewEditorOpen ? "Показать json" : "Скрыть json"}
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
