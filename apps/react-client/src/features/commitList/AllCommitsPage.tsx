import { useState, useMemo, useCallback } from "react";
import type { ChangeEvent, FC } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import {
	useAllCommitsFromAllGraphs,
	useCommitList,
	useS2tCommitList,
} from "@react-client/api/hooks";
import type { JsonCommitItem } from "@react-client/api/hooks/jsonDataApi";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { JsonDiffViewerCell } from "@react-client/common/grid/JsonDiffViewerCell";

export const AllCommitsPage: FC = () => {
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const [_refreshKey, setRefreshKey] = useState(0);
	const [showAllGraphs, setShowAllGraphs] = useState(false);

	const singleGraphQuery = useCommitList({
		page: 1,
		limit: 100,
		enabled: !showAllGraphs,
	});

	const allGraphsQuery = useAllCommitsFromAllGraphs({
		page: 1,
		limit: 100,
		enabled: showAllGraphs,
	});

	const singleGraphCommitsResponse = singleGraphQuery.data;
	const allGraphsCommitsResponse = allGraphsQuery.data;

	const isLoadingSingle = singleGraphQuery.isLoading;
	const isLoadingAll = allGraphsQuery.isLoading;

	const errorSingle = singleGraphQuery.error;
	const errorAll = allGraphsQuery.error;
	const refetchSingle = singleGraphQuery.refetch;
	const refetchAll = allGraphsQuery.refetch;

	const _commitsList = showAllGraphs
		? allGraphsCommitsResponse?.data || []
		: singleGraphCommitsResponse?.data || [];

	const s2tCommitsQuery = useS2tCommitList({ enabled: true });
	const s2tCommits = s2tCommitsQuery.data ?? [];
	const _s2tCommitsError = s2tCommitsQuery.error;

	const _isLoading = showAllGraphs ? isLoadingAll : isLoadingSingle;
	const error = showAllGraphs ? errorAll : errorSingle;

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
		if (showAllGraphs) {
			refetchAll();
		} else {
			refetchSingle();
		}
	};

	const _handleToggleView = (event: ChangeEvent<HTMLInputElement>) => {
		setShowAllGraphs(event.target.checked);
	};

	const _columnDefs: ColDef<JsonCommitItem>[] = useMemo(() => {
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

	const s2tColumnDefs: ColDef<S2tCommitItem>[] = useMemo(
		() => [
			{
				headerName: "ID",
				field: "id",
				width: 220,
				pinned: "left",
				cellRenderer: (params: any) => (
					<Typography variant="body2" noWrap fontFamily="monospace">
						{params.value ? String(params.value).slice(0, 8) : "—"}
					</Typography>
				),
			},
			{
				headerName: "Название",
				field: "commit_name",
				width: 260,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap>
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип",
				field: "type",
				width: 110,
			},
			{
				headerName: "Статус",
				field: "state",
				width: 130,
			},
			{
				headerName: "Пользователь",
				field: "user",
				width: 160,
				cellRenderer: (params: any) => params.value || "—",
			},
			{
				headerName: "Change ID",
				field: "change_id",
				width: 120,
				cellRenderer: (params: any) =>
					typeof params.value === "number" ? params.value : "—",
			},
			{
				headerName: "Создан",
				field: "created_at",
				width: 180,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return new Date(params.value).toLocaleString("ru-RU");
				},
			},
			{
				headerName: "Ошибка",
				field: "error",
				width: 260,
				cellRenderer: (params: any) => (
					<Typography
						variant="body2"
						noWrap
						color={params.value ? "error" : "text.secondary"}
					>
						{params.value || "—"}
					</Typography>
				),
			},
		],
		[],
	);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
		[],
	);

	const handleOpenS2tCommitCreatePage = useCallback(() => {
		navigate("/s2t-commits/new");
	}, [navigate]);

	const handleS2tRowDoubleClick = useCallback(
		(event: any) => {
			const id = event?.data?.id;
			if (!id) return;
			navigate(`/s2t-commits/${id}`);
		},
		[navigate],
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
			<Header>
				<Button onClick={handleOpenS2tCommitCreatePage} title="Импорт S2T">
					Импорт S2T
				</Button>
			</Header>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 2,
					height: "100%",
				}}
			>
				<GridWrapper height="100%">
					<AgGridReact<S2tCommitItem>
						rowData={s2tCommits}
						columnDefs={s2tColumnDefs}
						defaultColDef={defaultColDef}
						onRowDoubleClicked={handleS2tRowDoubleClick}
						pagination={true}
						paginationPageSize={20}
						paginationPageSizeSelector={[10, 20, 50, 100]}
						loading={s2tCommitsQuery.isLoading}
						theme={
							mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
						}
						animateRows={true}
						enableCellTextSelection={true}
						ensureDomOrder={true}
						maintainColumnOrder={true}
					/>
				</GridWrapper>
			</Box>
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 0.8;
	& > div {
		width: 100%;
	}
`;
