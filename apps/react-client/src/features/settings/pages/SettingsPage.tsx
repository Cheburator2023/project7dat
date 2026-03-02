import {
	Box,
	CircularProgress,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { useMemo } from "react";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Header } from "@react-client/common/navigation/organisms/Header";
import {
	defaultPanelsSettings,
	usePanelSettingsStore,
} from "@react-client/common/stores/panelSettingsStore";
import { useAgGridSettingsStore } from "@react-client/common/stores/agGridSettingsStore";
import { useGraphSettingsStore } from "@react-client/common/stores/graphSettingsStore";
import { Flex } from "@react-client/common/primitives/Flex";
import { useReleaseNotes } from "@react-client/api/hooks/useReleaseNotes";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";

const extractLatestVersion = (markdown: string): string | null => {
	if (!markdown.trim()) return null;
	const match =
		markdown.match(/^##\s+\[([^\]]+)\]/m) ??
		markdown.match(/^#\s+\[([^\]]+)\]/m);
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

	const {
		persistGridStateEnabled,
		setPersistGridStateEnabled,
		grids,
		toggleGridPersist,
		resetGridState,
		resetAllGrids,
	} = useAgGridSettingsStore();

	const {
		layoutDirection,
		setLayoutDirection,
		usePerGraphLayout,
		setUsePerGraphLayout,
	} = useGraphSettingsStore();

	const latestChangelogVersion = useMemo(
		() => extractLatestVersion(releaseNotes),
		[releaseNotes],
	);
	console.log(
		"🐸 Pepe said >> SettingsPage >> latestChangelogVersion:",
		releaseNotes,
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

	const gridList = useMemo(() => {
		return Object.values(grids).sort((a, b) => a.name.localeCompare(b.name));
	}, [grids]);

	const handleResetGrid = (gridId: string, gridName: string) => {
		if (
			window.confirm(
				`Сбросить состояние таблицы "${gridName}"? Это удалит сохранённые настройки из localStorage.`,
			)
		) {
			resetGridState(gridId);
		}
	};

	const handleResetAllGrids = () => {
		if (
			window.confirm(
				"Сбросить состояние всех таблиц? Это удалит все сохранённые настройки AgGrid из localStorage.",
			)
		) {
			resetAllGrids();
		}
	};

	return (
		<div>
			<Header title="Настройки" />

			<Card>
				<>
					<Typography variant="h6" gutterBottom>
						Сохранение состояния панелей
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Когда включено расположение панелей, их положение будет сохраняться
						и восстанавливаться при следующем посещении.
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

					<Spacer />

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 2,
						}}
					>
						<Typography variant="h6">Панели приложения</Typography>
						<IconButton
							onClick={handleResetAll}
							color="warning"
							title="Сбросить все панели"
						>
							<RestartAltIcon />
						</IconButton>
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
											<IconButton
												size="small"
												onClick={() => handleResetPanel(panel.id, panel.name)}
												color="warning"
												title="Сбросить состояние панели"
											>
												<RestartAltIcon fontSize="small" />
											</IconButton>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</>

				<Spacer />

				<>
					<Typography variant="h6" gutterBottom>
						Сохранение состояния таблиц
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Когда включено, таблицы (AgGrid) будут сохранять порядок/размер
						колонок и сортировку в localStorage и восстанавливаться при
						следующем посещении.
					</Typography>
					<FormControlLabel
						control={
							<Switch
								checked={persistGridStateEnabled}
								onChange={(e) => setPersistGridStateEnabled(e.target.checked)}
							/>
						}
						label="Включить сохранение состояния таблиц"
					/>

					<Spacer />

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 2,
						}}
					>
						<Typography variant="h6">Таблицы приложения</Typography>
						<IconButton
							onClick={handleResetAllGrids}
							color="warning"
							title="Сбросить все таблицы"
						>
							<RestartAltIcon />
						</IconButton>
					</Box>

					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Таблица</TableCell>
									<TableCell>Ключ localStorage</TableCell>
									<TableCell align="center">Сохранение</TableCell>
									<TableCell align="center">Действия</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{gridList.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4}>
											<Typography variant="body2" color="text.secondary">
												Таблицы пока не зарегистрированы. Открой страницу с
												нужной таблицей, чтобы она появилась здесь.
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									gridList.map((grid) => (
										<TableRow key={grid.id}>
											<TableCell>
												<Typography variant="body2" fontWeight="medium">
													{grid.name}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{grid.id}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography
													variant="caption"
													sx={{ fontFamily: "monospace" }}
												>
													{grid.localStorageKey}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Switch
													size="small"
													checked={grid.enabled && persistGridStateEnabled}
													disabled={!persistGridStateEnabled}
													onChange={() => toggleGridPersist(grid.id)}
												/>
											</TableCell>
											<TableCell align="center">
												<IconButton
													size="small"
													onClick={() => handleResetGrid(grid.id, grid.name)}
													color="warning"
													title="Сбросить состояние таблицы"
												>
													<RestartAltIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</>

				<Spacer />

				<>
					<Typography variant="h6" gutterBottom>
						Настройки граф панелей
					</Typography>

					<FormControlLabel
						control={
							<Switch
								checked={usePerGraphLayout}
								onChange={(e) => setUsePerGraphLayout(e.target.checked)}
							/>
						}
						label="Индивидуальная ориентация для каждого графа"
						sx={{ mb: 2 }}
					/>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						{usePerGraphLayout
							? "Каждый граф сохраняет свою ориентацию отдельно. Глобальная настройка используется как значение по умолчанию."
							: "Все графы используют одну общую ориентацию."}
					</Typography>

					<FormControl fullWidth size="small">
						<InputLabel>Ориентация по умолчанию</InputLabel>
						<Select
							label="Ориентация по умолчанию"
							value={layoutDirection}
							onChange={(e) =>
								setLayoutDirection(e.target.value as "LR" | "TB")
							}
						>
							<MenuItem value="LR">Горизонтальный (LR)</MenuItem>
							<MenuItem value="TB">Вертикальный (TB)</MenuItem>
						</Select>
					</FormControl>
				</>
			</Card>

			<Spacer space={8} />

			<Flex flexDirection="column">
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
						title={releaseNotes}
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
		</div>
	);
};
