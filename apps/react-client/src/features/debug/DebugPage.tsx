import { Typography, Stack, Paper } from "@mui/material";
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

ModuleRegistry.registerModules([AllCommunityModule]);

export const DebugPage = () => {
	const {
		data: debugData,
		isLoading,
		error,
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
			{ field: "hash", headerName: "Хеш", width: 200 },
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
		return <Typography variant="h6">Загрузка данных отладки...</Typography>;
	}

	if (error) {
		return (
			<Typography variant="h6" color="error">
				Ошибка загрузки данных: {error.message}
			</Typography>
		);
	}

	return (
		<Stack spacing={3}>
			<Typography variant="h4">Отладка базы данных</Typography>

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
	);
};
