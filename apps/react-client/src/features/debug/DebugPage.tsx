import {
	Typography,
	Stack,
	Paper,
	CircularProgress,
	Box,
	Card,
	CardContent,
	Button,
} from "@mui/material";
import { RefreshRounded } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import {
	AllCommunityModule,
	ModuleRegistry,
	type ColDef,
} from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { agGridCustomMUITheme } from "@react-client/theme/ag-grid/agGridCustomTheme";
import { debugService } from "@react-client/api/debugApi";
import { JsonViewerCell } from "./JsonViewerCell";
import { Header } from "@react-client/features/navigation/organisms/Header";

ModuleRegistry.registerModules([AllCommunityModule]);

export const DebugPage = () => {
	const {
		data: debugData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["debug-data"],
		queryFn: debugService.getAllData,
		refetchInterval: 5000,
	});

	const jsonDataColumns: ColDef[] = useMemo(
		() => [
			{ field: "id", headerName: "ID", width: 280 },
			{ field: "name", headerName: "Название", width: 200 },
			{ field: "description", headerName: "Описание", width: 300 },
			{
				field: "createdAt",
				headerName: "Создано",
				width: 180,
				valueFormatter: (params) => new Date(params.value).toLocaleString(),
			},
			{
				field: "updatedAt",
				headerName: "Обновлено",
				width: 180,
				valueFormatter: (params) => new Date(params.value).toLocaleString(),
			},
			{
				field: "data",
				headerName: "Данные",
				width: 400,
				cellRenderer: (params: any) => <JsonViewerCell value={params.value} />,
			},
		],
		[],
	);

	const commitColumns: ColDef[] = useMemo(
		() => [
			{ field: "id", headerName: "ID", width: 280 },
			{ field: "short_id", headerName: "Хеш", width: 200 },
			{ field: "message", headerName: "Сообщение", width: 300 },
			{ field: "graphId", headerName: "ID графа", width: 280 },
			{
				field: "createdAt",
				headerName: "Создано",
				width: 180,
				valueFormatter: (params) => new Date(params.value).toLocaleString(),
			},
			{
				field: "diff",
				headerName: "Различия",
				width: 300,
				cellRenderer: (params: any) => <JsonViewerCell value={params.value} />,
			},
		],
		[],
	);

	if (isLoading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="100vh"
				width="100%"
			>
				<CircularProgress size={60} />
			</Box>
		);
	}

	if (error) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="100vh"
				width="100%"
				p={2}
			>
				<Card sx={{ maxWidth: 500, width: "100%" }}>
					<CardContent>
						<Stack spacing={2} alignItems="center">
							<Typography variant="h6" color="error" textAlign="center">
								Ошибка загрузки данных
							</Typography>
							<Typography
								variant="body2"
								color="text.secondary"
								textAlign="center"
							>
								{error.message}
							</Typography>
							<Button
								variant="contained"
								startIcon={<RefreshRounded />}
								onClick={() => refetch()}
							>
								Повторить
							</Button>
						</Stack>
					</CardContent>
				</Card>
			</Box>
		);
	}

	return (
		<Box>
			<Header />
			<Paper sx={{ p: 3, mb: 3 }}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					mb={2}
				>
					<Typography variant="h4">Отладка базы данных</Typography>
					<Button
						variant="outlined"
						startIcon={<RefreshRounded />}
						onClick={() => refetch()}
					>
						Обновить
					</Button>
				</Stack>
				<Stack direction="row" spacing={2}>
					<Typography variant="body1">
						JSON записей: {debugData?.jsonData?.length || 0}
					</Typography>
					<Typography variant="body1">
						Коммитов: {debugData?.commits?.length || 0}
					</Typography>
					<Typography variant="body1">
						Статус: {debugData?.dbStatus || "неизвестно"}
					</Typography>
				</Stack>
			</Paper>

			<Stack spacing={3}>
				<Paper>
					<Typography variant="h5" sx={{ p: 2 }}>
						Данные JSON ({debugData?.jsonData?.length || 0})
					</Typography>
					<div style={{ height: 400, width: "100%" }}>
						<AgGridReact
							rowData={debugData?.jsonData || []}
							columnDefs={jsonDataColumns}
							defaultColDef={{
								resizable: true,
								sortable: true,
								filter: true,
							}}
							pagination={true}
							paginationPageSize={10}
							theme={agGridCustomMUITheme}
						/>
					</div>
				</Paper>

				<Paper>
					<Typography variant="h5" sx={{ p: 2 }}>
						Коммиты ({debugData?.commits?.length || 0})
					</Typography>
					<div style={{ height: 400, width: "100%" }}>
						<AgGridReact
							rowData={debugData?.commits || []}
							columnDefs={commitColumns}
							defaultColDef={{
								resizable: true,
								sortable: true,
								filter: true,
							}}
							pagination={true}
							paginationPageSize={10}
							theme={agGridCustomMUITheme}
						/>
					</div>
				</Paper>
			</Stack>
		</Box>
	);
};
