import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { Button } from "@mui/material";
import { styled } from "@mui/system";
import { useConfigFromCookies } from "@react-client/features/json4u/stores/hook";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import {
	AlignHorizontalJustifyCenter,
	ArrowDownNarrowWide,
	ArrowLeftToLine,
	ArrowRightFromLine,
	BarChartBig,
	Braces,
	MessageCircleQuestion,
	Share2,
	SquareStack,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Spacer } from "@react-client/common/primitives/Spacer";
import { ViewSearchInput } from "@react-client/features/json4u/components/ui/search/ViewSearchInput";
import { RightPanel } from "@react-client/features/json4u/containers/editor/RightPanel";
import { ExportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ExportPopover";
import { ImportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ImportPopover";
import { PopoverBtn } from "@react-client/features/json4u/containers/editor/sidenav/PopoverButton";
import { Toggle } from "@react-client/features/json4u/containers/editor/sidenav/Toggle";
import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import { Download, FileUp } from "lucide-react";
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
			<AppNavbar setSideMenuOpen={() => toggleDrawer()} />
			<StyledFlex
				width="100%"
				pad="6px 10px"
				gap={2}
				alignItems="center"
				justifyContent="space-between"
				position="relative"
				zIndex={1000}
			>
				<Flex flexDirection="row" gap={10} alignItems="center">
					<MenuButton aria-label="menu" onClick={toggleDrawer}>
						<MenuRoundedIcon />
					</MenuButton>
					<NavbarBreadcrumbs />
					<Flex alignItems="center" gap={6}>
						<Toggle
							icon={<Braces className="icon" />}
							title={"Auto Format"}
							description={"auto_format_desc"}
							isPressed={enableAutoFormat}
							onPressedChange={(pressed) =>
								setParseOptions({ format: pressed })
							}
						/>
						<Toggle
							icon={<SquareStack className="icon" />}
							title={"Nested Parse"}
							description={"nested_parse_desc"}
							isPressed={enableNestParse}
							onPressedChange={(pressed) => setParseOptions({ nest: pressed })}
						/>
						<Toggle
							icon={<ArrowDownNarrowWide className="icon" />}
							title={"Auto Sort"}
							description={"auto_sort_desc"}
							isPressed={enableAutoSort}
							onPressedChange={(pressed) =>
								setParseOptions({ sort: pressed ? "asc" : undefined })
							}
						/>
						<Toggle
							icon={<AlignHorizontalJustifyCenter className="icon" />}
							title={"sync_reveal"}
							description={"sync_reveal_desc"}
							isPressed={enableSyncScroll}
							onPressedChange={(pressed) => setEnableSyncScroll(pressed)}
						/>
					</Flex>
					{/* <RightPanel /> */}
				</Flex>
				<Flex flexDirection="row" gap={6} alignItems="center">
					{viewMode === ViewMode.Graph && <ViewSearchInput />}

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
					{/* <Button variant="outlined" size="small" onClick={store.toggleMinimap}>
						{!store.isMinimapVisible
							? "Показать мини-карту"
							: "Скрыть мини-карту"}
					</Button> */}
					{/* <Button
						variant="outlined"
						size="small"
						onClick={toggleJsonPreviewEditor}
					>
						{!store.isJsonPreviewVisible ? "Показать json" : "Скрыть json"}
					</Button> */}
				</Flex>
			</StyledFlex>
		</>
	);
}

const StyledFlex = styled(Flex)`
	width: -moz-available;
	width: -webkit-fill-available;
	width: fill-available;
	border-bottom: 1px solid #e7e7e7;
`;
