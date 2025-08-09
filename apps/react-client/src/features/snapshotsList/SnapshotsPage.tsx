import {
	Typography,
	Stack,
	CircularProgress,
	Box,
	Card,
	CardContent,
	Button,
	useColorScheme,
} from "@mui/material";
import { RefreshRounded, PlayArrow } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import {
	AllCommunityModule,
	ModuleRegistry,
	type ColDef,
} from "ag-grid-community";
import { useMemo, useState } from "react";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import {
	useSnapshotList,
	useSetCurrentFromSnapshot,
} from "@react-client/api/hooks";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { styled } from "@mui/system";

ModuleRegistry.registerModules([AllCommunityModule]);

export const SnapshotsPage = () => {
	const { mode } = useColorScheme();
	const [_isCreateDialogOpen, _setIsCreateDialogOpen] = useState(false);

	const {
		data: snapshotsData,
		isLoading,
		error,
		refetch,
	} = useSnapshotList({
		page: 1,
		limit: 100,
	});

	const setCurrentFromSnapshotMutation = useSetCurrentFromSnapshot();

	const snapshotColumns: ColDef[] = useMemo(
		() => [
			{ field: "id", headerName: "ID", width: 280 },
			{ field: "sourceDataId", headerName: "ID источника", width: 280 },
			{ field: "name", headerName: "Название", width: 200 },
			{ field: "description", headerName: "Описание", width: 250 },
			{ field: "version", headerName: "Версия", width: 120 },
			{ field: "graphId", headerName: "ID графа", width: 280 },
			{
				field: "actions",
				headerName: "Действия",
				width: 180,
				pinned: "left",
				cellRenderer: (params: any) => (
					<Button
						size="small"
						variant="contained"
						color="primary"
						onClick={() =>
							setCurrentFromSnapshotMutation.mutate({
								snapshotId: params.data.id,
							})
						}
						disabled={setCurrentFromSnapshotMutation.isPending}
						startIcon={<PlayArrow />}
					>
						Установить
					</Button>
				),
			},
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
			{
				field: "metadata",
				headerName: "Метаданные",
				width: 300,
				cellRenderer: (params: any) => <JsonViewerCell value={params.value} />,
			},
		],
		[setCurrentFromSnapshotMutation],
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
								Ошибка загрузки снимков
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

			<GridWrapper height="-webkit-fill-available">
				<AgGridReact
					rowData={snapshotsData?.data || []}
					columnDefs={snapshotColumns}
					defaultColDef={{
						resizable: true,
						sortable: true,
						filter: true,
					}}
					pagination={true}
					paginationPageSize={20}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
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
