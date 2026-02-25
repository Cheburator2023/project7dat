import {
	Box,
	Card,
	CardContent,
	CircularProgress,
	FormControlLabel,
	IconButton,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { useMemo } from "react";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Header } from "@react-client/common/navigation/organisms/Header";
import {
	defaultPanelsSettings,
	usePanelSettingsStore,
} from "@react-client/common/stores/panelSettingsStore";
import { useGraphSettingsStore } from "@react-client/common/stores/graphSettingsStore";
import { Flex } from "@react-client/common/primitives/Flex";
import { useReleaseNotes } from "@react-client/api/hooks/useReleaseNotes";

const extractLatestVersion = (markdown: string): string | null => {
	if (!markdown.trim()) return null;
	const match = markdown.match(/^#\s+\[([^\]]+)\]/m);
	return match?.[1] ?? null;
};

export const SettingsPage = () => {
	const releaseNotesQuery = useReleaseNotes();
	const releaseNotes = releaseNotesQuery.data?.markdown ?? "";
	const releaseNotesLoading = releaseNotesQuery.isLoading;
	const releaseNotesError = releaseNotesQuery.error?.message ?? "";

	const {
		persistLayoutsEnabled,
		setPersistLayoutsEnabled,
		togglePanelPersist,
		resetPanelState,
		resetAllPanels,
		panels,
	} = usePanelSettingsStore();

	const { showFullGraphByDefault, setShowFullGraphByDefault } =
		useGraphSettingsStore();

	const latestChangelogVersion = useMemo(
		() => extractLatestVersion(releaseNotes),
		[releaseNotes],
	);

	const handleResetPanel = (panelId: string, panelName: string) => {
		if (
			window.confirm(
				`Сбросить состояние панели "${panelName}"? Это удалит сохранённый layout из localStorage.`,
			)
		) {
			resetPanelState(panelId);
		}
	};

	const handleResetAll = () => {
		if (
			window.confirm(
				"Сбросить состояние всех панелей? Это удалит все сохранённые layouts из localStorage.",
			)
		) {
			resetAllPanels();
		}
	};

	return (
		<div>
			<Header title="Настройки" />
			<Flex flexDirection="column" gap={6}>
				{/* Глобальная настройка */}
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Сохранение состояния панелей
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Когда включено расположение панелей, их положение будет
							сохраняться и восстанавливаться при следующем посещении.
						</Typography>
						<FormControlLabel
							control={
								<Switch
									checked={persistLayoutsEnabled}
									onChange={(e) => setPersistLayoutsEnabled(e.target.checked)}
								/>
							}
							label="Включить сохранение расположения панелей"
						/>

						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 2,
							}}
						>
							<Typography variant="h6">Панели приложения</Typography>
							<Tooltip title="Сбросить все панели">
								<IconButton onClick={handleResetAll} color="warning">
									<RestartAltIcon />
								</IconButton>
							</Tooltip>
						</Box>

						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Панель</TableCell>
										<TableCell>Описание</TableCell>
										<TableCell align="center">Сохранение</TableCell>
										<TableCell align="center">Действия</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{panels.map((panel) => (
										<TableRow key={panel.id}>
											<TableCell>
												<Typography variant="body2" fontWeight="medium">
													{
														defaultPanelsSettings.find((p) => p.id === panel.id)
															?.name
													}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2" color="text.secondary">
													{
														defaultPanelsSettings.find((p) => p.id === panel.id)
															?.description
													}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Switch
													size="small"
													checked={panel.enabled && persistLayoutsEnabled}
													disabled={!persistLayoutsEnabled}
													onChange={() => togglePanelPersist(panel.id)}
												/>
											</TableCell>
											<TableCell align="center">
												<Tooltip title="Сбросить состояние панели">
													<IconButton
														size="small"
														onClick={() =>
															handleResetPanel(panel.id, panel.name)
														}
														color="warning"
													>
														<RestartAltIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						{!persistLayoutsEnabled && (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 2, fontStyle: "italic" }}
							>
								Включите глобальную настройку сохранения, чтобы управлять
								отдельными панелями.
							</Typography>
						)}
					</CardContent>
				</Card>

				<Flex flexDirection="column">
					<Typography
						variant="caption"
						sx={{
							pb: 0,
							color: "text.secondary",
						}}
					>
						System info
					</Typography>
					{releaseNotesLoading ? (
						<Typography
							variant="caption"
							sx={{
								pb: 0,
								color: "text.secondary",
							}}
						>
							version: <CircularProgress size={10} />
						</Typography>
					) : null}
					{!releaseNotesLoading && latestChangelogVersion ? (
						<Typography
							variant="caption"
							sx={{
								pb: 0,
								color: "text.secondary",
							}}
						>
							version: {latestChangelogVersion}
						</Typography>
					) : null}
					{!releaseNotesLoading &&
					!latestChangelogVersion &&
					releaseNotesError ? (
						<Typography
							variant="caption"
							sx={{
								pb: 0,
								color: "error.main",
							}}
						>
							version: n/a
						</Typography>
					) : null}
					{process.env.GIT_HASH ? (
						<Typography
							variant="caption"
							sx={{
								pb: 0,
								color: "text.secondary",
							}}
							data-test-id="side-menu--Version"
						>
							hash: {process.env.GIT_HASH}
						</Typography>
					) : null}
				</Flex>
			</Flex>
		</div>
	);
};
