import React, { useState, useMemo } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { useCommitList } from "@react-client/api/hooks/useCommitList";
import { useAllCommitsFromAllGraphs } from "@react-client/api/hooks/useAllCommitsFromAllGraphs";
import type { JsonCommitItem } from "@react-client/api/jsonDataApi";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { JsonDiffViewerCell } from "@react-client/common/grid/JsonDiffViewerCell";

export const AllCommitsPage: React.FC = () => {
	const { mode } = useColorScheme();
	const [_refreshKey, setRefreshKey] = useState(0);
	const [showAllGraphs, setShowAllGraphs] = useState(false);

	const {
		data: singleGraphCommitsResponse,
		isLoading: isLoadingSingle,
		error: errorSingle,
		refetch: refetchSingle,
	} = useCommitList({
		page: 1,
		enabled: !showAllGraphs,
		limit: 100,
	});

	const {
		data: allGraphsCommitsResponse,
		isLoading: isLoadingAll,
		error: errorAll,
		refetch: refetchAll,
	} = useAllCommitsFromAllGraphs({
		page: 1,
		enabled: showAllGraphs,
		limit: 100,
	});

	const commitsList = showAllGraphs
		? allGraphsCommitsResponse?.data || []
		: singleGraphCommitsResponse?.data || [];

	const isLoading = showAllGraphs ? isLoadingAll : isLoadingSingle;
	const error = showAllGraphs ? errorAll : errorSingle;

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
		if (showAllGraphs) {
			refetchAll();
		} else {
			refetchSingle();
		}
	};

	const _handleToggleView = (event: React.ChangeEvent<HTMLInputElement>) => {
		setShowAllGraphs(event.target.checked);
	};

	const columnDefs: ColDef<JsonCommitItem>[] = useMemo(() => {
		const baseColumns: ColDef<JsonCommitItem>[] = [
			{
				headerName: "ID",
				field: "short_id",
				width: 100,
				pinned: "left",
				sortable: true,
				filter: true,
			},
			{
				headerName: "Сообщение",
				field: "message",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap>
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Автор",
				field: "author",
				width: 150,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return (
						params.value.username ||
						params.value.email ||
						params.value.id ||
						"—"
					);
				},
			},
			{
				headerName: "JSON ID",
				field: "graphId",
				width: 120,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap fontFamily="monospace">
							{params.value ? params.value.substring(0, 8) : "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Создан",
				field: "createdAt",
				width: 180,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return new Date(params.value).toLocaleString("ru-RU");
				},
			},
			{
				field: "diff",
				headerName: "Изменения",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					return (
						<JsonDiffViewerCell
							diff={params.value}
							leftTitle="До изменений"
							rightTitle="После изменений"
						/>
					);
				},
			},
		];

		if (showAllGraphs) {
			baseColumns.push({
				field: "fullData" as keyof JsonCommitItem,
				headerName: "Полные данные",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => <JsonViewerCell value={params.value} />,
			});
		}

		return baseColumns;
	}, [showAllGraphs]);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
		[],
	);

	if (error) {
		return (
			<Box sx={{ padding: 3 }}>
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={handleRefresh}>
							Повторить
						</Button>
					}
				>
					Ошибка загрузки коммитов: {error.message}
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Header />

			<GridWrapper height="-webkit-fill-available">
				<AgGridReact<JsonCommitItem>
					rowData={commitsList}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					loading={isLoading}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					loadingOverlayComponent={() => (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
							}}
						>
							<Typography>Загрузка коммитов...</Typography>
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
								{showAllGraphs
									? "Коммиты не найдены во всех JSONах"
									: "Коммиты не найдены в текущем JSONе"}
							</Typography>
						</div>
					)}
					animateRows={true}
					enableCellTextSelection={true}
					ensureDomOrder={true}
					maintainColumnOrder={true}
				/>
			</GridWrapper>
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 0.8;
	& > div {
		width: 100%;
	}
`;
