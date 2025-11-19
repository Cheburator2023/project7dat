import { create } from "zustand";
import type { DataLineageSchema } from "@react-client/types/dataLineage";
import type { JsonDataItem } from "@react-client/api/jsonDataV2Api";
import { jsonDataV2Service } from "@react-client/api/jsonDataV2Api";
import { featureFlags } from "@react-client/config/featureFlags";

export interface Process {
	id: string;
	name: string;
	type: "ETL" | "ELT" | "Data Pipeline" | "Analytics" | "ML Pipeline";
	description: string;
	createdAt: string;
	status: "active" | "inactive" | "error";
	owner?: string;
	tags: string[];
	dataLineage?: DataLineageSchema;
}

interface ProcessesState {
	processes: Process[];
	searchQuery: string;
	filteredProcesses: Process[];
	isLoading: boolean;
	error: string | null;
	currentProcessData: DataLineageSchema | null;
}

interface ProcessesActions {
	setProcesses: (processes: Process[]) => void;
	setSearchQuery: (query: string) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setCurrentProcessData: (data: DataLineageSchema | null) => void;
	loadProcesses: () => Promise<void>;
	loadProcessData: (processId: string) => Promise<void>;
	filterProcesses: () => void;
}

type ProcessesStore = ProcessesState & ProcessesActions;

const mapJsonDataItemToProcess = (item: JsonDataItem): Process => {
	const data = item.data as DataLineageSchema;
	return {
		id: item.id,
		name: item.name,
		type: "ETL",
		description: item.description || data?.desc?.appName || "",
		createdAt: item.createdAt,
		status: item.deprecated ? "inactive" : "active",
		owner: item.authorName || undefined,
		tags: [],
		dataLineage: data,
	};
};

/* const initialState: ProcessesState = {
	processes: [],
	searchQuery: "",
	filteredProcesses: [],
	isLoading: false,
	error: null,
	currentProcessData: null,
};

const useProcessesStore = create<ProcessesStore>((set) => ({
	...initialState,
	setProcesses: (processes) => set({ processes }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setLoading: (loading) => set({ isLoading: loading }),
	setError: (error) => set({ error }),
	setCurrentProcessData: (data) => set({ currentProcessData: data }),
	loadProcesses: async () => {
		try {
			const response = await jsonDataV2Service.getJsonDataV2();
			const processes = response.data.map(mapJsonDataItemToProcess);
			set({ processes, isLoading: false });
		} catch (error) {
			set({ error: error.message, isLoading: false });
		}
	},
	loadProcessData: async (processId) => {
		try {
			const response = await jsonDataV2Service.getJsonDataV2(processId);
			const data = response.data.data as DataLineageSchema;
			set({ currentProcessData: data, isLoading: false });
		} catch (error) {
			set({ error: error.message, isLoading: false });
		}
	},
	filterProcesses: () => {
		set((state) => ({
			filteredProcesses: state.processes.filter((process) =>
				process.name.toLowerCase().includes(state.searchQuery.toLowerCase())
			),
		}));
		tags: ["ml", "features", "preprocessing", "models"],
		dataLineage: 
				appId: "application_ml_features",
				appName: "ml_feature_engineering",,
			entities: [
					id: "source_customer_data",
					modified: false,
					type: "table",
					namespace: "raw_data",
					name: "customer_raw",
					description: "Исходные данные о клиентах",
					attrSeq: [name: "customer_id", type: "STRING", comment: "ID клиента" ,name: "age", type: "INT", comment: "Возраст" ,name: "income", type: "DECIMAL", comment: "Доход" ,
							name: "purchase_history",
							type: "STRING",
							comment: "История покупок",,
					],,
					id: "model_feature_store",
					modified: true,
					type: "table",
					namespace: "ml",
					name: "customer_features",
					description: "Признаки для ML модели",
					attrSeq: [name: "customer_id", type: "STRING", comment: "ID клиента" ,name: "age_group", type: "STRING", comment: "Возрастная группа" ,
							name: "income_bracket",
							type: "STRING",
							comment: "Доходная группа",,
							name: "purchase_frequency",
							type: "DECIMAL",
							comment: "Частота покупок",,
							name: "avg_purchase_amount",
							type: "DECIMAL",
							comment: "Средняя сумма покупки",,
					],,
					id: "datamart_ml_predictions",
					modified: true,
					type: "view",
					namespace: "ml",
					name: "customer_predictions",
					description: "Предсказания ML модели",
					attrSeq: [name: "customer_id", type: "STRING", comment: "ID клиента" ,
							name: "churn_probability",
							type: "DECIMAL",
							comment: "Вероятность оттока",,
							name: "lifetime_value_prediction",
							type: "DECIMAL",
							comment: "Предсказанная LTV",,
							name: "recommendation_score",
							type: "DECIMAL",
							comment: "Скор рекомендации",,
					],,
			],
			mappings: [
					id: 1,
					entityId: "model_feature_store",
					deps: [
							entityId: "source_customer_data",
							attrMaps: [src: "customer_id", dst: "customer_id" ,src: "age", dst: "age_group" ,src: "income", dst: "income_bracket" ,src: "purchase_history", dst: "purchase_frequency" ,
							],
							atrDeps: [],,
					],,
					id: 2,
					entityId: "datamart_ml_predictions",
					deps: [
							entityId: "model_feature_store",
							attrMaps: [src: "customer_id", dst: "customer_id" ,src: "purchase_frequency", dst: "churn_probability" ,
									src: "avg_purchase_amount",
									dst: "lifetime_value_prediction",,
							],
							atrDeps: [],,
					],,
			],
			failedMappings: [],,
	},
	{
		id: "proc_4",
		name: "customer_data_warehouse_etl",
		type: "ELT",
		createdAt: "2024-01-12T16:20:00Z",
		description: "Загрузка и трансформация данных клиентов в хранилище данных",
		status: "active",
		owner: "data_team",
		tags: ["warehouse", "customer", "etl", "batch"],
		dataLineage: {
			desc: {
				appId: "application_warehouse_etl",
				appName: "customer_data_warehouse_etl",
			},
			entities: [
				{
					id: "source_crm_system",
					modified: false,
					type: "table",
					namespace: "external",
					name: "crm_customers",
					description: "Данные из CRM системы",
					attrSeq: [
						{ name: "crm_id", type: "STRING", comment: "ID в CRM" },
						{
							name: "company_name",
							type: "STRING",
							comment: "Название компании",
						},
						{
							name: "contact_person",
							type: "STRING",
							comment: "Контактное лицо",
						},
						{ name: "industry", type: "STRING", comment: "Отрасль" },
					],
				},
				{
					id: "source_billing_system",
					modified: false,
					type: "table",
					namespace: "external",
					name: "billing_data",
					description: "Данные из биллинговой системы",
					attrSeq: [
						{ name: "customer_id", type: "STRING", comment: "ID клиента" },
						{
							name: "billing_amount",
							type: "DECIMAL",
							comment: "Сумма к оплате",
						},
						{
							name: "payment_status",
							type: "STRING",
							comment: "Статус оплаты",
						},
						{
							name: "billing_date",
							type: "DATE",
							comment: "Дата выставления счета",
						},
					],
				},
				{
					id: "model_customer_warehouse",
					modified: true,
					type: "table",
					namespace: "warehouse",
					name: "dim_customer",
					description: "Измерение клиентов в хранилище",
					attrSeq: [
						{
							name: "customer_key",
							type: "BIGINT",
							comment: "Суррогатный ключ",
						},
						{ name: "customer_id", type: "STRING", comment: "Бизнес ключ" },
						{
							name: "company_name",
							type: "STRING",
							comment: "Название компании",
						},
						{ name: "industry", type: "STRING", comment: "Отрасль" },
						{
							name: "total_billing",
							type: "DECIMAL",
							comment: "Общая сумма счетов",
						},
					],
				},
				{
					id: "datamart_customer_summary",
					modified: true,
					type: "view",
					namespace: "reporting",
					name: "customer_summary",
					description: "Сводка по клиентам",
					attrSeq: [
						{
							name: "customer_name",
							type: "STRING",
							comment: "Название клиента",
						},
						{
							name: "industry_group",
							type: "STRING",
							comment: "Группа отраслей",
						},
						{
							name: "revenue_total",
							type: "DECIMAL",
							comment: "Общая выручка",
						},
						{
							name: "payment_reliability",
							type: "STRING",
							comment: "Надежность платежей",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_customer_warehouse",
					deps: [
						{
							entityId: "source_crm_system",
							attrMaps: [
								{ src: "crm_id", dst: "customer_id" },
								{ src: "company_name", dst: "company_name" },
								{ src: "industry", dst: "industry" },
							],
							atrDeps: [],
						},
						{
							entityId: "source_billing_system",
							attrMaps: [
								{ src: "customer_id", dst: "customer_id" },
								{ src: "billing_amount", dst: "total_billing" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_customer_summary",
					deps: [
						{
							entityId: "model_customer_warehouse",
							attrMaps: [
								{ src: "company_name", dst: "customer_name" },
								{ src: "industry", dst: "industry_group" },
								{ src: "total_billing", dst: "revenue_total" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_5",
		name: "real_time_streaming_pipeline",
		type: "Data Pipeline",
		createdAt: "2024-01-11T09:00:00Z",
		description: "Потоковая обработка данных в реальном времени",
		status: "active",
		owner: "streaming_team",
		tags: ["streaming", "realtime", "kafka", "events"],
		dataLineage: {
			desc: {
				appId: "application_streaming_pipeline",
				appName: "real_time_streaming_pipeline",
			},
			entities: [
				{
					id: "source_event_stream",
					modified: false,
					type: "table",
					namespace: "kafka",
					name: "user_events",
					description: "Поток событий пользователей",
					attrSeq: [
						{ name: "event_id", type: "STRING", comment: "ID события" },
						{ name: "user_id", type: "STRING", comment: "ID пользователя" },
						{ name: "event_type", type: "STRING", comment: "Тип события" },
						{ name: "timestamp", type: "TIMESTAMP", comment: "Время события" },
						{ name: "properties", type: "STRING", comment: "Свойства события" },
					],
				},
				{
					id: "source_sensor_data",
					modified: false,
					type: "table",
					namespace: "iot",
					name: "sensor_readings",
					description: "Данные с датчиков IoT",
					attrSeq: [
						{ name: "sensor_id", type: "STRING", comment: "ID датчика" },
						{ name: "reading_value", type: "DECIMAL", comment: "Показание" },
						{
							name: "reading_time",
							type: "TIMESTAMP",
							comment: "Время показания",
						},
						{ name: "location", type: "STRING", comment: "Местоположение" },
					],
				},
				{
					id: "model_realtime_aggregates",
					modified: true,
					type: "table",
					namespace: "streaming",
					name: "realtime_metrics",
					description: "Агрегаты в реальном времени",
					attrSeq: [
						{ name: "window_start", type: "TIMESTAMP", comment: "Начало окна" },
						{ name: "window_end", type: "TIMESTAMP", comment: "Конец окна" },
						{
							name: "event_count",
							type: "BIGINT",
							comment: "Количество событий",
						},
						{
							name: "unique_users",
							type: "BIGINT",
							comment: "Уникальные пользователи",
						},
						{
							name: "avg_sensor_value",
							type: "DECIMAL",
							comment: "Среднее значение датчиков",
						},
					],
				},
				{
					id: "datamart_realtime_dashboard",
					modified: true,
					type: "view",
					namespace: "realtime",
					name: "live_dashboard",
					description: "Дашборд реального времени",
					attrSeq: [
						{
							name: "current_time",
							type: "TIMESTAMP",
							comment: "Текущее время",
						},
						{
							name: "events_per_minute",
							type: "DECIMAL",
							comment: "События в минуту",
						},
						{
							name: "active_users_now",
							type: "BIGINT",
							comment: "Активные пользователи сейчас",
						},
						{
							name: "system_health",
							type: "STRING",
							comment: "Состояние системы",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_realtime_aggregates",
					deps: [
						{
							entityId: "source_event_stream",
							attrMaps: [
								{ src: "event_id", dst: "event_count" },
								{ src: "user_id", dst: "unique_users" },
								{ src: "timestamp", dst: "window_start" },
							],
							atrDeps: [],
						},
						{
							entityId: "source_sensor_data",
							attrMaps: [
								{ src: "reading_value", dst: "avg_sensor_value" },
								{ src: "reading_time", dst: "window_end" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_realtime_dashboard",
					deps: [
						{
							entityId: "model_realtime_aggregates",
							attrMaps: [
								{ src: "window_end", dst: "current_time" },
								{ src: "event_count", dst: "events_per_minute" },
								{ src: "unique_users", dst: "active_users_now" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_6",
		name: "inventory_management_etl",
		type: "ETL",
		createdAt: "2024-01-10T12:30:00Z",
		description:
			"Обработка данных инвентаризации и управления складскими запасами",
		status: "active",
		owner: "inventory_team",
		tags: ["inventory", "warehouse", "stock", "management"],
		dataLineage: {
			desc: {
				appId: "application_inventory_etl",
				appName: "inventory_management_etl",
			},
			entities: [
				{
					id: "source_warehouse_data",
					modified: false,
					type: "table",
					namespace: "raw_data",
					name: "warehouse_inventory",
					description: "Данные складских запасов",
					attrSeq: [
						{ name: "item_id", type: "STRING", comment: "ID товара" },
						{ name: "quantity", type: "INT", comment: "Количество" },
						{ name: "location", type: "STRING", comment: "Местоположение" },
						{
							name: "last_updated",
							type: "TIMESTAMP",
							comment: "Последнее обновление",
						},
					],
				},
				{
					id: "model_inventory_summary",
					modified: true,
					type: "table",
					namespace: "warehouse",
					name: "inventory_summary",
					description: "Сводка по инвентарю",
					attrSeq: [
						{ name: "item_id", type: "STRING", comment: "ID товара" },
						{
							name: "total_quantity",
							type: "INT",
							comment: "Общее количество",
						},
						{
							name: "reorder_level",
							type: "INT",
							comment: "Уровень перезаказа",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_inventory_summary",
					deps: [
						{
							entityId: "source_warehouse_data",
							attrMaps: [
								{ src: "item_id", dst: "item_id" },
								{ src: "quantity", dst: "total_quantity" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_7",
		name: "financial_reporting_pipeline",
		type: "Analytics",
		createdAt: "2024-01-09T15:45:00Z",
		description: "Генерация финансовых отчетов и аналитики",
		status: "active",
		owner: "finance_team",
		tags: ["finance", "reporting", "analytics", "monthly"],
		dataLineage: {
			desc: {
				appId: "application_financial_reporting",
				appName: "financial_reporting_pipeline",
			},
			entities: [
				{
					id: "source_accounting_data",
					modified: false,
					type: "table",
					namespace: "finance",
					name: "accounting_records",
					description: "Бухгалтерские записи",
					attrSeq: [
						{ name: "account_id", type: "STRING", comment: "ID счета" },
						{ name: "amount", type: "DECIMAL", comment: "Сумма" },
						{
							name: "transaction_date",
							type: "DATE",
							comment: "Дата транзакции",
						},
						{ name: "description", type: "STRING", comment: "Описание" },
					],
				},
				{
					id: "datamart_financial_reports",
					modified: true,
					type: "view",
					namespace: "reporting",
					name: "monthly_financial_report",
					description: "Месячный финансовый отчет",
					attrSeq: [
						{ name: "report_month", type: "DATE", comment: "Месяц отчета" },
						{
							name: "total_revenue",
							type: "DECIMAL",
							comment: "Общая выручка",
						},
						{
							name: "total_expenses",
							type: "DECIMAL",
							comment: "Общие расходы",
						},
						{ name: "net_profit", type: "DECIMAL", comment: "Чистая прибыль" },
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "datamart_financial_reports",
					deps: [
						{
							entityId: "source_accounting_data",
							attrMaps: [
								{ src: "amount", dst: "total_revenue" },
								{ src: "transaction_date", dst: "report_month" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_8",
		name: "product_recommendation_ml",
		type: "ML Pipeline",
		createdAt: "2024-01-08T11:20:00Z",
		description: "Система рекомендаций товаров на основе машинного обучения",
		status: "active",
		owner: "ml_team",
		tags: ["ml", "recommendations", "products", "collaborative"],
		dataLineage: {
			desc: {
				appId: "application_product_recommendations",
				appName: "product_recommendation_ml",
			},
			entities: [
				{
					id: "source_user_interactions",
					modified: false,
					type: "table",
					namespace: "raw_data",
					name: "user_product_interactions",
					description: "Взаимодействия пользователей с товарами",
					attrSeq: [
						{ name: "user_id", type: "STRING", comment: "ID пользователя" },
						{ name: "product_id", type: "STRING", comment: "ID товара" },
						{
							name: "interaction_type",
							type: "STRING",
							comment: "Тип взаимодействия",
						},
						{ name: "rating", type: "DECIMAL", comment: "Рейтинг" },
					],
				},
				{
					id: "model_recommendation_features",
					modified: true,
					type: "table",
					namespace: "ml",
					name: "recommendation_features",
					description: "Признаки для рекомендательной системы",
					attrSeq: [
						{ name: "user_id", type: "STRING", comment: "ID пользователя" },
						{ name: "product_id", type: "STRING", comment: "ID товара" },
						{
							name: "similarity_score",
							type: "DECIMAL",
							comment: "Скор схожести",
						},
						{
							name: "popularity_score",
							type: "DECIMAL",
							comment: "Скор популярности",
						},
					],
				},
				{
					id: "datamart_recommendations",
					modified: true,
					type: "view",
					namespace: "ml",
					name: "user_recommendations",
					description: "Рекомендации для пользователей",
					attrSeq: [
						{ name: "user_id", type: "STRING", comment: "ID пользователя" },
						{
							name: "recommended_products",
							type: "STRING",
							comment: "Рекомендованные товары",
						},
						{
							name: "confidence_score",
							type: "DECIMAL",
							comment: "Уверенность рекомендации",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_recommendation_features",
					deps: [
						{
							entityId: "source_user_interactions",
							attrMaps: [
								{ src: "user_id", dst: "user_id" },
								{ src: "product_id", dst: "product_id" },
								{ src: "rating", dst: "similarity_score" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_recommendations",
					deps: [
						{
							entityId: "model_recommendation_features",
							attrMaps: [
								{ src: "user_id", dst: "user_id" },
								{ src: "product_id", dst: "recommended_products" },
								{ src: "similarity_score", dst: "confidence_score" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_9",
		name: "supply_chain_optimization",
		type: "Data Pipeline",
		createdAt: "2024-01-07T13:15:00Z",
		description: "Оптимизация цепочки поставок и логистики",
		status: "inactive",
		owner: "logistics_team",
		tags: ["supply_chain", "logistics", "optimization", "delivery"],
		dataLineage: {
			desc: {
				appId: "application_supply_chain",
				appName: "supply_chain_optimization",
			},
			entities: [
				{
					id: "source_supplier_data",
					modified: false,
					type: "table",
					namespace: "external",
					name: "supplier_deliveries",
					description: "Данные поставок от поставщиков",
					attrSeq: [
						{ name: "supplier_id", type: "STRING", comment: "ID поставщика" },
						{ name: "delivery_date", type: "DATE", comment: "Дата поставки" },
						{
							name: "delivery_time",
							type: "INT",
							comment: "Время доставки (дни)",
						},
						{ name: "cost", type: "DECIMAL", comment: "Стоимость" },
					],
				},
				{
					id: "model_supply_metrics",
					modified: true,
					type: "table",
					namespace: "logistics",
					name: "supply_chain_metrics",
					description: "Метрики цепочки поставок",
					attrSeq: [
						{ name: "supplier_id", type: "STRING", comment: "ID поставщика" },
						{
							name: "avg_delivery_time",
							type: "DECIMAL",
							comment: "Среднее время доставки",
						},
						{
							name: "reliability_score",
							type: "DECIMAL",
							comment: "Скор надежности",
						},
						{
							name: "cost_efficiency",
							type: "DECIMAL",
							comment: "Эффективность по стоимости",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_supply_metrics",
					deps: [
						{
							entityId: "source_supplier_data",
							attrMaps: [
								{ src: "supplier_id", dst: "supplier_id" },
								{ src: "delivery_time", dst: "avg_delivery_time" },
								{ src: "cost", dst: "cost_efficiency" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_10",
		name: "fraud_detection_system",
		type: "ML Pipeline",
		createdAt: "2024-01-06T10:00:00Z",
		description: "Система обнаружения мошенничества в реальном времени",
		status: "active",
		owner: "security_team",
		tags: ["fraud", "detection", "security", "realtime", "ml"],
		dataLineage: {
			desc: {
				appId: "application_fraud_detection",
				appName: "fraud_detection_system",
			},
			entities: [
				{
					id: "source_transaction_stream",
					modified: false,
					type: "table",
					namespace: "payments",
					name: "payment_transactions",
					description: "Поток платежных транзакций",
					attrSeq: [
						{
							name: "transaction_id",
							type: "STRING",
							comment: "ID транзакции",
						},
						{ name: "amount", type: "DECIMAL", comment: "Сумма" },
						{ name: "merchant_id", type: "STRING", comment: "ID мерчанта" },
						{ name: "card_number", type: "STRING", comment: "Номер карты" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время транзакции",
						},
					],
				},
				{
					id: "model_fraud_features",
					modified: true,
					type: "table",
					namespace: "security",
					name: "fraud_detection_features",
					description: "Признаки для обнаружения мошенничества",
					attrSeq: [
						{
							name: "transaction_id",
							type: "STRING",
							comment: "ID транзакции",
						},
						{ name: "risk_score", type: "DECIMAL", comment: "Скор риска" },
						{
							name: "velocity_check",
							type: "BOOLEAN",
							comment: "Проверка скорости",
						},
						{
							name: "location_anomaly",
							type: "BOOLEAN",
							comment: "Аномалия местоположения",
						},
					],
				},
				{
					id: "datamart_fraud_alerts",
					modified: true,
					type: "view",
					namespace: "security",
					name: "fraud_alerts",
					description: "Алерты о мошенничестве",
					attrSeq: [
						{ name: "alert_id", type: "STRING", comment: "ID алерта" },
						{
							name: "transaction_id",
							type: "STRING",
							comment: "ID транзакции",
						},
						{
							name: "fraud_probability",
							type: "DECIMAL",
							comment: "Вероятность мошенничества",
						},
						{ name: "alert_level", type: "STRING", comment: "Уровень алерта" },
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_fraud_features",
					deps: [
						{
							entityId: "source_transaction_stream",
							attrMaps: [
								{ src: "transaction_id", dst: "transaction_id" },
								{ src: "amount", dst: "risk_score" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_fraud_alerts",
					deps: [
						{
							entityId: "model_fraud_features",
							attrMaps: [
								{ src: "transaction_id", dst: "transaction_id" },
								{ src: "risk_score", dst: "fraud_probability" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_11",
		name: "hr_analytics_dashboard",
		type: "Analytics",
		createdAt: "2024-01-05T14:30:00Z",
		description: "Аналитика HR данных и дашборд для управления персоналом",
		status: "active",
		owner: "hr_team",
		tags: ["hr", "analytics", "employees", "dashboard"],
		dataLineage: {
			desc: {
				appId: "application_hr_analytics",
				appName: "hr_analytics_dashboard",
			},
			entities: [
				{
					id: "source_employee_data",
					modified: false,
					type: "table",
					namespace: "hr",
					name: "employee_records",
					description: "Записи о сотрудниках",
					attrSeq: [
						{ name: "employee_id", type: "STRING", comment: "ID сотрудника" },
						{ name: "department", type: "STRING", comment: "Отдел" },
						{ name: "position", type: "STRING", comment: "Должность" },
						{ name: "salary", type: "DECIMAL", comment: "Зарплата" },
						{ name: "hire_date", type: "DATE", comment: "Дата найма" },
					],
				},
				{
					id: "model_hr_metrics",
					modified: true,
					type: "table",
					namespace: "hr",
					name: "hr_analytics",
					description: "HR аналитика",
					attrSeq: [
						{ name: "department", type: "STRING", comment: "Отдел" },
						{
							name: "avg_salary",
							type: "DECIMAL",
							comment: "Средняя зарплата",
						},
						{
							name: "employee_count",
							type: "INT",
							comment: "Количество сотрудников",
						},
						{
							name: "turnover_rate",
							type: "DECIMAL",
							comment: "Текучесть кадров",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_hr_metrics",
					deps: [
						{
							entityId: "source_employee_data",
							attrMaps: [
								{ src: "department", dst: "department" },
								{ src: "salary", dst: "avg_salary" },
								{ src: "employee_id", dst: "employee_count" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_12",
		name: "social_media_sentiment_analysis",
		type: "ML Pipeline",
		createdAt: "2024-01-04T16:45:00Z",
		description: "Анализ тональности социальных медиа и обработка отзывов",
		status: "active",
		owner: "marketing_team",
		tags: ["sentiment", "social_media", "nlp", "marketing"],
		dataLineage: {
			desc: {
				appId: "application_sentiment_analysis",
				appName: "social_media_sentiment_analysis",
			},
			entities: [
				{
					id: "source_social_posts",
					modified: false,
					type: "table",
					namespace: "social",
					name: "social_media_posts",
					description: "Посты из социальных сетей",
					attrSeq: [
						{ name: "post_id", type: "STRING", comment: "ID поста" },
						{ name: "content", type: "STRING", comment: "Содержание" },
						{ name: "platform", type: "STRING", comment: "Платформа" },
						{ name: "author", type: "STRING", comment: "Автор" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время публикации",
						},
					],
				},
				{
					id: "model_sentiment_scores",
					modified: true,
					type: "table",
					namespace: "ml",
					name: "sentiment_analysis",
					description: "Результаты анализа тональности",
					attrSeq: [
						{ name: "post_id", type: "STRING", comment: "ID поста" },
						{
							name: "sentiment_score",
							type: "DECIMAL",
							comment: "Скор тональности",
						},
						{
							name: "sentiment_label",
							type: "STRING",
							comment: "Метка тональности",
						},
						{ name: "confidence", type: "DECIMAL", comment: "Уверенность" },
					],
				},
				{
					id: "datamart_brand_sentiment",
					modified: true,
					type: "view",
					namespace: "marketing",
					name: "brand_sentiment_summary",
					description: "Сводка тональности бренда",
					attrSeq: [
						{ name: "date", type: "DATE", comment: "Дата" },
						{ name: "platform", type: "STRING", comment: "Платформа" },
						{
							name: "positive_mentions",
							type: "INT",
							comment: "Позитивные упоминания",
						},
						{
							name: "negative_mentions",
							type: "INT",
							comment: "Негативные упоминания",
						},
						{
							name: "overall_sentiment",
							type: "DECIMAL",
							comment: "Общая тональность",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_sentiment_scores",
					deps: [
						{
							entityId: "source_social_posts",
							attrMaps: [
								{ src: "post_id", dst: "post_id" },
								{ src: "content", dst: "sentiment_score" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_brand_sentiment",
					deps: [
						{
							entityId: "model_sentiment_scores",
							attrMaps: [
								{ src: "sentiment_score", dst: "overall_sentiment" },
								{ src: "sentiment_label", dst: "positive_mentions" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_13",
		name: "energy_consumption_monitoring",
		type: "Data Pipeline",
		createdAt: "2024-01-03T09:20:00Z",
		description: "Мониторинг потребления энергии и оптимизация ресурсов",
		status: "active",
		owner: "facilities_team",
		tags: ["energy", "monitoring", "iot", "optimization"],
		dataLineage: {
			desc: {
				appId: "application_energy_monitoring",
				appName: "energy_consumption_monitoring",
			},
			entities: [
				{
					id: "source_energy_sensors",
					modified: false,
					type: "table",
					namespace: "iot",
					name: "energy_meter_readings",
					description: "Показания счетчиков энергии",
					attrSeq: [
						{ name: "meter_id", type: "STRING", comment: "ID счетчика" },
						{ name: "reading_value", type: "DECIMAL", comment: "Показание" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время показания",
						},
						{ name: "building_id", type: "STRING", comment: "ID здания" },
					],
				},
				{
					id: "model_energy_consumption",
					modified: true,
					type: "table",
					namespace: "facilities",
					name: "energy_consumption_summary",
					description: "Сводка потребления энергии",
					attrSeq: [
						{ name: "building_id", type: "STRING", comment: "ID здания" },
						{
							name: "daily_consumption",
							type: "DECIMAL",
							comment: "Дневное потребление",
						},
						{
							name: "peak_usage_time",
							type: "TIMESTAMP",
							comment: "Время пикового потребления",
						},
						{
							name: "efficiency_score",
							type: "DECIMAL",
							comment: "Скор эффективности",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_energy_consumption",
					deps: [
						{
							entityId: "source_energy_sensors",
							attrMaps: [
								{ src: "building_id", dst: "building_id" },
								{ src: "reading_value", dst: "daily_consumption" },
								{ src: "timestamp", dst: "peak_usage_time" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_14",
		name: "quality_assurance_metrics",
		type: "Analytics",
		createdAt: "2024-01-02T11:10:00Z",
		description: "Метрики качества продукции и контроль производства",
		status: "active",
		owner: "qa_team",
		tags: ["quality", "manufacturing", "metrics", "control"],
		dataLineage: {
			desc: {
				appId: "application_qa_metrics",
				appName: "quality_assurance_metrics",
			},
			entities: [
				{
					id: "source_production_data",
					modified: false,
					type: "table",
					namespace: "manufacturing",
					name: "production_logs",
					description: "Логи производства",
					attrSeq: [
						{ name: "batch_id", type: "STRING", comment: "ID партии" },
						{ name: "product_id", type: "STRING", comment: "ID продукта" },
						{
							name: "defect_count",
							type: "INT",
							comment: "Количество дефектов",
						},
						{
							name: "production_date",
							type: "DATE",
							comment: "Дата производства",
						},
					],
				},
				{
					id: "model_quality_metrics",
					modified: true,
					type: "table",
					namespace: "qa",
					name: "quality_control_metrics",
					description: "Метрики контроля качества",
					attrSeq: [
						{ name: "product_id", type: "STRING", comment: "ID продукта" },
						{ name: "defect_rate", type: "DECIMAL", comment: "Процент брака" },
						{
							name: "quality_score",
							type: "DECIMAL",
							comment: "Скор качества",
						},
						{ name: "trend", type: "STRING", comment: "Тренд качества" },
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_quality_metrics",
					deps: [
						{
							entityId: "source_production_data",
							attrMaps: [
								{ src: "product_id", dst: "product_id" },
								{ src: "defect_count", dst: "defect_rate" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_15",
		name: "website_analytics_etl",
		type: "ETL",
		createdAt: "2024-01-01T08:00:00Z",
		description: "Обработка веб-аналитики и пользовательского поведения",
		status: "active",
		owner: "web_team",
		tags: ["web", "analytics", "user_behavior", "tracking"],
		dataLineage: {
			desc: {
				appId: "application_web_analytics",
				appName: "website_analytics_etl",
			},
			entities: [
				{
					id: "source_web_logs",
					modified: false,
					type: "table",
					namespace: "web",
					name: "access_logs",
					description: "Логи доступа к сайту",
					attrSeq: [
						{ name: "session_id", type: "STRING", comment: "ID сессии" },
						{ name: "user_id", type: "STRING", comment: "ID пользователя" },
						{ name: "page_url", type: "STRING", comment: "URL страницы" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время посещения",
						},
						{ name: "user_agent", type: "STRING", comment: "User Agent" },
					],
				},
				{
					id: "model_web_metrics",
					modified: true,
					type: "table",
					namespace: "analytics",
					name: "web_analytics_summary",
					description: "Сводка веб-аналитики",
					attrSeq: [
						{ name: "page_url", type: "STRING", comment: "URL страницы" },
						{
							name: "page_views",
							type: "BIGINT",
							comment: "Просмотры страницы",
						},
						{
							name: "unique_visitors",
							type: "BIGINT",
							comment: "Уникальные посетители",
						},
						{
							name: "avg_session_duration",
							type: "DECIMAL",
							comment: "Средняя длительность сессии",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_web_metrics",
					deps: [
						{
							entityId: "source_web_logs",
							attrMaps: [
								{ src: "page_url", dst: "page_url" },
								{ src: "session_id", dst: "page_views" },
								{ src: "user_id", dst: "unique_visitors" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_16",
		name: "predictive_maintenance_ml",
		type: "ML Pipeline",
		createdAt: "2023-12-31T17:30:00Z",
		description: "Предиктивное обслуживание оборудования с использованием ML",
		status: "inactive",
		owner: "maintenance_team",
		tags: ["predictive", "maintenance", "ml", "equipment"],
		dataLineage: {
			desc: {
				appId: "application_predictive_maintenance",
				appName: "predictive_maintenance_ml",
			},
			entities: [
				{
					id: "source_equipment_sensors",
					modified: false,
					type: "table",
					namespace: "iot",
					name: "equipment_telemetry",
					description: "Телеметрия оборудования",
					attrSeq: [
						{
							name: "equipment_id",
							type: "STRING",
							comment: "ID оборудования",
						},
						{ name: "temperature", type: "DECIMAL", comment: "Температура" },
						{ name: "vibration", type: "DECIMAL", comment: "Вибрация" },
						{ name: "pressure", type: "DECIMAL", comment: "Давление" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время измерения",
						},
					],
				},
				{
					id: "model_maintenance_predictions",
					modified: true,
					type: "table",
					namespace: "maintenance",
					name: "maintenance_forecasts",
					description: "Прогнозы обслуживания",
					attrSeq: [
						{
							name: "equipment_id",
							type: "STRING",
							comment: "ID оборудования",
						},
						{
							name: "failure_probability",
							type: "DECIMAL",
							comment: "Вероятность поломки",
						},
						{
							name: "recommended_maintenance_date",
							type: "DATE",
							comment: "Рекомендуемая дата обслуживания",
						},
						{
							name: "priority_level",
							type: "STRING",
							comment: "Уровень приоритета",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_maintenance_predictions",
					deps: [
						{
							entityId: "source_equipment_sensors",
							attrMaps: [
								{ src: "equipment_id", dst: "equipment_id" },
								{ src: "temperature", dst: "failure_probability" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_17",
		name: "sales_performance_dashboard",
		type: "Analytics",
		createdAt: "2023-12-30T12:45:00Z",
		description: "Дашборд производительности продаж и KPI",
		status: "active",
		owner: "sales_team",
		tags: ["sales", "performance", "kpi", "dashboard"],
		dataLineage: {
			desc: {
				appId: "application_sales_dashboard",
				appName: "sales_performance_dashboard",
			},
			entities: [
				{
					id: "source_sales_data",
					modified: false,
					type: "table",
					namespace: "sales",
					name: "sales_transactions",
					description: "Транзакции продаж",
					attrSeq: [
						{ name: "sale_id", type: "STRING", comment: "ID продажи" },
						{ name: "salesperson_id", type: "STRING", comment: "ID продавца" },
						{ name: "amount", type: "DECIMAL", comment: "Сумма" },
						{
							name: "product_category",
							type: "STRING",
							comment: "Категория товара",
						},
						{ name: "sale_date", type: "DATE", comment: "Дата продажи" },
					],
				},
				{
					id: "model_sales_kpi",
					modified: true,
					type: "table",
					namespace: "sales",
					name: "sales_performance_metrics",
					description: "Метрики производительности продаж",
					attrSeq: [
						{ name: "salesperson_id", type: "STRING", comment: "ID продавца" },
						{ name: "total_sales", type: "DECIMAL", comment: "Общие продажи" },
						{
							name: "sales_target_achievement",
							type: "DECIMAL",
							comment: "Достижение цели продаж",
						},
						{
							name: "avg_deal_size",
							type: "DECIMAL",
							comment: "Средний размер сделки",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_sales_kpi",
					deps: [
						{
							entityId: "source_sales_data",
							attrMaps: [
								{ src: "salesperson_id", dst: "salesperson_id" },
								{ src: "amount", dst: "total_sales" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_18",
		name: "network_security_monitoring",
		type: "Data Pipeline",
		createdAt: "2023-12-29T14:20:00Z",
		description: "Мониторинг сетевой безопасности и обнаружение угроз",
		status: "active",
		owner: "security_team",
		tags: ["security", "network", "monitoring", "threats"],
		dataLineage: {
			desc: {
				appId: "application_network_security",
				appName: "network_security_monitoring",
			},
			entities: [
				{
					id: "source_network_logs",
					modified: false,
					type: "table",
					namespace: "security",
					name: "firewall_logs",
					description: "Логи файрвола",
					attrSeq: [
						{ name: "log_id", type: "STRING", comment: "ID лога" },
						{ name: "source_ip", type: "STRING", comment: "IP источника" },
						{
							name: "destination_ip",
							type: "STRING",
							comment: "IP назначения",
						},
						{ name: "port", type: "INT", comment: "Порт" },
						{ name: "action", type: "STRING", comment: "Действие" },
						{ name: "timestamp", type: "TIMESTAMP", comment: "Время события" },
					],
				},
				{
					id: "model_security_alerts",
					modified: true,
					type: "table",
					namespace: "security",
					name: "security_incidents",
					description: "Инциденты безопасности",
					attrSeq: [
						{ name: "incident_id", type: "STRING", comment: "ID инцидента" },
						{ name: "threat_level", type: "STRING", comment: "Уровень угрозы" },
						{
							name: "affected_systems",
							type: "STRING",
							comment: "Затронутые системы",
						},
						{
							name: "response_status",
							type: "STRING",
							comment: "Статус реагирования",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_security_alerts",
					deps: [
						{
							entityId: "source_network_logs",
							attrMaps: [
								{ src: "log_id", dst: "incident_id" },
								{ src: "source_ip", dst: "affected_systems" },
								{ src: "action", dst: "threat_level" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_19",
		name: "market_research_analytics",
		type: "Analytics",
		createdAt: "2023-12-28T10:15:00Z",
		description: "Аналитика маркетинговых исследований и трендов рынка",
		status: "active",
		owner: "research_team",
		tags: ["market", "research", "trends", "analytics"],
		dataLineage: {
			desc: {
				appId: "application_market_research",
				appName: "market_research_analytics",
			},
			entities: [
				{
					id: "source_market_data",
					modified: false,
					type: "table",
					namespace: "external",
					name: "market_surveys",
					description: "Данные рыночных исследований",
					attrSeq: [
						{ name: "survey_id", type: "STRING", comment: "ID опроса" },
						{
							name: "respondent_id",
							type: "STRING",
							comment: "ID респондента",
						},
						{
							name: "product_preference",
							type: "STRING",
							comment: "Предпочтения по продукту",
						},
						{
							name: "price_sensitivity",
							type: "DECIMAL",
							comment: "Чувствительность к цене",
						},
						{
							name: "demographic_group",
							type: "STRING",
							comment: "Демографическая группа",
						},
					],
				},
				{
					id: "model_market_insights",
					modified: true,
					type: "table",
					namespace: "research",
					name: "market_analysis",
					description: "Анализ рынка",
					attrSeq: [
						{
							name: "product_category",
							type: "STRING",
							comment: "Категория продукта",
						},
						{ name: "market_share", type: "DECIMAL", comment: "Доля рынка" },
						{
							name: "growth_potential",
							type: "DECIMAL",
							comment: "Потенциал роста",
						},
						{
							name: "competitive_position",
							type: "STRING",
							comment: "Конкурентная позиция",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_market_insights",
					deps: [
						{
							entityId: "source_market_data",
							attrMaps: [
								{ src: "product_preference", dst: "product_category" },
								{ src: "price_sensitivity", dst: "market_share" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_20",
		name: "compliance_reporting_system",
		type: "ELT",
		createdAt: "2023-12-27T16:00:00Z",
		description: "Система отчетности для соблюдения нормативных требований",
		status: "active",
		owner: "compliance_team",
		tags: ["compliance", "reporting", "regulatory", "audit"],
		dataLineage: {
			desc: {
				appId: "application_compliance_reporting",
				appName: "compliance_reporting_system",
			},
			entities: [
				{
					id: "source_regulatory_data",
					modified: false,
					type: "table",
					namespace: "compliance",
					name: "regulatory_requirements",
					description: "Нормативные требования",
					attrSeq: [
						{
							name: "requirement_id",
							type: "STRING",
							comment: "ID требования",
						},
						{
							name: "regulation_type",
							type: "STRING",
							comment: "Тип регулирования",
						},
						{
							name: "compliance_status",
							type: "STRING",
							comment: "Статус соответствия",
						},
						{ name: "due_date", type: "DATE", comment: "Срок исполнения" },
					],
				},
				{
					id: "model_compliance_tracking",
					modified: true,
					type: "table",
					namespace: "compliance",
					name: "compliance_status_tracking",
					description: "Отслеживание статуса соответствия",
					attrSeq: [
						{
							name: "regulation_type",
							type: "STRING",
							comment: "Тип регулирования",
						},
						{
							name: "compliance_percentage",
							type: "DECIMAL",
							comment: "Процент соответствия",
						},
						{ name: "risk_level", type: "STRING", comment: "Уровень риска" },
						{
							name: "next_review_date",
							type: "DATE",
							comment: "Дата следующего обзора",
						},
					],
				},
				{
					id: "datamart_compliance_reports",
					modified: true,
					type: "view",
					namespace: "reporting",
					name: "regulatory_compliance_dashboard",
					description: "Дашборд соответствия нормативным требованиям",
					attrSeq: [
						{ name: "report_period", type: "DATE", comment: "Отчетный период" },
						{
							name: "overall_compliance_score",
							type: "DECIMAL",
							comment: "Общий скор соответствия",
						},
						{
							name: "critical_violations",
							type: "INT",
							comment: "Критические нарушения",
						},
						{
							name: "improvement_recommendations",
							type: "STRING",
							comment: "Рекомендации по улучшению",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_compliance_tracking",
					deps: [
						{
							entityId: "source_regulatory_data",
							attrMaps: [
								{ src: "regulation_type", dst: "regulation_type" },
								{ src: "compliance_status", dst: "compliance_percentage" },
								{ src: "due_date", dst: "next_review_date" },
							],
							atrDeps: [],
						},
					],
				},
				{
					id: 2,
					entityId: "datamart_compliance_reports",
					deps: [
						{
							entityId: "model_compliance_tracking",
							attrMaps: [
								{
									src: "compliance_percentage",
									dst: "overall_compliance_score",
								},
								{ src: "risk_level", dst: "critical_violations" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_21",
		name: "iot_device_management",
		type: "Data Pipeline",
		createdAt: "2023-12-26T13:25:00Z",
		description: "Управление IoT устройствами и обработка телеметрии",
		status: "error",
		owner: "iot_team",
		tags: ["iot", "devices", "telemetry", "management"],
		dataLineage: {
			desc: {
				appId: "application_iot_management",
				appName: "iot_device_management",
			},
			entities: [
				{
					id: "source_iot_devices",
					modified: false,
					type: "table",
					namespace: "iot",
					name: "device_telemetry",
					description: "Телеметрия IoT устройств",
					attrSeq: [
						{ name: "device_id", type: "STRING", comment: "ID устройства" },
						{ name: "sensor_type", type: "STRING", comment: "Тип датчика" },
						{ name: "value", type: "DECIMAL", comment: "Значение" },
						{
							name: "battery_level",
							type: "DECIMAL",
							comment: "Уровень батареи",
						},
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время измерения",
						},
					],
				},
				{
					id: "model_device_health",
					modified: true,
					type: "table",
					namespace: "iot",
					name: "device_health_monitoring",
					description: "Мониторинг состояния устройств",
					attrSeq: [
						{ name: "device_id", type: "STRING", comment: "ID устройства" },
						{ name: "health_score", type: "DECIMAL", comment: "Скор здоровья" },
						{
							name: "last_communication",
							type: "TIMESTAMP",
							comment: "Последняя связь",
						},
						{
							name: "maintenance_required",
							type: "BOOLEAN",
							comment: "Требуется обслуживание",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_device_health",
					deps: [
						{
							entityId: "source_iot_devices",
							attrMaps: [
								{ src: "device_id", dst: "device_id" },
								{ src: "battery_level", dst: "health_score" },
								{ src: "timestamp", dst: "last_communication" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_22",
		name: "customer_journey_analytics",
		type: "Analytics",
		createdAt: "2023-12-25T11:40:00Z",
		description: "Аналитика пути клиента и оптимизация воронки продаж",
		status: "active",
		owner: "marketing_team",
		tags: ["customer_journey", "funnel", "conversion", "analytics"],
		dataLineage: {
			desc: {
				appId: "application_customer_journey",
				appName: "customer_journey_analytics",
			},
			entities: [
				{
					id: "source_customer_touchpoints",
					modified: false,
					type: "table",
					namespace: "marketing",
					name: "customer_interactions",
					description: "Точки взаимодействия с клиентами",
					attrSeq: [
						{
							name: "interaction_id",
							type: "STRING",
							comment: "ID взаимодействия",
						},
						{ name: "customer_id", type: "STRING", comment: "ID клиента" },
						{
							name: "touchpoint_type",
							type: "STRING",
							comment: "Тип точки контакта",
						},
						{ name: "channel", type: "STRING", comment: "Канал" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время взаимодействия",
						},
					],
				},
				{
					id: "model_journey_mapping",
					modified: true,
					type: "table",
					namespace: "marketing",
					name: "customer_journey_map",
					description: "Карта пути клиента",
					attrSeq: [
						{ name: "customer_id", type: "STRING", comment: "ID клиента" },
						{ name: "journey_stage", type: "STRING", comment: "Этап пути" },
						{
							name: "conversion_probability",
							type: "DECIMAL",
							comment: "Вероятность конверсии",
						},
						{
							name: "next_best_action",
							type: "STRING",
							comment: "Следующее лучшее действие",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_journey_mapping",
					deps: [
						{
							entityId: "source_customer_touchpoints",
							attrMaps: [
								{ src: "customer_id", dst: "customer_id" },
								{ src: "touchpoint_type", dst: "journey_stage" },
								{ src: "channel", dst: "next_best_action" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_23",
		name: "supply_demand_forecasting",
		type: "ML Pipeline",
		createdAt: "2023-12-24T15:55:00Z",
		description: "Прогнозирование спроса и предложения с использованием ML",
		status: "active",
		owner: "planning_team",
		tags: ["forecasting", "demand", "supply", "ml", "planning"],
		dataLineage: {
			desc: {
				appId: "application_demand_forecasting",
				appName: "supply_demand_forecasting",
			},
			entities: [
				{
					id: "source_historical_sales",
					modified: false,
					type: "table",
					namespace: "sales",
					name: "historical_sales_data",
					description: "Исторические данные продаж",
					attrSeq: [
						{ name: "product_id", type: "STRING", comment: "ID продукта" },
						{
							name: "sales_quantity",
							type: "INT",
							comment: "Количество продаж",
						},
						{ name: "sales_date", type: "DATE", comment: "Дата продажи" },
						{ name: "season", type: "STRING", comment: "Сезон" },
						{
							name: "promotion_active",
							type: "BOOLEAN",
							comment: "Активная акция",
						},
					],
				},
				{
					id: "model_demand_forecast",
					modified: true,
					type: "table",
					namespace: "planning",
					name: "demand_predictions",
					description: "Прогнозы спроса",
					attrSeq: [
						{ name: "product_id", type: "STRING", comment: "ID продукта" },
						{
							name: "forecast_period",
							type: "DATE",
							comment: "Период прогноза",
						},
						{
							name: "predicted_demand",
							type: "INT",
							comment: "Прогнозируемый спрос",
						},
						{
							name: "confidence_interval",
							type: "DECIMAL",
							comment: "Доверительный интервал",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_demand_forecast",
					deps: [
						{
							entityId: "source_historical_sales",
							attrMaps: [
								{ src: "product_id", dst: "product_id" },
								{ src: "sales_quantity", dst: "predicted_demand" },
								{ src: "sales_date", dst: "forecast_period" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_24",
		name: "document_processing_nlp",
		type: "ML Pipeline",
		createdAt: "2023-12-23T09:30:00Z",
		description: "Обработка документов и извлечение информации с помощью NLP",
		status: "inactive",
		owner: "ai_team",
		tags: ["nlp", "documents", "extraction", "processing"],
		dataLineage: {
			desc: {
				appId: "application_document_processing",
				appName: "document_processing_nlp",
			},
			entities: [
				{
					id: "source_documents",
					modified: false,
					type: "table",
					namespace: "documents",
					name: "raw_documents",
					description: "Исходные документы",
					attrSeq: [
						{ name: "document_id", type: "STRING", comment: "ID документа" },
						{ name: "content", type: "STRING", comment: "Содержание" },
						{ name: "document_type", type: "STRING", comment: "Тип документа" },
						{
							name: "upload_date",
							type: "TIMESTAMP",
							comment: "Дата загрузки",
						},
					],
				},
				{
					id: "model_extracted_entities",
					modified: true,
					type: "table",
					namespace: "nlp",
					name: "document_entities",
					description: "Извлеченные сущности из документов",
					attrSeq: [
						{ name: "document_id", type: "STRING", comment: "ID документа" },
						{ name: "entity_type", type: "STRING", comment: "Тип сущности" },
						{
							name: "entity_value",
							type: "STRING",
							comment: "Значение сущности",
						},
						{
							name: "confidence_score",
							type: "DECIMAL",
							comment: "Скор уверенности",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_extracted_entities",
					deps: [
						{
							entityId: "source_documents",
							attrMaps: [
								{ src: "document_id", dst: "document_id" },
								{ src: "content", dst: "entity_value" },
								{ src: "document_type", dst: "entity_type" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
	{
		id: "proc_25",
		name: "geo_location_analytics",
		type: "Analytics",
		createdAt: "2023-12-22T14:10:00Z",
		description: "Геолокационная аналитика и пространственный анализ данных",
		status: "active",
		owner: "gis_team",
		tags: ["geo", "location", "spatial", "analytics", "mapping"],
		dataLineage: {
			desc: {
				appId: "application_geo_analytics",
				appName: "geo_location_analytics",
			},
			entities: [
				{
					id: "source_location_data",
					modified: false,
					type: "table",
					namespace: "geo",
					name: "location_tracking",
					description: "Данные отслеживания местоположения",
					attrSeq: [
						{ name: "tracking_id", type: "STRING", comment: "ID отслеживания" },
						{ name: "latitude", type: "DECIMAL", comment: "Широта" },
						{ name: "longitude", type: "DECIMAL", comment: "Долгота" },
						{ name: "altitude", type: "DECIMAL", comment: "Высота" },
						{
							name: "timestamp",
							type: "TIMESTAMP",
							comment: "Время измерения",
						},
					],
				},
				{
					id: "model_spatial_analysis",
					modified: true,
					type: "table",
					namespace: "gis",
					name: "spatial_analytics",
					description: "Пространственная аналитика",
					attrSeq: [
						{ name: "region_id", type: "STRING", comment: "ID региона" },
						{
							name: "density_score",
							type: "DECIMAL",
							comment: "Скор плотности",
						},
						{
							name: "traffic_pattern",
							type: "STRING",
							comment: "Паттерн трафика",
						},
						{
							name: "hotspot_indicator",
							type: "BOOLEAN",
							comment: "Индикатор горячей точки",
						},
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "model_spatial_analysis",
					deps: [
						{
							entityId: "source_location_data",
							attrMaps: [
								{ src: "latitude", dst: "density_score" },
								{ src: "longitude", dst: "traffic_pattern" },
							],
							atrDeps: [],
						},
					],
				},
			],
			failedMappings: [],
		},
	},
]

*/

const initialState: ProcessesState = {
	processes: [],
	searchQuery: "",
	filteredProcesses: [],
	isLoading: false,
	error: null,
	currentProcessData: null,
};

export const useProcessesStore = create<ProcessesStore>()((set, get) => ({
	...initialState,

	setProcesses: (processes: Process[]) => {
		set({ processes });
		get().filterProcesses();
	},

	setSearchQuery: (query: string) => {
		set({ searchQuery: query });
		get().filterProcesses();
	},

	setLoading: (loading: boolean) => {
		set({ isLoading: loading });
	},

	setError: (error: string | null) => {
		set({ error });
	},

	setCurrentProcessData: (data: DataLineageSchema | null) => {
		set({ currentProcessData: data });
	},

	loadProcesses: async () => {
		const { setLoading, setError, setProcesses } = get();

		setLoading(true);
		setError(null);

		try {
			if (featureFlags.newJsonDataV2Enabled) {
				const items = await jsonDataV2Service.getAll();
				const processes = items.map(mapJsonDataItemToProcess);
				setProcesses(processes);
			} else {
				// fallback на старые моки, пока v2 не включен
				setProcesses([]);
			}
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Ошибка загрузки процессов",
			);
		} finally {
			setLoading(false);
		}
	},

	loadProcessData: async (processId: string) => {
		const { setLoading, setError, setCurrentProcessData, processes } = get();

		setLoading(true);
		setError(null);

		try {
			if (featureFlags.newJsonDataV2Enabled) {
				// ищем процесс и берем его dataLineage, либо подгружаем по ID
				const existing = processes.find((p) => p.id === processId);
				if (existing?.dataLineage) {
					setCurrentProcessData(existing.dataLineage);
				} else {
					const item = await jsonDataV2Service.getById(processId);
					setCurrentProcessData(item.data as DataLineageSchema);
				}
			} else {
				setCurrentProcessData(null);
			}
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Ошибка загрузки данных процесса",
			);
		} finally {
			setLoading(false);
		}
	},

	filterProcesses: () => {
		const { processes, searchQuery } = get();

		if (!searchQuery.trim()) {
			set({ filteredProcesses: processes });
			return;
		}

		const query = searchQuery.toLowerCase();
		const filtered = processes.filter(
			(process) =>
				process.name.toLowerCase().includes(query) ||
				process.type.toLowerCase().includes(query) ||
				process.description.toLowerCase().includes(query) ||
				process.tags.some((tag) => tag.toLowerCase().includes(query)),
		);

		set({ filteredProcesses: filtered });
	},
}));
