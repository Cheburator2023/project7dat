import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { styled } from "@mui/system";
import { Flex } from "../../../common/primitives/Flex";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { AppNavbar } from "./AppNavbar";
import { CustomDatePicker } from "./CustomDatePicker";
import { MenuButton } from "./MenuButton";
import { NavbarBreadcrumbs } from "./NavbarBreadcrumbs";
import { Search } from "./Search";

export function Header({ setSideMenuOpen }: { setSideMenuOpen: () => void }) {
	const toggleDrawer: any = () => {
		setSideMenuOpen();
	};
	return (
		<>
			<AppNavbar setSideMenuOpen={() => toggleDrawer()} />
			<StyledFlex
				width="100%"
				pad="0 10px"
				gap={2}
				alignItems="center"
				justifyContent="space-between"
			>
				<Flex flexDirection="row" gap={10} alignItems="center">
					<MenuButton aria-label="menu" onClick={() => toggleDrawer()}>
						<MenuRoundedIcon />
					</MenuButton>
					<NavbarBreadcrumbs />
				</Flex>
				<Flex flexDirection="row" gap={2} alignItems="center">
					<Search />
					<CustomDatePicker />
					<MenuButton showBadge aria-label="Open notifications">
						<NotificationsRoundedIcon />
					</MenuButton>
					<ColorModeIconDropdown />
				</Flex>
			</StyledFlex>
		</>
	);
}

const StyledFlex = styled(Flex)`
	position: absolute;
	z-index: 1000;
	width: -moz-available;
	width: -webkit-fill-available;
	width: fill-available;
`;
