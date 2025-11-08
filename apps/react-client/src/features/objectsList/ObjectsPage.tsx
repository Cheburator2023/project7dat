import React, { useState, useMemo } from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { Search as SearchIcon } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";

interface ObjectItem {
	id: string;
	object: string;
	objectType: "Модель" | "Витрина" | "Признак";
	description: string;
	modelId: string;
	database: string;
	process: string;
	processDescription: string;
}

const mockData: ObjectItem[] = [
	{
		id: "1",
		object: "user_profile",
		objectType: "Модель",
		description: "Профиль пользователя с основной информацией",
		modelId: "MDL_001",
		database: "user_db",
		process: "ETL_USER_PROFILE",
		processDescription: "Загрузка и обработка данных профиля пользователя",
	},
	{
		id: "2",
		object: "sales_mart",
		objectType: "Витрина",
		description: "Витрина данных по продажам",
		modelId: "MDL_002",
		database: "analytics_db",
		process: "ETL_SALES_MART",
		processDescription: "Агрегация данных продаж для аналитики",
	},
	{
		id: "3",
		object: "customer_age",
		objectType: "Признак",
		description: "Возраст клиента",
		modelId: "MDL_003",
		database: "customer_db",
		process: "CALC_CUSTOMER_AGE",
		processDescription: "Расчет возраста клиента на основе даты рождения",
	},
	{
		id: "4",
		object: "product_catalog",
		objectType: "Модель",
		description: "Каталог товаров с характеристиками",
		modelId: "MDL_004",
		database: "product_db",
		process: "ETL_PRODUCT_CATALOG",
		processDescription: "Синхронизация каталога товаров",
	},
	{
		id: "5",
		object: "revenue_dashboard",
		objectType: "Витрина",
		description: "Дашборд по выручке компании",
		modelId: "MDL_005",
		database: "analytics_db",
		process: "ETL_REVENUE_DASHBOARD",
		processDescription: "Подготовка данных для дашборда выручки",
	},
	{
		id: "6",
		object: "purchase_frequency",
		objectType: "Признак",
		description: "Частота покупок клиента",
		modelId: "MDL_006",
		database: "customer_db",
		process: "CALC_PURCHASE_FREQ",
		processDescription: "Расчет частоты покупок за последние 12 месяцев",
	},
	{
		id: "7",
		object: "inventory_model",
		objectType: "Модель",
		description: "Модель управления запасами",
		modelId: "MDL_007",
		database: "inventory_db",
		process: "ETL_INVENTORY",
		processDescription: "Обработка данных складских остатков",
	},
	{
		id: "8",
		object: "customer_segmentation",
		objectType: "Витрина",
		description: "Сегментация клиентов по поведению",
		modelId: "MDL_008",
		database: "analytics_db",
		process: "ETL_CUSTOMER_SEGMENTS",
		processDescription: "Создание сегментов клиентов для маркетинга",
	},
	{
		id: "9",
		object: "loyalty_score",
		objectType: "Признак",
		description: "Оценка лояльности клиента",
		modelId: "MDL_009",
		database: "customer_db",
		process: "CALC_LOYALTY_SCORE",
		processDescription: "Расчет индекса лояльности на основе истории покупок",
	},
	{
		id: "10",
		object: "financial_reports",
		objectType: "Витрина",
		description: "Финансовая отчетность",
		modelId: "MDL_010",
		database: "finance_db",
		process: "ETL_FINANCIAL_REPORTS",
		processDescription: "Формирование финансовых отчетов",
	},
	{
		id: "11",
		object: "order_amount",
		objectType: "Признак",
		description: "Сумма заказа",
		modelId: "MDL_011",
		database: "orders_db",
		process: "CALC_ORDER_AMOUNT",
		processDescription: "Расчет общей суммы заказа включая налоги",
	},
	{
		id: "12",
		object: "supplier_performance",
		objectType: "Модель",
		description: "Модель оценки поставщиков",
		modelId: "MDL_012",
		database: "supplier_db",
		process: "ETL_SUPPLIER_PERF",
		processDescription: "Анализ эффективности работы поставщиков",
	},

	{
		id: "1",
		object: "user_profile",
		objectType: "Модель",
		description: "Профиль пользователя с основной информацией",
		modelId: "MDL_001",
		database: "user_db",
		process: "ETL_USER_PROFILE",
		processDescription: "Загрузка и обработка данных профиля пользователя",
	},
	{
		id: "2",
		object: "sales_mart",
		objectType: "Витрина",
		description: "Витрина данных по продажам",
		modelId: "MDL_002",
		database: "analytics_db",
		process: "ETL_SALES_MART",
		processDescription: "Агрегация данных продаж для аналитики",
	},
	{
		id: "3",
		object: "customer_age",
		objectType: "Признак",
		description: "Возраст клиента",
		modelId: "MDL_003",
		database: "customer_db",
		process: "CALC_CUSTOMER_AGE",
		processDescription: "Расчет возраста клиента на основе даты рождения",
	},
	{
		id: "4",
		object: "product_catalog",
		objectType: "Модель",
		description: "Каталог товаров с характеристиками",
		modelId: "MDL_004",
		database: "product_db",
		process: "ETL_PRODUCT_CATALOG",
		processDescription: "Синхронизация каталога товаров",
	},
	{
		id: "5",
		object: "revenue_dashboard",
		objectType: "Витрина",
		description: "Дашборд по выручке компании",
		modelId: "MDL_005",
		database: "analytics_db",
		process: "ETL_REVENUE_DASHBOARD",
		processDescription: "Подготовка данных для дашборда выручки",
	},
	{
		id: "6",
		object: "purchase_frequency",
		objectType: "Признак",
		description: "Частота покупок клиента",
		modelId: "MDL_006",
		database: "customer_db",
		process: "CALC_PURCHASE_FREQ",
		processDescription: "Расчет частоты покупок за последние 12 месяцев",
	},
	{
		id: "7",
		object: "inventory_model",
		objectType: "Модель",
		description: "Модель управления запасами",
		modelId: "MDL_007",
		database: "inventory_db",
		process: "ETL_INVENTORY",
		processDescription: "Обработка данных складских остатков",
	},
	{
		id: "8",
		object: "customer_segmentation",
		objectType: "Витрина",
		description: "Сегментация клиентов по поведению",
		modelId: "MDL_008",
		database: "analytics_db",
		process: "ETL_CUSTOMER_SEGMENTS",
		processDescription: "Создание сегментов клиентов для маркетинга",
	},
	{
		id: "9",
		object: "loyalty_score",
		objectType: "Признак",
		description: "Оценка лояльности клиента",
		modelId: "MDL_009",
		database: "customer_db",
		process: "CALC_LOYALTY_SCORE",
		processDescription: "Расчет индекса лояльности на основе истории покупок",
	},
	{
		id: "10",
		object: "financial_reports",
		objectType: "Витрина",
		description: "Финансовая отчетность",
		modelId: "MDL_010",
		database: "finance_db",
		process: "ETL_FINANCIAL_REPORTS",
		processDescription: "Формирование финансовых отчетов",
	},
	{
		id: "11",
		object: "order_amount",
		objectType: "Признак",
		description: "Сумма заказа",
		modelId: "MDL_011",
		database: "orders_db",
		process: "CALC_ORDER_AMOUNT",
		processDescription: "Расчет общей суммы заказа включая налоги",
	},
	{
		id: "12",
		object: "supplier_performance",
		objectType: "Модель",
		description: "Модель оценки поставщиков",
		modelId: "MDL_012",
		database: "supplier_db",
		process: "ETL_SUPPLIER_PERF",
		processDescription: "Анализ эффективности работы поставщиков",
	},
];

export const ObjectsPage: React.FC = () => {
	const { mode } = useColorScheme();
	const [searchText, setSearchText] = useState("");

	const filteredData = useMemo(() => {
		if (!searchText.trim()) {
			return mockData;
		}

		const searchLower = searchText.toLowerCase();
		return mockData.filter(
			(item) =>
				item.object.toLowerCase().includes(searchLower) ||
				item.objectType.toLowerCase().includes(searchLower) ||
				item.description.toLowerCase().includes(searchLower) ||
				item.modelId.toLowerCase().includes(searchLower) ||
				item.database.toLowerCase().includes(searchLower) ||
				item.process.toLowerCase().includes(searchLower) ||
				item.processDescription.toLowerCase().includes(searchLower),
		);
	}, [searchText]);

	const columnDefs: ColDef<ObjectItem>[] = useMemo(
		() => [
			{
				headerName: "Объект",
				field: "object",
				width: 200,
				pinned: "left",
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" fontWeight="medium">
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип объекта",
				field: "objectType",
				width: 150,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const getColor = (type: string) => {
						switch (type) {
							case "Модель":
								return "primary";
							case "Витрина":
								return "warning";
							case "Признак":
								return "success";
							default:
								return "default";
						}
					};

					return (
						<Box sx={{ padding: 1 }}>
							<Typography
								variant="body2"
								sx={{
									color:
										getColor(params.value) === "primary"
											? "primary.main"
											: getColor(params.value) === "warning"
												? "secondary.main"
												: getColor(params.value) === "success"
													? "success.main"
													: "text.primary",
									fontWeight: "medium",
								}}
							>
								{params.value || "—"}
							</Typography>
						</Box>
					);
				},
			},
			{
				headerName: "Описание",
				field: "description",
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
				headerName: "Модель ID",
				field: "modelId",
				width: 120,
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
				headerName: "БД",
				field: "database",
				width: 150,
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
				headerName: "Процесс",
				field: "process",
				width: 180,
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
				headerName: "Описание процесса",
				field: "processDescription",
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

	return (
		<Box>
			<Header />

			<TextField
				fullWidth
				variant="outlined"
				placeholder="Поиск по объектам..."
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon />
						</InputAdornment>
					),
				}}
			/>

			<Spacer space={6} />

			<GridWrapper height="calc(100vh - 120px)">
				<AgGridReact<ObjectItem>
					rowData={filteredData}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
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
							<Typography>Загрузка объектов...</Typography>
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
								{searchText.trim()
									? "Объекты не найдены по запросу"
									: "Объекты не найдены"}
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
	zoom: 1;

	& > div {
		width: 100%;
	}
`;
