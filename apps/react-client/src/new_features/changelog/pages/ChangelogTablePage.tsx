import { useState, useEffect, useMemo } from "react";
import {
	Box,
	Paper,
	TextField,
	Stack,
	MenuItem,
	Alert,
	CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import { ChangelogTable } from "../organisms/ChangelogTable";
import { ChangelogDetailsModal } from "../molecules/ChangelogDetailsModal";
import { ChangelogTableEntry, SortConfig, FilterConfig } from "../types";
import { Header } from "@react-client/common/navigation/organisms/Header";

// Mock данные для демонстрации
const mockChangelogData: ChangelogTableEntry[] = [
	{
		id: "1",
		versionId: "v1.2.3-abc123",
		changeDate: "2024-01-15T10:30:00Z",
		userName: "Иванов Иван Иванович",
		processName: "Обработка заказов",
		objectName: "order_processing_pipeline",
		objectType: "Pipeline",
		changeType: "updated",
		graphId: "graph-1",
		graphName: "Основной граф",
		createdAt: "2024-01-15T10:30:00Z",
		beforeData: {
			name: "order_processing_pipeline",
			steps: ["validate", "process"],
			timeout: 300,
		},
		afterData: {
			name: "order_processing_pipeline",
			steps: ["validate", "process", "notify"],
			timeout: 600,
		},
	},
	{
		id: "2",
		versionId: "v1.2.4-def456",
		changeDate: "2024-01-16T14:15:00Z",
		userName: "Петрова Анна Сергеевна",
		processName: "Аналитика продаж",
		objectName: "sales_report_generator",
		objectType: "Task",
		changeType: "added",
		graphId: "graph-2",
		graphName: "Аналитический граф",
		createdAt: "2024-01-16T14:15:00Z",
		beforeData: null,
		afterData: {
			name: "sales_report_generator",
			schedule: "0 9 * * 1",
			output_format: "xlsx",
		},
	},
	{
		id: "3",
		versionId: "v1.2.5-ghi789",
		changeDate: "2024-01-17T09:45:00Z",
		userName: "Сидоров Петр Александрович",
		processName: "Обработка заказов",
		objectName: "legacy_validator",
		objectType: "Component",
		changeType: "deleted",
		graphId: "graph-1",
		graphName: "Основной граф",
		createdAt: "2024-01-17T09:45:00Z",
		beforeData: {
			name: "legacy_validator",
			version: "1.0.0",
			deprecated: true,
		},
		afterData: null,
	},
	{
		id: "4",
		versionId: "v1.3.0-jkl012",
		changeDate: "2024-01-18T16:20:00Z",
		userName: "Козлова Мария Викторовна",
		processName: "Управление пользователями",
		objectName: "user_authentication",
		objectType: "Service",
		changeType: "updated",
		graphId: "graph-3",
		graphName: "Граф пользователей",
		createdAt: "2024-01-18T16:20:00Z",
		beforeData: {
			auth_method: "basic",
			session_timeout: 3600,
		},
		afterData: {
			auth_method: "oauth2",
			session_timeout: 7200,
			refresh_token_enabled: true,
		},
	},
	{
		id: "5",
		versionId: "v1.3.1-mno345",
		changeDate: "2024-01-19T11:10:00Z",
		userName: "Иванов Иван Иванович",
		processName: "Аналитика продаж",
		objectName: "monthly_summary",
		objectType: "Report",
		changeType: "added",
		graphId: "graph-2",
		graphName: "Аналитический граф",
		createdAt: "2024-01-19T11:10:00Z",
		beforeData: null,
		afterData: {
			name: "monthly_summary",
			frequency: "monthly",
			recipients: ["manager@company.com"],
			format: "pdf",
		},
	},
	{
		id: "6",
		versionId: "v1.3.2-pqr678",
		changeDate: "2024-01-20T08:25:00Z",
		userName: "Смирнов Алексей Дмитриевич",
		processName: "Обработка платежей",
		objectName: "payment_processor",
		objectType: "Service",
		changeType: "updated",
		graphId: "graph-4",
		graphName: "Финансовый граф",
		createdAt: "2024-01-20T08:25:00Z",
		beforeData: {
			max_amount: 10000,
			currency: "RUB",
			retry_attempts: 3,
		},
		afterData: {
			max_amount: 50000,
			currency: "RUB",
			retry_attempts: 5,
			fraud_detection: true,
		},
	},
	{
		id: "7",
		versionId: "v1.3.3-stu901",
		changeDate: "2024-01-21T13:40:00Z",
		userName: "Волкова Елена Петровна",
		processName: "Управление инвентарем",
		objectName: "inventory_tracker",
		objectType: "Component",
		changeType: "added",
		graphId: "graph-5",
		graphName: "Складской граф",
		createdAt: "2024-01-21T13:40:00Z",
		beforeData: null,
		afterData: {
			name: "inventory_tracker",
			tracking_mode: "real-time",
			warehouse_locations: ["A1", "B2", "C3"],
			alert_threshold: 10,
		},
	},
	{
		id: "8",
		versionId: "v1.3.4-vwx234",
		changeDate: "2024-01-22T15:55:00Z",
		userName: "Морозов Сергей Николаевич",
		processName: "Логистика",
		objectName: "delivery_optimizer",
		objectType: "Algorithm",
		changeType: "updated",
		graphId: "graph-6",
		graphName: "Логистический граф",
		createdAt: "2024-01-22T15:55:00Z",
		beforeData: {
			algorithm: "dijkstra",
			max_distance: 100,
			vehicle_types: ["truck", "van"],
		},
		afterData: {
			algorithm: "a_star",
			max_distance: 150,
			vehicle_types: ["truck", "van", "drone"],
			traffic_consideration: true,
		},
	},
	{
		id: "9",
		versionId: "v1.3.5-yza567",
		changeDate: "2024-01-23T10:15:00Z",
		userName: "Новикова Ольга Владимировна",
		processName: "Маркетинг",
		objectName: "campaign_analyzer",
		objectType: "Dashboard",
		changeType: "added",
		graphId: "graph-7",
		graphName: "Маркетинговый граф",
		createdAt: "2024-01-23T10:15:00Z",
		beforeData: null,
		afterData: {
			name: "campaign_analyzer",
			metrics: ["ctr", "conversion", "roi"],
			refresh_interval: 300,
			data_sources: ["google_ads", "facebook_ads"],
		},
	},
	{
		id: "10",
		versionId: "v1.3.6-bcd890",
		changeDate: "2024-01-24T12:30:00Z",
		userName: "Федоров Михаил Андреевич",
		processName: "Безопасность",
		objectName: "security_scanner",
		objectType: "Tool",
		changeType: "deleted",
		graphId: "graph-8",
		graphName: "Граф безопасности",
		createdAt: "2024-01-24T12:30:00Z",
		beforeData: {
			name: "security_scanner",
			scan_types: ["vulnerability", "malware"],
			schedule: "daily",
			deprecated: true,
		},
		afterData: null,
	},
	{
		id: "11",
		versionId: "v1.4.0-efg123",
		changeDate: "2024-01-25T09:20:00Z",
		userName: "Петрова Анна Сергеевна",
		processName: "Аналитика продаж",
		objectName: "sales_predictor",
		objectType: "Model",
		changeType: "added",
		graphId: "graph-2",
		graphName: "Аналитический граф",
		createdAt: "2024-01-25T09:20:00Z",
		beforeData: null,
		afterData: {
			name: "sales_predictor",
			model_type: "random_forest",
			features: ["season", "price", "promotion"],
			accuracy: 0.85,
		},
	},
	{
		id: "12",
		versionId: "v1.4.1-hij456",
		changeDate: "2024-01-26T14:45:00Z",
		userName: "Кузнецов Дмитрий Сергеевич",
		processName: "Обработка заказов",
		objectName: "order_validator",
		objectType: "Component",
		changeType: "updated",
		graphId: "graph-1",
		graphName: "Основной граф",
		createdAt: "2024-01-26T14:45:00Z",
		beforeData: {
			validation_rules: ["required_fields", "format_check"],
			timeout: 30,
		},
		afterData: {
			validation_rules: ["required_fields", "format_check", "business_rules"],
			timeout: 45,
			cache_enabled: true,
		},
	},
	{
		id: "13",
		versionId: "v1.4.2-klm789",
		changeDate: "2024-01-27T16:10:00Z",
		userName: "Соколова Татьяна Игоревна",
		processName: "HR процессы",
		objectName: "employee_onboarding",
		objectType: "Workflow",
		changeType: "added",
		graphId: "graph-9",
		graphName: "HR граф",
		createdAt: "2024-01-27T16:10:00Z",
		beforeData: null,
		afterData: {
			name: "employee_onboarding",
			steps: ["documentation", "training", "equipment_setup"],
			duration_days: 5,
			auto_notifications: true,
		},
	},
	{
		id: "14",
		versionId: "v1.4.3-nop012",
		changeDate: "2024-01-28T11:35:00Z",
		userName: "Лебедев Андрей Викторович",
		processName: "Техническая поддержка",
		objectName: "ticket_classifier",
		objectType: "Service",
		changeType: "updated",
		graphId: "graph-10",
		graphName: "Граф поддержки",
		createdAt: "2024-01-28T11:35:00Z",
		beforeData: {
			categories: ["bug", "feature", "question"],
			auto_assign: false,
		},
		afterData: {
			categories: ["bug", "feature", "question", "urgent"],
			auto_assign: true,
			priority_scoring: true,
		},
	},
	{
		id: "15",
		versionId: "v1.4.4-qrs345",
		changeDate: "2024-01-29T13:50:00Z",
		userName: "Романова Екатерина Александровна",
		processName: "Качество данных",
		objectName: "data_quality_monitor",
		objectType: "Monitor",
		changeType: "added",
		graphId: "graph-11",
		graphName: "Граф качества данных",
		createdAt: "2024-01-29T13:50:00Z",
		beforeData: null,
		afterData: {
			name: "data_quality_monitor",
			checks: ["completeness", "accuracy", "consistency"],
			alert_threshold: 0.95,
			reporting_frequency: "hourly",
		},
	},
	{
		id: "16",
		versionId: "v1.4.5-tuv678",
		changeDate: "2024-01-30T10:05:00Z",
		userName: "Васильев Игорь Петрович",
		processName: "Архитектура системы",
		objectName: "microservice_gateway",
		objectType: "Gateway",
		changeType: "updated",
		graphId: "graph-12",
		graphName: "Архитектурный граф",
		createdAt: "2024-01-30T10:05:00Z",
		beforeData: {
			rate_limit: 1000,
			auth_methods: ["jwt"],
			load_balancing: "round_robin",
		},
		afterData: {
			rate_limit: 5000,
			auth_methods: ["jwt", "oauth2"],
			load_balancing: "weighted_round_robin",
			circuit_breaker: true,
		},
	},
	{
		id: "17",
		versionId: "v1.4.6-wxy901",
		changeDate: "2024-01-31T15:20:00Z",
		userName: "Орлова Марина Сергеевна",
		processName: "Финансовая отчетность",
		objectName: "quarterly_report",
		objectType: "Report",
		changeType: "deleted",
		graphId: "graph-13",
		graphName: "Финансовый отчетный граф",
		createdAt: "2024-01-31T15:20:00Z",
		beforeData: {
			name: "quarterly_report",
			format: "excel",
			recipients: ["cfo@company.com", "board@company.com"],
			obsolete: true,
		},
		afterData: null,
	},
	{
		id: "18",
		versionId: "v1.5.0-zab234",
		changeDate: "2024-02-01T09:15:00Z",
		userName: "Григорьев Павел Михайлович",
		processName: "Мониторинг системы",
		objectName: "performance_dashboard",
		objectType: "Dashboard",
		changeType: "added",
		graphId: "graph-14",
		graphName: "Граф мониторинга",
		createdAt: "2024-02-01T09:15:00Z",
		beforeData: null,
		afterData: {
			name: "performance_dashboard",
			metrics: ["cpu", "memory", "disk", "network"],
			refresh_rate: 5,
			alert_integration: true,
		},
	},
	{
		id: "19",
		versionId: "v1.5.1-cde567",
		changeDate: "2024-02-02T14:30:00Z",
		userName: "Зайцева Людмила Николаевна",
		processName: "Управление контентом",
		objectName: "content_moderator",
		objectType: "Service",
		changeType: "updated",
		graphId: "graph-15",
		graphName: "Контентный граф",
		createdAt: "2024-02-02T14:30:00Z",
		beforeData: {
			auto_moderation: false,
			languages: ["ru", "en"],
		},
		afterData: {
			auto_moderation: true,
			languages: ["ru", "en", "de", "fr"],
			ai_confidence_threshold: 0.8,
		},
	},
	{
		id: "20",
		versionId: "v1.5.2-fgh890",
		changeDate: "2024-02-03T11:45:00Z",
		userName: "Медведев Роман Александрович",
		processName: "Интеграции",
		objectName: "api_connector",
		objectType: "Connector",
		changeType: "added",
		graphId: "graph-16",
		graphName: "Граф интеграций",
		createdAt: "2024-02-03T11:45:00Z",
		beforeData: null,
		afterData: {
			name: "api_connector",
			protocols: ["rest", "graphql"],
			authentication: "bearer_token",
			retry_policy: "exponential_backoff",
		},
	},
];

export const ChangelogTablePage = () => {
	const [data, setData] = useState<ChangelogTableEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedEntry, setSelectedEntry] =
		useState<ChangelogTableEntry | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	// Состояние для сортировки
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		field: "changeDate",
		direction: "desc",
	});

	// Состояние для фильтров
	const [filters, setFilters] = useState<FilterConfig>({
		userName: "",
		processName: "",
		objectType: "",
		changeType: "",
		dateFrom: null,
		dateTo: null,
	});

	// Загрузка данных (имитация API вызова)
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				// Имитация задержки API
				await new Promise((resolve) => setTimeout(resolve, 1000));
				setData(mockChangelogData);
				setError(null);
			} catch (_err) {
				setError("Ошибка загрузки данных");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	// Фильтрация и сортировка данных
	const filteredAndSortedData = useMemo(() => {
		const filtered = data.filter((entry) => {
			const matchesUser =
				!filters.userName ||
				entry.userName.toLowerCase().includes(filters.userName.toLowerCase());

			const matchesProcess =
				!filters.processName ||
				entry.processName
					.toLowerCase()
					.includes(filters.processName.toLowerCase());

			const matchesObjectType =
				!filters.objectType || entry.objectType === filters.objectType;

			const matchesChangeType =
				!filters.changeType || entry.changeType === filters.changeType;

			const entryDate = new Date(entry.changeDate);
			const matchesDateFrom =
				!filters.dateFrom || entryDate >= filters.dateFrom;
			const matchesDateTo = !filters.dateTo || entryDate <= filters.dateTo;

			return (
				matchesUser &&
				matchesProcess &&
				matchesObjectType &&
				matchesChangeType &&
				matchesDateFrom &&
				matchesDateTo
			);
		});

		// Сортировка
		filtered.sort((a, b) => {
			const aValue = a[sortConfig.field as keyof ChangelogTableEntry];
			const bValue = b[sortConfig.field as keyof ChangelogTableEntry];

			// Обработка undefined и null значений
			if (
				(aValue === undefined || aValue === null) &&
				(bValue === undefined || bValue === null)
			)
				return 0;
			if (aValue === undefined || aValue === null)
				return sortConfig.direction === "asc" ? 1 : -1;
			if (bValue === undefined || bValue === null)
				return sortConfig.direction === "asc" ? -1 : 1;

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});

		return filtered;
	}, [data, filters, sortConfig]);

	const handleRowClick = (entry: ChangelogTableEntry) => {
		setSelectedEntry(entry);
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setSelectedEntry(null);
	};

	const handleSortChange = (field: keyof ChangelogTableEntry) => {
		setSortConfig((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const handleFilterChange = (
		field: keyof FilterConfig,
		value: string | Date | null,
	) => {
		setFilters((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const _clearFilters = () => {
		setFilters({
			userName: "",
			processName: "",
			objectType: "",
			changeType: "",
			dateFrom: null,
			dateTo: null,
		});
	};

	const uniqueObjectTypes = Array.from(
		new Set(data.map((entry) => entry.objectType)),
	);
	const uniqueChangeTypes = Array.from(
		new Set(data.map((entry) => entry.changeType)),
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
			<div>
				<Header />
				<>
					{/* Фильтры */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack spacing={1}>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
								<TextField
									label="Пользователь"
									value={filters.userName}
									onChange={(e) =>
										handleFilterChange("userName", e.target.value)
									}
									size="small"
									sx={{ minWidth: 200 }}
								/>
								<TextField
									label="Процесс"
									value={filters.processName}
									onChange={(e) =>
										handleFilterChange("processName", e.target.value)
									}
									size="small"
									sx={{ minWidth: 200 }}
								/>
								<TextField
									select
									label="Тип объекта"
									value={filters.objectType}
									onChange={(e) =>
										handleFilterChange("objectType", e.target.value)
									}
									size="small"
									sx={{ minWidth: 150 }}
								>
									<MenuItem value="">Все</MenuItem>
									{uniqueObjectTypes.map((type) => (
										<MenuItem key={type} value={type}>
											{type}
										</MenuItem>
									))}
								</TextField>
								<TextField
									select
									label="Тип изменения"
									value={filters.changeType}
									onChange={(e) =>
										handleFilterChange("changeType", e.target.value)
									}
									size="small"
									sx={{ minWidth: 150 }}
								>
									<MenuItem value="">Все</MenuItem>
									{uniqueChangeTypes.map((type) => (
										<MenuItem key={type} value={type}>
											{type === "added"
												? "Добавлен"
												: type === "updated"
													? "Обновлен"
													: type === "deleted"
														? "Удален"
														: type}
										</MenuItem>
									))}
								</TextField>

								<DatePicker
									label="Дата с"
									value={filters.dateFrom}
									onChange={(date) => handleFilterChange("dateFrom", date)}
									slotProps={{ textField: { size: "small" } }}
								/>
								<DatePicker
									label="Дата по"
									value={filters.dateTo}
									onChange={(date) => handleFilterChange("dateTo", date)}
									slotProps={{ textField: { size: "small" } }}
								/>
								{/* <Button onClick={clearFilters} variant="outlined" size="small">
									Очистить фильтры
								</Button> */}
							</Stack>
						</Stack>
					</Paper>

					{/* Результаты */}
					<Paper>
						{loading && (
							<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
								<CircularProgress />
							</Box>
						)}

						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						{!loading && !error && (
							<div style={{ height: "calc(100vh - 400px)" }}>
								<ChangelogTable
									data={filteredAndSortedData}
									sortConfig={sortConfig}
									onSortChange={handleSortChange}
									onRowClick={handleRowClick}
								/>
							</div>
						)}
					</Paper>

					{/* Модальное окно для просмотра деталей */}
					<ChangelogDetailsModal
						open={modalOpen}
						onClose={handleCloseModal}
						entry={selectedEntry}
					/>
				</>
			</div>
		</LocalizationProvider>
	);
};
