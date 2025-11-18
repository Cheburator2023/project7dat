import { useState, useMemo } from "react";
import {
	Box,
	TextField,
	InputAdornment,
	Chip,
	IconButton,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { Search, Visibility } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { ModelGraphWindow } from "./organisms/ModelGraphWindow";
import { DataLineageEntity } from "@data-lineage/shared-schemas";

// Extended interface based on DataLineageEntity for UI display purposes
export interface Model extends DataLineageEntity {
	description?: string;
	createdDate?: string;
	updatedDate?: string;
	status?: "active" | "draft" | "archived";
	author?: string;
	version?: string;
	tags?: string[];
	lastAccessDate?: string;
	size?: string;
	objectsCount?: number;
	businessType?: "analytical" | "operational" | "dimensional";
}

// Mock data based on real DataLineageEntity schema - Banking/Financial Focus
const mockModels: Model[] = [
	{
		id: "hdfs_retail_txn_fact_v3",
		name: "retail_transaction_fact_table",
		modified: false,
		type: "table",
		namespace: "retail_banking",
		description:
			"Основная таблица фактов розничных банковских транзакций в HDFS, обрабатываемая Spark для анализа клиентского поведения и выявления мошенничества",
		createdDate: "2024-01-15",
		updatedDate: "2024-01-20",
		status: "active",
		author: "Петров А.В.",
		version: "3.2.1",
		tags: ["retail", "transactions", "fraud-detection", "spark", "hdfs"],
		lastAccessDate: "2024-01-22",
		size: "15.7 GB",
		businessType: "operational",
		attrSeq: [
			{
				name: "transaction_id",
				type: "string",
				comment: "Уникальный идентификатор транзакции",
			},
			{ name: "customer_id", type: "string", comment: "Идентификатор клиента" },
			{ name: "account_number", type: "string", comment: "Номер счета" },
			{
				name: "transaction_amount",
				type: "decimal",
				comment: "Сумма транзакции",
			},
			{
				name: "transaction_timestamp",
				type: "timestamp",
				comment: "Время транзакции",
			},
			{
				name: "merchant_category",
				type: "string",
				comment: "Категория торговца",
			},
			{
				name: "channel_type",
				type: "string",
				comment: "Канал проведения транзакции",
			},
		],
		objectsCount: 7,
	},
	{
		id: "spark_credit_risk_model_v2",
		name: "credit_risk_assessment_model",
		modified: true,
		type: "view",
		namespace: "risk_management",
		description:
			"Модель оценки кредитного риска на базе Spark ML, использующая данные из Hadoop для расчета PD, LGD и EAD в соответствии с Basel III",
		createdDate: "2024-01-10",
		updatedDate: "2024-01-18",
		status: "active",
		author: "Смирнова Е.И.",
		version: "2.4.0",
		tags: ["credit-risk", "basel-iii", "spark-ml", "pd-lgd-ead", "regulatory"],
		lastAccessDate: "2024-01-21",
		size: "8.3 GB",
		businessType: "analytical",
		attrSeq: [
			{
				name: "borrower_id",
				type: "string",
				comment: "Идентификатор заемщика",
			},
			{ name: "loan_id", type: "string", comment: "Идентификатор кредита" },
			{
				name: "pd_score",
				type: "decimal",
				comment: "Вероятность дефолта (PD)",
			},
			{
				name: "lgd_estimate",
				type: "decimal",
				comment: "Потери при дефолте (LGD)",
			},
			{
				name: "ead_amount",
				type: "decimal",
				comment: "Сумма под риском (EAD)",
			},
			{ name: "risk_rating", type: "string", comment: "Рейтинг риска" },
		],
		objectsCount: 6,
	},
	{
		id: "hive_aml_suspicious_activity_v1",
		name: "aml_suspicious_activity_reports",
		modified: true,
		type: "table",
		namespace: "compliance",
		description:
			"Таблица подозрительных активностей для AML в Hive, агрегирующая данные из множественных источников для выявления отмывания денег и финансирования терроризма",
		createdDate: "2024-01-05",
		updatedDate: "2024-01-12",
		status: "draft",
		author: "Козлов Д.М.",
		version: "1.8.3",
		tags: ["aml", "compliance", "suspicious-activity", "hive", "regulatory"],
		lastAccessDate: "2024-01-19",
		size: "12.1 GB",
		businessType: "operational",
		attrSeq: [
			{
				name: "sar_id",
				type: "string",
				comment: "Идентификатор подозрительной активности",
			},
			{ name: "customer_id", type: "string", comment: "Идентификатор клиента" },
			{
				name: "transaction_pattern",
				type: "string",
				comment: "Паттерн подозрительных транзакций",
			},
			{ name: "risk_score", type: "decimal", comment: "Оценка риска" },
			{
				name: "alert_timestamp",
				type: "timestamp",
				comment: "Время создания алерта",
			},
			{
				name: "investigation_status",
				type: "string",
				comment: "Статус расследования",
			},
			{
				name: "regulatory_filing",
				type: "boolean",
				comment: "Подача в регулятор",
			},
		],
		objectsCount: 7,
	},
	{
		id: "kafka_real_time_payments_stream",
		name: "real_time_payment_processing_stream",
		modified: false,
		type: "table",
		namespace: "payments",
		description:
			"Потоковая обработка платежей в реальном времени через Kafka и Spark Streaming для мгновенных переводов и валидации лимитов",
		createdDate: "2023-12-20",
		updatedDate: "2024-01-08",
		status: "active",
		author: "Иванова М.С.",
		version: "4.1.2",
		tags: [
			"real-time",
			"payments",
			"kafka",
			"spark-streaming",
			"instant-transfers",
		],
		lastAccessDate: "2024-01-15",
		size: "45.2 GB",
		businessType: "operational",
		attrSeq: [
			{ name: "payment_id", type: "string", comment: "Идентификатор платежа" },
			{ name: "sender_account", type: "string", comment: "Счет отправителя" },
			{ name: "receiver_account", type: "string", comment: "Счет получателя" },
			{ name: "amount", type: "decimal", comment: "Сумма платежа" },
			{ name: "currency_code", type: "string", comment: "Код валюты" },
			{
				name: "processing_timestamp",
				type: "timestamp",
				comment: "Время обработки",
			},
		],
		objectsCount: 6,
	},
	{
		id: "hdfs_market_risk_var_model",
		name: "market_risk_value_at_risk_model",
		modified: false,
		type: "view",
		namespace: "market_risk",
		description:
			"Модель расчета Value-at-Risk для рыночного риска на базе исторических данных в HDFS, обрабатываемых Spark для портфельного анализа",
		createdDate: "2024-01-08",
		updatedDate: "2024-01-16",
		status: "active",
		author: "Федоров С.А.",
		version: "2.7.1",
		tags: ["market-risk", "var", "portfolio-analysis", "spark", "hdfs"],
		lastAccessDate: "2024-01-23",
		size: "22.8 GB",
		businessType: "analytical",
		attrSeq: [
			{
				name: "portfolio_id",
				type: "string",
				comment: "Идентификатор портфеля",
			},
			{
				name: "instrument_id",
				type: "string",
				comment: "Идентификатор инструмента",
			},
			{ name: "market_value", type: "decimal", comment: "Рыночная стоимость" },
			{ name: "var_1day", type: "decimal", comment: "VaR на 1 день" },
			{ name: "var_10day", type: "decimal", comment: "VaR на 10 дней" },
			{ name: "confidence_level", type: "decimal", comment: "Уровень доверия" },
			{ name: "calculation_date", type: "date", comment: "Дата расчета" },
		],
		objectsCount: 7,
	},
	{
		id: "spark_customer_360_view_v3",
		name: "customer_360_degree_view",
		modified: true,
		type: "table",
		namespace: "customer_analytics",
		description:
			"Комплексное 360-градусное представление клиента, агрегирующее данные из всех банковских продуктов через Spark для персонализации и cross-sell анализа",
		createdDate: "2023-12-15",
		updatedDate: "2024-01-14",
		status: "active",
		author: "Морозова Л.П.",
		version: "3.5.4",
		tags: [
			"customer-360",
			"personalization",
			"cross-sell",
			"spark",
			"analytics",
		],
		lastAccessDate: "2024-01-20",
		size: "18.9 GB",
		businessType: "dimensional",
		attrSeq: [
			{ name: "customer_id", type: "string", comment: "Идентификатор клиента" },
			{
				name: "total_relationship_value",
				type: "decimal",
				comment: "Общая стоимость отношений",
			},
			{
				name: "product_holdings",
				type: "array",
				comment: "Портфель продуктов",
			},
			{ name: "risk_profile", type: "string", comment: "Профиль риска" },
			{
				name: "lifetime_value",
				type: "decimal",
				comment: "Пожизненная ценность",
			},
			{
				name: "churn_probability",
				type: "decimal",
				comment: "Вероятность оттока",
			},
		],
		objectsCount: 6,
	},
	{
		id: "hbase_trading_book_positions",
		name: "trading_book_real_time_positions",
		modified: true,
		type: "table",
		namespace: "trading",
		description:
			"Позиции торгового портфеля в реальном времени в HBase с интеграцией Spark для расчета P&L и управления лимитами по FRTB стандартам",
		createdDate: "2024-01-02",
		updatedDate: "2024-01-11",
		status: "active",
		author: "Волков А.Н.",
		version: "1.9.2",
		tags: ["trading-book", "frtb", "pnl", "hbase", "real-time"],
		lastAccessDate: "2024-01-17",
		size: "31.4 GB",
		businessType: "operational",
		attrSeq: [
			{ name: "position_id", type: "string", comment: "Идентификатор позиции" },
			{ name: "trader_id", type: "string", comment: "Идентификатор трейдера" },
			{ name: "instrument_type", type: "string", comment: "Тип инструмента" },
			{
				name: "notional_amount",
				type: "decimal",
				comment: "Номинальная сумма",
			},
			{ name: "market_value", type: "decimal", comment: "Рыночная стоимость" },
			{
				name: "unrealized_pnl",
				type: "decimal",
				comment: "Нереализованная прибыль/убыток",
			},
			{
				name: "position_timestamp",
				type: "timestamp",
				comment: "Время позиции",
			},
		],
		objectsCount: 7,
	},
	{
		id: "hdfs_regulatory_reporting_ccar",
		name: "ccar_stress_testing_model",
		modified: false,
		type: "view",
		namespace: "regulatory",
		description:
			"Модель стресс-тестирования CCAR на базе Hadoop и Spark для регулятивной отчетности ФРС США с моделированием экономических сценариев",
		createdDate: "2023-11-28",
		updatedDate: "2024-01-09",
		status: "active",
		author: "Лебедева О.В.",
		version: "2.3.1",
		tags: ["ccar", "stress-testing", "regulatory", "fed", "hadoop"],
		lastAccessDate: "2024-01-18",
		size: "67.3 GB",
		businessType: "analytical",
		attrSeq: [
			{
				name: "scenario_id",
				type: "string",
				comment: "Идентификатор сценария",
			},
			{ name: "bank_segment", type: "string", comment: "Сегмент банка" },
			{ name: "stress_loss", type: "decimal", comment: "Потери при стрессе" },
			{
				name: "capital_ratio",
				type: "decimal",
				comment: "Коэффициент капитала",
			},
			{
				name: "tier1_capital",
				type: "decimal",
				comment: "Капитал первого уровня",
			},
		],
		objectsCount: 5,
	},
	{
		id: "spark_liquidity_risk_lcr_model",
		name: "liquidity_coverage_ratio_model",
		modified: true,
		type: "table",
		namespace: "liquidity_risk",
		description:
			"Модель расчета коэффициента покрытия ликвидности (LCR) в соответствии с Basel III, использующая Spark для обработки больших объемов данных о ликвидности",
		createdDate: "2024-01-12",
		updatedDate: "2024-01-19",
		status: "active",
		author: "Новиков Р.И.",
		version: "1.6.8",
		tags: ["liquidity-risk", "lcr", "basel-iii", "spark", "regulatory"],
		lastAccessDate: "2024-01-21",
		size: "9.7 GB",
		businessType: "analytical",
		attrSeq: [
			{ name: "reporting_date", type: "date", comment: "Дата отчетности" },
			{
				name: "hqla_amount",
				type: "decimal",
				comment: "Высококачественные ликвидные активы",
			},
			{
				name: "net_cash_outflow",
				type: "decimal",
				comment: "Чистый отток денежных средств",
			},
			{ name: "lcr_ratio", type: "decimal", comment: "Коэффициент LCR" },
			{ name: "currency_code", type: "string", comment: "Код валюты" },
		],
		objectsCount: 5,
	},
	{
		id: "kafka_fraud_detection_ml_pipeline",
		name: "real_time_fraud_detection_pipeline",
		modified: false,
		type: "view",
		namespace: "fraud_prevention",
		description:
			"Конвейер машинного обучения для выявления мошенничества в реальном времени с использованием Kafka, Spark Streaming и MLlib для защиты карточных операций",
		createdDate: "2024-01-06",
		updatedDate: "2024-01-13",
		status: "active",
		author: "Соколов В.Д.",
		version: "3.1.7",
		tags: [
			"fraud-detection",
			"ml-pipeline",
			"kafka",
			"spark-streaming",
			"cards",
		],
		lastAccessDate: "2024-01-22",
		size: "28.5 GB",
		businessType: "analytical",
		attrSeq: [
			{
				name: "transaction_id",
				type: "string",
				comment: "Идентификатор транзакции",
			},
			{ name: "card_number_hash", type: "string", comment: "Хеш номера карты" },
			{ name: "fraud_score", type: "decimal", comment: "Оценка мошенничества" },
			{ name: "model_version", type: "string", comment: "Версия модели" },
			{ name: "feature_vector", type: "array", comment: "Вектор признаков" },
			{
				name: "decision_timestamp",
				type: "timestamp",
				comment: "Время принятия решения",
			},
		],
		objectsCount: 6,
	},
	{
		id: "hdfs_ifrs9_expected_loss_model",
		name: "ifrs9_expected_credit_loss_model",
		modified: true,
		type: "table",
		namespace: "accounting",
		description:
			"Модель ожидаемых кредитных потерь по IFRS 9 на базе Hadoop и Spark для расчета резервов по кредитному портфелю банка",
		createdDate: "2023-12-08",
		updatedDate: "2024-01-15",
		status: "active",
		author: "Кузнецова Т.А.",
		version: "2.8.4",
		tags: ["ifrs9", "expected-loss", "accounting", "spark", "credit-portfolio"],
		lastAccessDate: "2024-01-20",
		size: "19.6 GB",
		businessType: "analytical",
		attrSeq: [
			{ name: "loan_id", type: "string", comment: "Идентификатор кредита" },
			{
				name: "stage_classification",
				type: "string",
				comment: "Классификация по стадиям",
			},
			{
				name: "lifetime_ecl",
				type: "decimal",
				comment: "Пожизненные ожидаемые потери",
			},
			{
				name: "12month_ecl",
				type: "decimal",
				comment: "12-месячные ожидаемые потери",
			},
			{ name: "provision_amount", type: "decimal", comment: "Сумма резерва" },
			{ name: "calculation_date", type: "date", comment: "Дата расчета" },
		],
		objectsCount: 6,
	},
	{
		id: "spark_operational_risk_kri_dashboard",
		name: "operational_risk_key_indicators",
		modified: false,
		type: "view",
		namespace: "operational_risk",
		description:
			"Дашборд ключевых индикаторов операционного риска с обработкой данных через Spark для мониторинга рисков в соответствии с Basel III",
		createdDate: "2024-01-04",
		updatedDate: "2024-01-11",
		status: "active",
		author: "Павлов Н.Г.",
		version: "1.4.3",
		tags: ["operational-risk", "kri", "monitoring", "spark", "basel-iii"],
		lastAccessDate: "2024-01-19",
		size: "5.8 GB",
		businessType: "operational",
		attrSeq: [
			{ name: "kri_id", type: "string", comment: "Идентификатор KRI" },
			{ name: "business_line", type: "string", comment: "Бизнес-линия" },
			{ name: "risk_category", type: "string", comment: "Категория риска" },
			{
				name: "indicator_value",
				type: "decimal",
				comment: "Значение индикатора",
			},
			{
				name: "threshold_breach",
				type: "boolean",
				comment: "Превышение порога",
			},
			{ name: "measurement_date", type: "date", comment: "Дата измерения" },
		],
		objectsCount: 6,
	},
];

const _StyledContainer = styled(Box)(({ theme }) => ({
	height: "100vh",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
	gap: theme.spacing(2),
}));

const getBusinessTypeColor = (businessType: Model["businessType"]) => {
	switch (businessType) {
		case "analytical":
			return "primary";
		case "operational":
			return "secondary";
		case "dimensional":
			return "info";
		default:
			return "default";
	}
};

const getStatusColor = (status: Model["status"]) => {
	switch (status) {
		case "active":
			return "success";
		case "draft":
			return "warning";
		case "archived":
			return "error";
		default:
			return "default";
	}
};

const _BusinessTypeChipRenderer = ({
	value,
}: {
	value: Model["businessType"];
}) => {
	const businessTypeLabels = {
		analytical: "Аналитическая",
		operational: "Операционная",
		dimensional: "Размерная",
	};

	if (!value) return null;

	return (
		<Chip
			label={businessTypeLabels[value]}
			color={getBusinessTypeColor(value) as any}
			size="small"
			variant="outlined"
		/>
	);
};

const _TechnicalTypeChipRenderer = ({ value }: { value: Model["type"] }) => {
	const technicalTypeLabels = {
		table: "Таблица",
		view: "Представление",
		rdd: "RDD",
		unresolved: "Неопределенный",
	};

	return (
		<Chip
			label={technicalTypeLabels[value]}
			color="default"
			size="small"
			variant="filled"
		/>
	);
};

const StatusChipRenderer = ({ value }: { value: Model["status"] }) => {
	const statusLabels = {
		active: "Активная",
		draft: "Черновик",
		archived: "Архивная",
	};

	if (!value) return null;

	return (
		<Chip
			label={statusLabels[value]}
			color={getStatusColor(value) as any}
			size="small"
		/>
	);
};

const TagsRenderer = ({ value }: { value: string[] }) => {
	return (
		<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
			{value.map((tag, index) => (
				<Chip
					key={index}
					label={tag}
					size="small"
					variant="outlined"
					sx={{ fontSize: "0.7rem", height: "20px" }}
				/>
			))}
		</Box>
	);
};

const ActionRenderer = ({ data }: { data: Model }) => {
	const [selectedModel, setSelectedModel] = useState<Model | null>(null);
	const [isGraphOpen, setIsGraphOpen] = useState(false);

	const handleViewModel = () => {
		setSelectedModel(data);
		setIsGraphOpen(true);
	};

	const handleCloseGraph = () => {
		setIsGraphOpen(false);
		setSelectedModel(null);
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={handleViewModel}
				sx={{ color: "primary.main" }}
			>
				<Visibility fontSize="small" />
			</IconButton>
			{selectedModel && (
				<ModelGraphWindow
					isOpen={isGraphOpen}
					onClose={handleCloseGraph}
					model={selectedModel}
				/>
			)}
		</>
	);
};

export const ModelsPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const { mode } = useColorScheme();

	const filteredModels = useMemo(() => {
		if (!searchQuery.trim()) return mockModels;

		return mockModels.filter(
			(model) =>
				(model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false) ||
				(model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false) ||
				(model.author?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false) ||
				(model.tags?.some((tag) =>
					tag.toLowerCase().includes(searchQuery.toLowerCase()),
				) ??
					false),
		);
	}, [searchQuery]);

	const columnDefs: ColDef<Model>[] = [
		{
			headerName: "ID",
			field: "id",
			width: 150,
			pinned: "left",
		},
		{
			headerName: "Название",
			field: "name",
			flex: 2,
			minWidth: 200,
			cellStyle: { fontWeight: "bold" },
		},
		{
			headerName: "Пространство имен",
			field: "namespace",
			width: 140,
		},
		{
			headerName: "Тип",
			field: "type",
			width: 140,
			cellRenderer: (params: any) => (
				<Chip
					label={params.value}
					color="primary"
					size="small"
					variant="outlined"
				/>
			),
		},
		{
			headerName: "Изменен",
			field: "modified",
			width: 100,
			cellRenderer: (params: any) => (
				<Chip
					label={params.value ? "Да" : "Нет"}
					color={params.value ? "warning" : "success"}
					size="small"
					variant="outlined"
				/>
			),
		},
		{
			headerName: "Описание",
			field: "description",
			flex: 3,
			minWidth: 300,
			autoHeight: true,
		},
		{
			headerName: "Статус",
			field: "status",
			width: 120,
			cellRenderer: StatusChipRenderer,
		},
		{
			headerName: "Автор",
			field: "author",
			width: 150,
		},
		{
			headerName: "Версия",
			field: "version",
			width: 100,
		},
		{
			headerName: "Атрибуты",
			field: "objectsCount",
			width: 100,
			type: "numericColumn",
		},
		{
			headerName: "Размер",
			field: "size",
			width: 100,
		},
		{
			headerName: "Теги",
			field: "tags",
			flex: 1,
			minWidth: 200,
			cellRenderer: TagsRenderer,
		},
		{
			headerName: "Создана",
			field: "createdDate",
			width: 120,
			type: "dateColumn",
		},
		{
			headerName: "Обновлена",
			field: "updatedDate",
			width: 120,
			type: "dateColumn",
		},
		{
			headerName: "Последний доступ",
			field: "lastAccessDate",
			width: 140,
			type: "dateColumn",
		},
		{
			headerName: "Действия",
			width: 100,
			cellRenderer: ActionRenderer,
			sortable: false,
			filter: false,
			pinned: "right",
		},
	];

	return (
		<div>
			<Header>
				<Flex alignItems="center" gap={10} width="666px">
					<TextField
						placeholder="Поиск моделей по названию, описанию, автору или тегам..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						fullWidth
						size="small"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
						}}
					/>
					<Chip
						label={`${filteredModels.length} моделей`}
						color="primary"
						variant="outlined"
					/>
				</Flex>
			</Header>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<AgGridReact<Model>
					rowData={filteredModels}
					columnDefs={columnDefs}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					defaultColDef={{
						sortable: true,
						filter: true,
						resizable: true,
					}}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					animateRows={true}
					rowSelection="single"
					suppressRowClickSelection={true}
					// getRowHeight={() => "auto"}
					domLayout="normal"
				/>
			</Box>
		</div>
	);
};
