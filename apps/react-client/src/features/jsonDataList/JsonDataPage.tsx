import {
	CircularProgress,
	Box,
	Button,
	useColorScheme,
	styled,
	Chip,
	Alert,
} from "@mui/material";
import { PlayArrow } from "@mui/icons-material";
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
import {
	useJsonDataList,
	useSetCurrentJsonData,
} from "@react-client/api/hooks";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { ChangelogButton } from "@react-client/new_features/changelog/ChangelogButton";
import { featureFlags } from "@react-client/config/featureFlags";
import {
	useJsonDataListV2,
	useSetCurrentJsonDataV2,
} from "@react-client/api/hooks";

ModuleRegistry.registerModules([AllCommunityModule]);

export const JsonDataPage = () => {
	const { mode } = useColorScheme();

	const listV1 = useJsonDataList();
	const listV2 = useJsonDataListV2();
	const setCurrentV1 = useSetCurrentJsonData();
	const setCurrentV2 = useSetCurrentJsonDataV2();

	const useV2 = featureFlags.newJsonDataV2Enabled;
	const {
		data: jsonDataList,
		isLoading,
		error,
		refetch,
	} = useV2 ? listV2 : listV1;
	const setCurrentMutation = useV2 ? setCurrentV2 : setCurrentV1;

	const jsonDataColumns: ColDef[] = useMemo(
		() => [
			{ field: "id", headerName: "ID", width: 280 },
			{ field: "name", headerName: "Название", width: 200 },
			{ field: "description", headerName: "Описание", width: 250 },
			{ field: "version", headerName: "Версия", width: 100 },
			{
				field: "isCurrent",
				headerName: "Текущий",
				width: 100,
				cellRenderer: (params: any) => (
					<Box display="flex" alignItems="center" height="100%">
						{params.value ? (
							<Chip
								label="Текущий"
								color="success"
								size="small"
								variant="filled"
							/>
						) : (
							<Chip
								label="Нет"
								color="default"
								size="small"
								variant="outlined"
							/>
						)}
					</Box>
				),
			},
			{
				headerName: "Действия",
				field: "actions",
				width: 180,
				pinned: "left",
				cellRenderer: (params: any) => (
					<Button
						size="small"
						variant="contained"
						color="primary"
						onClick={() => setCurrentMutation.mutate(params.data.id)}
						disabled={params.data.isCurrent || setCurrentMutation.isPending}
						startIcon={<PlayArrow />}
					>
						Применить
					</Button>
				),
			},
			{
				headerName: "История",
				field: "changelog",
				width: 120,
				pinned: "left",
				cellRenderer: (params: any) => (
					<ChangelogButton
						graphId={params.data.id}
						variant="icon"
						size="small"
					/>
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
		],
		[setCurrentMutation],
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
			<Box sx={{ padding: 3 }}>
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={refetch as any}>
							Повторить
						</Button>
					}
				>
					Ошибка загрузки данных: {error.message}
				</Alert>
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
