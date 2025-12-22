import { useMemo, useCallback } from "react";
import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, SortChangedEvent } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { ChangelogTableEntry, SortConfig } from "../types";

interface ChangelogTableProps {
	data: ChangelogTableEntry[];
	sortConfig: SortConfig;
	onSortChange: (field: keyof ChangelogTableEntry) => void;
	onRowClick: (entry: ChangelogTableEntry) => void;
}

const getChangeTypeColor = (changeType: string) => {
	switch (changeType) {
		case "added":
			return "success";
		case "updated":
			return "warning";
		case "deleted":
			return "error";
		default:
			return "default";
	}
};

const getChangeTypeLabel = (changeType: string) => {
	switch (changeType) {
		case "added":
			return "Добавлен";
		case "updated":
			return "Обновлен";
		case "deleted":
			return "Удален";
		default:
			return changeType;
	}
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("ru-RU", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export const ChangelogTable = ({
	data,
	sortConfig,
	onSortChange,
	onRowClick,
}: ChangelogTableProps) => {
	const { mode } = useColorScheme();

	const columnDefs: ColDef<ChangelogTableEntry>[] = useMemo(
		() => [
			{
				headerName: "ID версии",
				field: "versionId",
				width: 150,
				pinned: "left",
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" fontFamily="monospace">
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Дата изменения",
				field: "changeDate",
				width: 180,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2">
							{params.value ? formatDate(params.value) : "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "ФИО пользователя",
				field: "userName",
				width: 200,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2">{params.value || "—"}</Typography>
					</Box>
				),
			},
			{
				headerName: "Наименование процесса",
				field: "processName",
				width: 250,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2">{params.value || "—"}</Typography>
					</Box>
				),
			},
			{
				headerName: "Наименование объекта",
				field: "objectName",
				width: 250,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2">{params.value || "—"}</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип объекта",
				field: "objectType",
				width: 150,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2">{params.value || "—"}</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип изменения",
				field: "changeType",
				width: 180,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box>
						<Chip
							label={getChangeTypeLabel(params.value)}
							color={getChangeTypeColor(params.value) as any}
							size="small"
						/>
					</Box>
				),
			},
			{
				headerName: "Действия",
				field: undefined,
				width: 120,
				sortable: false,
				filter: false,
				cellRenderer: (params: any) => (
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Tooltip title="Просмотр деталей">
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									onRowClick(params.data);
								}}
							>
								<VisibilityIcon />
							</IconButton>
						</Tooltip>
					</Box>
				),
			},
		],
		[onRowClick],
	);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
		[],
	);

	const handleSortChanged = useCallback((event: SortChangedEvent) => {
		// AG-Grid handles sorting automatically
		// If custom sorting logic is needed, it can be implemented here
		console.log("Sort changed:", event);
	}, []);

	const handleRowDoubleClick = useCallback(
		(event: any) => {
			onRowClick(event.data);
		},
		[onRowClick],
	);

	if (data.length === 0) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
				<Typography color="text.secondary">
					Нет записей в истории изменений
				</Typography>
			</Box>
		);
	}

	return (
		<GridWrapper height="calc(100vh - 200px)">
			<AgGridReact<ChangelogTableEntry>
				rowData={data}
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				pagination={true}
				paginationPageSize={20}
				paginationPageSizeSelector={[10, 20, 50, 100]}
				theme={
					mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
				}
				onSortChanged={handleSortChanged}
				onRowDoubleClicked={handleRowDoubleClick}
				loadingOverlayComponent={() => (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
						}}
					>
						<Typography>Загрузка истории изменений...</Typography>
					</div>
				)}
				noRowsOverlayComponent={() => (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
						}}
					>
						<Typography color="text.secondary">
							Нет записей в истории изменений
						</Typography>
					</div>
				)}
				animateRows={true}
				enableCellTextSelection={true}
				ensureDomOrder={true}
				maintainColumnOrder={true}
				rowSelection="single"
				suppressRowClickSelection={false}
			/>
		</GridWrapper>
	);
};

const GridWrapper = styled(Box)`
  zoom: 1;

  & > div {
    width: 100%;
  }
`;
