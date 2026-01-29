import { useMemo, useCallback } from "react";
import type { FC } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { useS2tCommitList } from "@react-client/api/hooks";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";

export const AllCommitsPage: FC = () => {
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const s2tCommitsQuery = useS2tCommitList({ enabled: true });
	const s2tCommits = s2tCommitsQuery.data ?? [];
	const error = s2tCommitsQuery.error;

	const handleRefresh = () => {
		s2tCommitsQuery.refetch();
	};

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
				headerName: "S2T JSON",
				field: "payload",
				width: 320,
				sortable: false,
				filter: false,
				cellRenderer: (params: any) => (
					<JsonViewerCell value={params.value} maxPreviewLength={80} />
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
