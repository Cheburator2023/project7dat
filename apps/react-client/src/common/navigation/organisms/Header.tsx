import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseRoundedIcon from "@mui/icons-material/MenuOpen";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Divider, IconButton, Typography } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Flex } from "../../primitives/Flex";
import { useGlobalSettingsStore } from "../../store/globalSettingsStore";
import { useDataLineageStore } from "../../../stores/dataLineageStore";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { NotificationButton } from "../../notification/NotificationButton";
import { CreateSnapshotDialog } from "../../../features/snapshotsList/CreateSnapshotDialog";

export function Header({
	children,
	title,
	calcId,
}: {
	children?: React.ReactNode;
	calcId?: string;
	title?: string;
}) {
	const { toggleSideMenu, isSideMenuVisible } = useGlobalSettingsStore();
	const { currentGraphId } = useDataLineageStore();
	const navigate = useNavigate();
	const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);

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
							{currentGraphId && (
								<Typography>Текущий json: {currentGraphId}</Typography>
							)}
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

							<Divider orientation="vertical" variant="middle" flexItem />

							{currentGraphId && (
								<IconButton
									onClick={() => setIsSnapshotDialogOpen(true)}
									title="Создать снимок текущих данных"
								>
									<CameraAltIcon />
								</IconButton>
							)}

							<NotificationButton />
							<ColorModeIconDropdown data-test-id="header--ColorModeIconDropdown-0" />
						</Flex>
					</Flex>
				</Card>
			</div>

			<Spacer height={8} data-test-id="anketa-create-page--Spacer-1" />

			<CreateSnapshotDialog
				open={isSnapshotDialogOpen}
				onClose={() => setIsSnapshotDialogOpen(false)}
			/>
		</>
	);
}
