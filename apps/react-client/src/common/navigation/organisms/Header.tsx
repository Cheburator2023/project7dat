import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseRoundedIcon from "@mui/icons-material/MenuOpen";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import {
	Box,
	CircularProgress,
	Divider,
	IconButton,
	LinearProgress,
	Typography,
} from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useNavigate } from "react-router";
import { memo, useState } from "react";
import { Flex } from "../../primitives/Flex";
import { useGlobalSettingsStore } from "../../stores/globalSettingsStore";
import { useMainDataLoadingStore } from "@react-client/common/stores/mainDataLoadingStore";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { NotificationButton } from "../../notification/NotificationButton";
import { Download } from "@mui/icons-material";
import { ExportDialog } from "../../dialogs/ExportDialog";
import { useEntitiesStore } from "@react-client/features/entities/stores";
import { useMergeSessionPolling } from "@react-client/api/hooks/useMergeSessionPolling";

const HeaderMergingChip = memo(function HeaderMergingChip() {
	const { activeSession } = useMergeSessionPolling();

	if (activeSession?.progress === 100 || activeSession === null) return null;

	return (
		<Box
			sx={{
				position: "relative",
				display: "inline-flex",
				alignItems: "center",
				borderRadius: "16px",
				overflow: "hidden",
				minWidth: 160,
				height: 26,
				border: "1px solid",
				borderColor: "info.main",
				background: "transparent",
				flexShrink: 0,
			}}
			title={`${activeSession?.stage} · ${activeSession?.commitName}`}
		>
			<LinearProgress
				variant="determinate"
				value={activeSession?.progress}
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					height: "100%",
					opacity: 0.2,
					borderRadius: "16px",
					"& .MuiLinearProgress-bar": { borderRadius: "16px" },
				}}
				color="info"
			/>
			<Typography
				variant="caption"
				title={activeSession?.stage}
				sx={{
					position: "relative",
					zIndex: 1,
					px: 1.5,
					whiteSpace: "nowrap",
					color: "info.main",
					fontWeight: 600,
				}}
			>
				Слияние {activeSession?.progress}% · {activeSession?.commitName}
			</Typography>
		</Box>
	);
});

export function Header({
	children,
	title,
	calcId,
	isLoading,
}: {
	children?: React.ReactNode;
	calcId?: string;
	title?: string | React.ReactNode;
	isLoading?: boolean;
}) {
	const { toggleSideMenu, isSideMenuVisible } = useGlobalSettingsStore();
	const { isMainDataLoading, hasMainDataLoadedOnce } =
		useMainDataLoadingStore();
	const navigate = useNavigate();
	const { selectedEntityId } = useEntitiesStore();
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

	const id1 = new URLSearchParams(window.location.search).get("id1");
	const id2 = new URLSearchParams(window.location.search).get("id2");

	return (
		<>
			<div
				style={{
					padding: "0 0px",
				}}
			>
				<Card
					data-test-id="header--Card-0"
					zoom={0.7}
					uuid="header_uuid"
					overflow={null}
					style={{ overflow: "visible", padding: "4px" }}
				>
					<Flex
						width="fill-available"
						gap={16}
						alignItems="center"
						justifyContent="space-between"
						position="relative"
						zIndex={1000}
						data-test-id="header--Flex-0"
					>
						<Flex
							flexDirection="row"
							gap={8}
							alignItems="center"
							flexShrink={0}
							data-test-id="header--Flex-1"
						>
							<MenuButton
								aria-label="menu"
								onClick={() => toggleSideMenu()}
								title={isSideMenuVisible ? "Закртыть меню" : "Открыть меню"}
								data-test-id="header--MenuButton-0"
							>
								{!isSideMenuVisible ? (
									<MenuRoundedIcon data-test-id="header--MenuRoundedIcon-0" />
								) : (
									<CloseRoundedIcon data-test-id="header--CloseRoundedIcon-0" />
								)}
							</MenuButton>
							{!!history.state.idx && (
								<IconButton
									size="small"
									onClick={() => navigate(-1)}
									title="Вернуться назад"
								>
									<ArrowBackIcon />
								</IconButton>
							)}
							{title ? (
								<b>{title}</b>
							) : (
								<NavbarBreadcrumbs data-test-id="header--NavbarBreadcrumbs-0" />
							)}
							{calcId ||
								((id1 || id2) && (
									<Typography data-test-id="header--Typography-0">
										- {calcId || `${id1} / ${id2}`}
									</Typography>
								))}
						</Flex>
						<Flex
							flexDirection="row"
							gap={6}
							alignItems="center"
							justifyContent="flex-end"
							width="fill-available"
							data-test-id="header--Flex-2"
						>
							{children}

							<HeaderMergingChip />

							<Divider orientation="vertical" variant="middle" flexItem />

							{hasMainDataLoadedOnce && isMainDataLoading && (
								<CircularProgress
									size={18}
									data-test-id="header--MainDataLoadingIndicator-0"
								/>
							)}
							<NotificationButton isLoading={!!isLoading} />
							<ColorModeIconDropdown data-test-id="header--ColorModeIconDropdown-0" />
							<IconButton
								data-test-id="header--Report_ExportButton"
								title="Отчет по выбраной сущности"
								onClick={() => setIsExportDialogOpen(true)}
								disabled={!selectedEntityId}
							>
								<Download />
							</IconButton>
							<IconButton
								onClick={() => navigate("/settings")}
								title="Настройки"
								data-test-id="header--SettingsButton-0"
							>
								<SettingsIcon />
							</IconButton>
						</Flex>
					</Flex>
				</Card>
			</div>

			<Spacer height={8} data-test-id="anketa-create-page--Spacer-1" />

			<ExportDialog
				open={isExportDialogOpen}
				onClose={() => setIsExportDialogOpen(false)}
				entityId={selectedEntityId}
			/>
		</>
	);
}
