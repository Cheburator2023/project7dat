import {
	Typography,
	Stack,
	CircularProgress,
	Box,
	Card,
	CardContent,
	Button,
	useColorScheme,
	styled,
} from "@mui/material";
import { RefreshRounded } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import {
	AllCommunityModule,
	ModuleRegistry,
	type ColDef,
} from "ag-grid-community";
import { useMemo } from "react";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { useJsonDataList } from "@react-client/api/hooks";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";

ModuleRegistry.registerModules([AllCommunityModule]);

export const JsonDataPage = () => {
	const { mode } = useColorScheme();

	const { data: jsonDataList, isLoading, error, refetch } = useJsonDataList();

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
								Ошибка загрузки JSON данных
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
					rowData={jsonDataList || []}
					columnDefs={jsonDataColumns}
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
