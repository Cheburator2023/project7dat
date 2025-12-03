import {
	Box,
	Card,
	CardContent,
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
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { usePanelSettingsStore } from "@react-client/common/store/panelSettingsStore";

export const SettingsPage = () => {
	const {
		persistLayoutsEnabled,
		setPersistLayoutsEnabled,
		panels,
		togglePanelPersist,
		resetPanelState,
		resetAllPanels,
	} = usePanelSettingsStore();

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

			<Box sx={{ p: 2, maxWidth: 900, margin: "0 auto" }}>
				{/* Глобальная настройка */}
				<Card sx={{ mb: 3 }}>
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
					</CardContent>
				</Card>

				{/* Список панелей */}
				<Card>
					<CardContent>
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
													{panel.name}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2" color="text.secondary">
													{panel.description}
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
			</Box>
		</div>
	);
};
