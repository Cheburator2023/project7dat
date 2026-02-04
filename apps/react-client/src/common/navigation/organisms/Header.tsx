import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseRoundedIcon from "@mui/icons-material/MenuOpen";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Chip, Divider, IconButton, Typography } from "@mui/material";
import axios from "axios";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Flex } from "../../primitives/Flex";
import { useGlobalSettingsStore } from "../../store/globalSettingsStore";
import { useDataLineageStore } from "../../../stores/dataLineageStore";
import { ColorModeIconDropdown } from "../../../theme/ColorModeIconDropdown";
import { S2tImportDialog } from "@react-client/features/s2tImport/S2tImportDialog";
import { MenuButton } from "../molecules/MenuButton";
import { NavbarBreadcrumbs } from "../molecules/NavbarBreadcrumbs";
import { NotificationButton } from "../../notification/NotificationButton";
import { CreateSnapshotDialog } from "../../../features/snapshotsList/CreateSnapshotDialog";

export function Header({
	children,
	title,
	calcId,
	isLoading,
}: {
	children?: React.ReactNode;
	calcId?: string;
	title?: string;
	isLoading?: boolean;
}) {
	const { toggleSideMenu, isSideMenuVisible } = useGlobalSettingsStore();
	const { currentGraphId } = useDataLineageStore();
	const navigate = useNavigate();
	const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
	const [pendingS2t, setPendingS2t] = useState<{
		commitId: string;
		state: string;
		updatedAt?: string;
	} | null>(null);
	const S2T_PENDING_COMMIT_LS_KEY = "s2t_pending_commit";
	const API_BASE_URL =
		window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";
	const [isApplyingS2t, setIsApplyingS2t] = useState(false);
	const [isS2tCommitDialogOpen, setIsS2tCommitDialogOpen] = useState(false);

	const handleApplyPendingS2t = async () => {
		if (!pendingS2t?.commitId) return;
		if (pendingS2t.state === "applying") return;
		setIsApplyingS2t(true);
		try {
			localStorage.setItem(
				S2T_PENDING_COMMIT_LS_KEY,
				JSON.stringify({
					...pendingS2t,
					state: "applying",
					updatedAt: new Date().toISOString(),
				}),
			);

			const res = await axios.post(
				`${API_BASE_URL}/api/s2t-import/commits/${pendingS2t.commitId}/apply`,
				{},
			);
			localStorage.removeItem(S2T_PENDING_COMMIT_LS_KEY);
			window.dispatchEvent(
				new CustomEvent("s2t_commit_applied", {
					detail: {
						commitId: pendingS2t.commitId,
						changeId: res.data?.changeId ?? res.data?.commit?.change_id,
					},
				}),
			);
		} catch {
			localStorage.setItem(
				S2T_PENDING_COMMIT_LS_KEY,
				JSON.stringify({
					...pendingS2t,
					state: "failed",
					updatedAt: new Date().toISOString(),
				}),
			);
		} finally {
			setIsApplyingS2t(false);
		}
	};

	useEffect(() => {
		const read = () => {
			try {
				const raw = localStorage.getItem(S2T_PENDING_COMMIT_LS_KEY);
				setPendingS2t(raw ? JSON.parse(raw) : null);
			} catch {
				setPendingS2t(null);
			}
		};

		read();
		const onStorage = (e: StorageEvent) => {
			if (e.key === S2T_PENDING_COMMIT_LS_KEY) read();
		};
		window.addEventListener("storage", onStorage);
		const interval = window.setInterval(read, 2000);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.clearInterval(interval);
		};
	}, []);

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

							{pendingS2t?.commitId && (
								<>
									<Chip
										id="commit_id_chip"
										onClick={() => setIsS2tCommitDialogOpen(true)}
										clickable
										size="small"
										variant="outlined"
										color={pendingS2t.state === "failed" ? "error" : "warning"}
										label={`S2T: ${pendingS2t.state} (${pendingS2t.commitId.slice(0, 8)})`}
										title={`S2T commit ${pendingS2t.commitId} (${pendingS2t.state})`}
									/>
									<IconButton
										size="small"
										onClick={handleApplyPendingS2t}
										title="Применить S2T коммит"
										disabled={isApplyingS2t || pendingS2t.state === "applying"}
									>
										<PlayArrowIcon fontSize="small" />
									</IconButton>
								</>
							)}

							<Divider orientation="vertical" variant="middle" flexItem />

							{/* {currentGraphId && (
								<IconButton
									onClick={() => setIsSnapshotDialogOpen(true)}
									title="Создать снимок текущих данных"
								>
									<CameraAltIcon />
								</IconButton>
							)} */}

							<NotificationButton isLoading={!!isLoading} />
							<ColorModeIconDropdown
								isLoading={!!isLoading}
								data-test-id="header--ColorModeIconDropdown-0"
							/>
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

			<S2tImportDialog
				open={isS2tCommitDialogOpen}
				onClose={() => setIsS2tCommitDialogOpen(false)}
				prefillCommitId={pendingS2t?.commitId ?? null}
			/>

			<CreateSnapshotDialog
				open={isSnapshotDialogOpen}
				onClose={() => setIsSnapshotDialogOpen(false)}
			/>
		</>
	);
}
