import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { styled } from "@mui/system";
import { Card } from "@react-client/common/muiCustom/Card";
import { ExportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ExportPopover";
import { ImportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ImportPopover";
import { PopoverBtn } from "@react-client/features/json4u/containers/editor/sidenav/PopoverButton";
import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { Search } from "@react-client/features/navigation/organisms/Search";
import { Download, FileUp } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Flex } from "../../../common/primitives/Flex";
import { useGlobalSettingsStore } from "../../../common/store/globalSettingsStore";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { CustomDatePicker } from "../molecules/CustomDatePicker";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { AppNavbar } from "./AppNavbar";

export function Header({ navbarVisible = true }) {
	const { toggleSideMenu } = useGlobalSettingsStore();

	const {
		sideNavExpanded,
		setSideNavExpanded,
		fixSideNav,
		setFixSideNav,
		viewMode,
		enableAutoFormat,
		enableAutoSort,
		enableNestParse,
		setParseOptions,
		enableSyncScroll,
		setEnableSyncScroll,
	} = useStatusStore(
		useShallow((state) => {
			const parseOptions = state.parseOptions;
			return {
				viewMode: state.viewMode,
				sideNavExpanded: !!state.sideNavExpanded,
				setSideNavExpanded: state.setSideNavExpanded,
				fixSideNav: state.fixSideNav,
				setFixSideNav: state.setFixSideNav,
				enableAutoFormat: !!parseOptions.format,
				enableAutoSort: !!parseOptions.sort,
				enableNestParse: !!parseOptions.nest,
				setParseOptions: state.setParseOptions,
				enableSyncScroll: state.enableSyncScroll,
				setEnableSyncScroll: state.setEnableSyncScroll,
			};
		}),
	);

	return (
		<>
			<AppNavbar />
			<Card padding="2px 3px">
				<StyledFlex
					width="100%"
					pad="2px 3px"
					gap={2}
					alignItems="center"
					justifyContent="space-between"
					position="relative"
					zIndex={1000}
				>
					<Flex flexDirection="row" gap={10} alignItems="center">
						<MenuButton aria-label="menu" onClick={() => toggleSideMenu()}>
							<MenuRoundedIcon />
						</MenuButton>
						<NavbarBreadcrumbs />
					</Flex>
					{navbarVisible ? (
						<Flex flexDirection="row" gap={6} alignItems="center">
							{viewMode === ViewMode.Graph && <Search />}

							<Flex alignItems="center" gap={6}>
								<PopoverBtn
									title={"Импорт"}
									icon={<FileUp className="icon" />}
									content={<ImportPopover />}
								/>
								<PopoverBtn
									title={"Экспорт"}
									icon={<Download className="icon" />}
									content={<ExportPopover />}
								/>
							</Flex>

							<CustomDatePicker />
							<ColorModeIconDropdown />
						</Flex>
					) : (
						<ColorModeIconDropdown />
					)}
				</StyledFlex>
			</Card>
		</>
	);
}

const StyledFlex = styled(Flex)`
	width: -moz-available;
	width: -webkit-fill-available;
	width: fill-available;
`;
