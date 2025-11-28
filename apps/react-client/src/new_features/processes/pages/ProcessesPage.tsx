import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
	Box,
	Typography,
	TextField,
	Card,
	CardContent,
	CardActions,
	Button,
	Chip,
	Stack,
	InputAdornment,
	CircularProgress,
	Alert,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Search, CalendarToday } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import {
	useProcessesStore,
	Process,
} from "@react-client/stores/processesStore";
import { Header } from "@react-client/common/navigation/organisms/Header";

// Cell renderers for ag-grid
const getStatusColor = (status: Process["status"]) => {
	switch (status) {
		case "active":
			return "success";
		case "inactive":
			return "default";
		case "error":
			return "error";
		default:
			return "default";
	}
};

const getTypeColor = (type: Process["type"]) => {
	switch (type) {
		case "ETL":
			return "primary";
		case "ELT":
			return "default";
		case "Data Pipeline":
			return "info";
		case "Analytics":
			return "warning";
		case "ML Pipeline":
			return "success";
		default:
			return "default";
	}
};

const StatusChipRenderer = ({ value }: { value: Process["status"] }) => {
	return (
		<Chip
			label={
				value === "active"
					? "Активен"
					: value === "inactive"
						? "Неактивен"
						: "Ошибка"
			}
			color={getStatusColor(value)}
			size="small"
			variant="outlined"
		/>
	);
};

const TypeChipRenderer = ({ value }: { value: Process["type"] }) => {
	return (
		<Chip
			label={value}
			color={getTypeColor(value)}
			size="small"
			variant="outlined"
		/>
	);
};

const TagsRenderer = ({ value }: { value: string[] }) => {
	if (!value || value.length === 0) return null;

	return (
		<Stack direction="row" spacing={0.5} flexWrap="wrap">
			{value.slice(0, 3).map((tag) => (
				<Chip key={tag} label={tag} size="small" color="primary" />
			))}
			{value.length > 3 && (
				<Chip label={`+${value.length - 3}`} size="small" color="primary" />
			)}
		</Stack>
	);
};

export const ProcessesPage = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { mode } = useColorScheme();

	const {
		processes,
		filteredProcesses,
		searchQuery,
		isLoading,
		error,
		loadProcesses,
		setSearchQuery,
	} = useProcessesStore();

	const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		loadProcesses();
	}, [loadProcesses]);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
	};

	const handleViewProcess = (processId: string) => {
		navigate(`/processes/${processId}/graph`);
	};

	const handleProcessSelect = (processId: string) => {
		setSelectedProcessId(processId);
	};

	const handleProcessDoubleClick = (processId: string) => {
		navigate(`/processes/${processId}/graph`);
	};

	// Column definitions for ag-grid
	const columnDefs: ColDef<Process>[] = [
		{
			field: "name",
			headerName: "Название",
			flex: 2,
			minWidth: 200,
			sortable: true,
			filter: true,
			cellRenderer: ({ value, data }: { value: string; data: Process }) => (
				<Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
					<Typography variant="body2" fontWeight="medium">
						{value}
					</Typography>
				</Box>
			),
		},
		{
			field: "type",
			headerName: "Тип",
			width: 150,
			sortable: true,
			filter: true,
			cellRenderer: TypeChipRenderer,
		},
		{
			field: "status",
			headerName: "Статус",
			width: 120,
			sortable: true,
			filter: true,
			cellRenderer: StatusChipRenderer,
		},
		{
			field: "owner",
			headerName: "Владелец",
			width: 150,
			sortable: true,
			filter: true,
		},
		{
			field: "createdAt",
			headerName: "Создан",
			width: 120,
			sortable: true,
			filter: "agDateColumnFilter",
			valueFormatter: ({ value }: { value: string }) => {
				return new Date(value).toLocaleDateString("ru-RU");
			},
		},
		{
			field: "tags",
			headerName: "Теги",
			width: 200,
			sortable: false,
			filter: false,
			cellRenderer: TagsRenderer,
		},
	];

	if (isLoading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<Stack spacing={2} alignItems="center">
					<CircularProgress />
					<Typography>Загрузка процессов...</Typography>
				</Stack>
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={4}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	return (
		<Stack spacing={0}>
			<Header>
				<TextField
					fullWidth
					placeholder="Поиск процессов по наименованию..."
					value={searchQuery}
					onChange={handleSearch}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<Search />
							</InputAdornment>
						),
					}}
					sx={{ maxWidth: 500 }}
				/>
			</Header>

			{/* Список процессов */}
			{isMobile ? (
				// Мобильная версия - карточки
				<Stack spacing={2}>
					{filteredProcesses.map((process) => (
						<Card
							key={process.id}
							variant={
								selectedProcessId === process.id ? "elevation" : "outlined"
							}
							elevation={selectedProcessId === process.id ? 4 : 1}
							sx={{
								cursor: "pointer",
								transition: "all 0.2s ease",
								border:
									selectedProcessId === process.id
										? `2px solid ${theme.palette.primary.main}`
										: undefined,
								"&:hover": {
									elevation: 3,
									transform: "translateY(-2px)",
								},
							}}
							onClick={() => handleProcessSelect(process.id)}
							onDoubleClick={() => handleProcessDoubleClick(process.id)}
						>
							<CardContent>
								<Stack spacing={2}>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="flex-start"
									>
										<Typography variant="h6" component="h3" fontWeight="medium">
											{process.name}
										</Typography>
										<Chip
											label={process.type}
											color="primary"
											size="small"
											variant="outlined"
										/>
									</Stack>

									<Typography variant="body2" color="text.secondary">
										{process.description}
									</Typography>

									<Stack direction="row" spacing={1} alignItems="center">
										<CalendarToday sx={{ fontSize: 16 }} />
										<Typography variant="caption" color="text.secondary">
											{new Date(process.createdAt).toLocaleDateString("ru-RU")}
										</Typography>
									</Stack>

									{process.tags.length > 0 && (
										<Stack direction="row" spacing={1} flexWrap="wrap">
											{process.tags.map((tag) => (
												<Chip key={tag} label={tag} size="small" />
											))}
										</Stack>
									)}
								</Stack>
							</CardContent>

							<CardActions>
								<Button
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										handleViewProcess(process.id);
									}}
								>
									Открыть граф
								</Button>
							</CardActions>
						</Card>
					))}
				</Stack>
			) : (
				// Десктопная версия - AG Grid
				<Box
					sx={{
						height: "calc(100vh - 280px)",
						minHeight: 400,
						width: "100%",
					}}
				>
					<AgGridReact<Process>
						rowData={filteredProcesses}
						columnDefs={columnDefs}
						theme={
							mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
						}
						defaultColDef={{
							resizable: true,
							sortable: true,
							filter: true,
						}}
						pagination={true}
						paginationPageSize={20}
						paginationPageSizeSelector={[10, 20, 50, 100]}
						animateRows={true}
						rowSelection="single"
						onRowDoubleClicked={(event) => {
							if (event.data) {
								handleViewProcess(event.data.id);
							}
						}}
						suppressRowClickSelection={true}
						getRowId={(params) => params.data.id}
					/>
				</Box>
			)}

			{filteredProcesses.length === 0 && (
				<Box textAlign="center" py={8}>
					<Typography variant="h6" color="text.secondary" gutterBottom>
						Процессы не найдены
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{searchQuery
							? "Попробуйте изменить поисковый запрос"
							: "В системе пока нет процессов"}
					</Typography>
				</Box>
			)}
		</Stack>
	);
};
