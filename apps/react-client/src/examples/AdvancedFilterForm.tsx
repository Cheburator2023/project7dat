import React, { useState } from "react";
import {
	Box,
	TextField,
	Button,
	Chip,
	Typography,
	Collapse,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Switch,
	InputAdornment,
	Divider,
	Stack,
	Badge,
	SelectChangeEvent,
} from "@mui/material";
import {
	Search,
	ExpandMore,
	ExpandLess,
	Close,
	FilterList,
	CalendarMonth,
	Storage,
	AccountTree,
	Label,
	Schedule,
	Error as ErrorIcon,
	LocalOffer,
} from "@mui/icons-material";
import { create } from "zustand";
import { Flex } from "@react-client/common/primitives/Flex";

// Types and Interfaces
interface DateRange {
	start: string;
	end: string;
}

interface NumericRange {
	min: string;
	max: string;
}

type LineageDepth = "all" | "1" | "2" | "3" | "4";
type LastModified = "any" | "1h" | "24h" | "7d" | "30d" | "90d";
type BinaryOption = "any" | "yes" | "no";

interface FilterState {
	search: string;
	dataSource: string[];
	platform: string[];
	status: string[];
	dateRange: DateRange;
	owner: string[];
	tags: string;
	dataType: string[];
	sensitivity: string[];
	transformationType: string[];
	lineageDepth: LineageDepth;
	executionTime: NumericRange;
	recordCount: NumericRange;
	lastModified: LastModified;
	hasErrors: boolean;
	isActive: boolean;
	environment: string[];
	cluster: string[];
	schemaName: string;
	tableName: string;
	columnName: string;
	partitioned: BinaryOption;
	compressed: BinaryOption;
	fileFormat: string[];
	storageLocation: string[];
}

interface FilterStore {
	filters: FilterState;
	setFilter: <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
	) => void;
	resetFilters: () => void;
	getActiveFilterCount: () => number;
}

interface MultiSelectProps {
	label: string;
	options: string[];
	value: string[];
	onChange: (value: string[]) => void;
	icon?: React.ReactElement;
}

// Initial filter state
const initialFilters: FilterState = {
	search: "",
	dataSource: [],
	platform: [],
	status: [],
	dateRange: { start: "", end: "" },
	owner: [],
	tags: "",
	dataType: [],
	sensitivity: [],
	transformationType: [],
	lineageDepth: "all",
	executionTime: { min: "", max: "" },
	recordCount: { min: "", max: "" },
	lastModified: "any",
	hasErrors: false,
	isActive: true,
	environment: [],
	cluster: [],
	schemaName: "",
	tableName: "",
	columnName: "",
	partitioned: "any",
	compressed: "any",
	fileFormat: [],
	storageLocation: [],
};

// Zustand store for filter state
const useFilterStore = create<FilterStore>((set, get) => ({
	filters: initialFilters,

	setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
		set((state) => ({
			filters: { ...state.filters, [key]: value },
		})),

	resetFilters: () => set({ filters: initialFilters }),

	getActiveFilterCount: (): number => {
		const f = get().filters;
		let count = 0;

		if (f.search) count++;
		if (f.dataSource.length) count++;
		if (f.platform.length) count++;
		if (f.status.length) count++;
		if (f.dateRange.start || f.dateRange.end) count++;
		if (f.owner.length) count++;
		if (f.tags) count++;
		if (f.dataType.length) count++;
		if (f.sensitivity.length) count++;
		if (f.transformationType.length) count++;
		if (f.lineageDepth !== "all") count++;
		if (f.executionTime.min || f.executionTime.max) count++;
		if (f.recordCount.min || f.recordCount.max) count++;
		if (f.lastModified !== "any") count++;
		if (f.hasErrors) count++;
		if (!f.isActive) count++;
		if (f.environment.length) count++;
		if (f.cluster.length) count++;
		if (f.schemaName) count++;
		if (f.tableName) count++;
		if (f.columnName) count++;
		if (f.partitioned !== "any") count++;
		if (f.compressed !== "any") count++;
		if (f.fileFormat.length) count++;
		if (f.storageLocation.length) count++;

		return count;
	},
}));

// Multi-select chip component
const MultiSelect: React.FC<MultiSelectProps> = ({
	label,
	options,
	value,
	onChange,
	icon,
}) => {
	const handleToggle = (option: string) => {
		const newValue = value.includes(option)
			? value.filter((v) => v !== option)
			: [...value, option];
		onChange(newValue);
	};

	return (
		<Box>
			<Typography
				variant="body2"
				fontWeight={600}
				gutterBottom
				sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
			>
				{icon}
				{label}
			</Typography>
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
				{options.map((opt) => (
					<Chip
						key={opt}
						label={opt}
						onClick={() => handleToggle(opt)}
						color={value.includes(opt) ? "primary" : "default"}
						variant={value.includes(opt) ? "filled" : "outlined"}
						size="small"
						sx={{ fontWeight: value.includes(opt) ? 600 : 400 }}
					/>
				))}
			</Box>
		</Box>
	);
};

const AdvancedFilterForm: React.FC = () => {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const { filters, setFilter, resetFilters, getActiveFilterCount } =
		useFilterStore();
	const activeCount = getActiveFilterCount();

	// Константы
	const platforms: string[] = [
		"Hadoop",
		"Spark",
		"Hive",
		"Kafka",
		"Airflow",
		"dbt",
		"Snowflake",
		"BigQuery",
		"Databricks",
		"Redshift",
	];
	const statuses: string[] = [
		"Выполняется",
		"Завершено",
		"Ошибка",
		"Ожидание",
		"Отменено",
		"В очереди",
	];
	const dataTypes: string[] = [
		"Таблица",
		"Представление",
		"Поток",
		"Файл",
		"API",
		"Модель",
		"Отчет",
		"Дашборд",
	];
	const sensitivityLevels: string[] = [
		"Публичные",
		"Внутренние",
		"Конфиденциальные",
		"Ограниченные",
		"ПДн",
		"Медицинские",
	];
	const transformations: string[] = [
		"ETL",
		"ELT",
		"Потоковая",
		"Пакетная",
		"Агрегация",
		"Соединение",
		"Фильтрация",
		"Объединение",
	];
	const environments: string[] = [
		"Продуктив",
		"Тестовая",
		"Разработка",
		"Контроль качества",
		"Приемочные тесты",
	];
	const fileFormats: string[] = [
		"Parquet",
		"ORC",
		"Avro",
		"CSV",
		"JSON",
		"XML",
		"Delta",
	];
	const storageTypes: string[] = [
		"HDFS",
		"S3",
		"GCS",
		"Azure Blob",
		"Локальное",
		"NFS",
	];

	const handleApplyFilters = (): void => {
		console.log("Применены фильтры:", filters);
		// Реализуйте здесь логику фильтрации
	};

	return (
		<>
			{/* Fast Search and Collapsible Toggle - Inline Layout */}
			<Box sx={{ p: 3 }}>
				<Stack direction="row" spacing={2} alignItems="center">
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Быстрый поиск..."
						value={filters.search}
						onChange={(e) => setFilter("search", e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
							endAdornment: filters.search && (
								<InputAdornment position="end">
									<IconButton
										size="small"
										onClick={() => setFilter("search", "")}
									>
										<Close />
									</IconButton>
								</InputAdornment>
							),
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: "white",
								"& fieldset": { borderWidth: 2 },
							},
						}}
					/>
					<Button
						variant="contained"
						color="primary"
						onClick={() => setIsExpanded(!isExpanded)}
						startIcon={<FilterList />}
						endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
					>
						Фильтры
						{activeCount > 0 && (
							<Badge
								badgeContent={activeCount}
								color="error"
								sx={{ ml: 2, mr: 1 }}
							/>
						)}
					</Button>
					{activeCount > 0 && (
						<Button
							variant="outlined"
							color="error"
							startIcon={<Close />}
							onClick={resetFilters}
						>
							Сбросить
						</Button>
					)}
				</Stack>
			</Box>

			<Collapse in={isExpanded}>
				<Box sx={{ p: 3 }}>
					<Stack spacing={4}>
						{/* Multi-select filters */}
						<Flex flexDirection="row" wrap="wrap" gap={20}>
							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Платформа / Технология"
									options={platforms}
									value={filters.platform}
									onChange={(v) => setFilter("platform", v)}
									icon={<Storage fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Статус выполнения"
									options={statuses}
									value={filters.status}
									onChange={(v) => setFilter("status", v)}
									icon={<ErrorIcon fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Тип данных"
									options={dataTypes}
									value={filters.dataType}
									onChange={(v) => setFilter("dataType", v)}
									icon={<AccountTree fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Конфиденциальность данных"
									options={sensitivityLevels}
									value={filters.sensitivity}
									onChange={(v) => setFilter("sensitivity", v)}
									icon={<ErrorIcon fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Тип трансформации"
									options={transformations}
									value={filters.transformationType}
									onChange={(v) => setFilter("transformationType", v)}
									icon={<AccountTree fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Среда"
									options={environments}
									value={filters.environment}
									onChange={(v) => setFilter("environment", v)}
									icon={<Label fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Формат файла"
									options={fileFormats}
									value={filters.fileFormat}
									onChange={(v) => setFilter("fileFormat", v)}
									icon={<Storage fontSize="small" />}
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<MultiSelect
									label="Тип хранилища"
									options={storageTypes}
									value={filters.storageLocation}
									onChange={(v) => setFilter("storageLocation", v)}
									icon={<Storage fontSize="small" />}
								/>
							</Flex>
						</Flex>

						{/* Date Range */}
						<Box>
							<Typography
								variant="body2"
								fontWeight={600}
								gutterBottom
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									mb: 1.5,
								}}
							>
								<CalendarMonth fontSize="small" />
								Диапазон дат
							</Typography>
							<Flex flexDirection="row" gap={2} wrap="wrap">
								<Flex flexGrow={1} minWidth="200px">
									<TextField
										fullWidth
										type="date"
										label="Дата начала"
										value={filters.dateRange.start}
										onChange={(e) =>
											setFilter("dateRange", {
												...filters.dateRange,
												start: e.target.value,
											})
										}
										InputLabelProps={{ shrink: true }}
									/>
								</Flex>
								<Flex flexGrow={1} minWidth="200px">
									<TextField
										fullWidth
										type="date"
										label="Дата окончания"
										value={filters.dateRange.end}
										onChange={(e) =>
											setFilter("dateRange", {
												...filters.dateRange,
												end: e.target.value,
											})
										}
										InputLabelProps={{ shrink: true }}
									/>
								</Flex>
							</Flex>
						</Box>

						{/* Теги */}
						<Box>
							<Typography
								variant="body2"
								fontWeight={600}
								gutterBottom
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									mb: 1.5,
								}}
							>
								<LocalOffer fontSize="small" />
								Теги
							</Typography>
							<TextField
								fullWidth
								label="Теги (через запятую)"
								placeholder="например: продакшн, конфиденциальные, архивные"
								value={filters.tags}
								onChange={(e) => setFilter("tags", e.target.value)}
							/>
						</Box>

						{/* Имена схемы/таблицы/колонки */}
						<Flex flexDirection="row" gap={2} wrap="wrap">
							<Flex flexGrow={1} minWidth="200px">
								<TextField
									fullWidth
									label="Имя схемы"
									placeholder="например, analytics"
									value={filters.schemaName}
									onChange={(e) => setFilter("schemaName", e.target.value)}
								/>
							</Flex>
							<Flex flexGrow={1} minWidth="200px">
								<TextField
									fullWidth
									label="Имя таблицы"
									placeholder="например, user_events"
									value={filters.tableName}
									onChange={(e) => setFilter("tableName", e.target.value)}
								/>
							</Flex>
							<Flex flexGrow={1} minWidth="200px">
								<TextField
									fullWidth
									label="Имя колонки"
									placeholder="например, user_id"
									value={filters.columnName}
									onChange={(e) => setFilter("columnName", e.target.value)}
								/>
							</Flex>
						</Flex>

						{/* Числовые диапазоны */}
						<Flex flexDirection="row" gap={3} wrap="wrap">
							<Flex flexGrow={1} minWidth="300px">
								<Box>
									<Typography
										variant="body2"
										fontWeight={600}
										gutterBottom
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mb: 1.5,
										}}
									>
										<Schedule fontSize="small" />
										Время выполнения (секунды)
									</Typography>
									<Flex flexDirection="row" gap={2}>
										<Flex flexGrow={1}>
											<TextField
												fullWidth
												type="number"
												label="Мин"
												value={filters.executionTime.min}
												onChange={(e) =>
													setFilter("executionTime", {
														...filters.executionTime,
														min: e.target.value,
													})
												}
											/>
										</Flex>
										<Flex flexGrow={1}>
											<TextField
												fullWidth
												type="number"
												label="Макс"
												value={filters.executionTime.max}
												onChange={(e) =>
													setFilter("executionTime", {
														...filters.executionTime,
														max: e.target.value,
													})
												}
											/>
										</Flex>
									</Flex>
								</Box>
							</Flex>

							<Flex flexGrow={1} minWidth="300px">
								<Box>
									<Typography
										variant="body2"
										fontWeight={600}
										gutterBottom
										sx={{ mb: 1.5 }}
									>
										Количество записей
									</Typography>
									<Flex flexDirection="row" gap={2}>
										<Flex flexGrow={1}>
											<TextField
												fullWidth
												type="number"
												label="Мин"
												value={filters.recordCount.min}
												onChange={(e) =>
													setFilter("recordCount", {
														...filters.recordCount,
														min: e.target.value,
													})
												}
											/>
										</Flex>
										<Flex flexGrow={1}>
											<TextField
												fullWidth
												type="number"
												label="Макс"
												value={filters.recordCount.max}
												onChange={(e) =>
													setFilter("recordCount", {
														...filters.recordCount,
														max: e.target.value,
													})
												}
											/>
										</Flex>
									</Flex>
								</Box>
							</Flex>
						</Flex>

						{/* Выпадающие списки */}
						<Flex flexDirection="row" gap={2} wrap="wrap">
							<Flex flexGrow={1} minWidth="200px">
								<FormControl fullWidth>
									<InputLabel>Глубина связей</InputLabel>
									<Select
										value={filters.lineageDepth}
										label="Глубина связей"
										onChange={(e: SelectChangeEvent) =>
											setFilter("lineageDepth", e.target.value as LineageDepth)
										}
									>
										<MenuItem value="all">Все уровни</MenuItem>
										<MenuItem value="1">1 уровень</MenuItem>
										<MenuItem value="2">2 уровня</MenuItem>
										<MenuItem value="3">3 уровня</MenuItem>
										<MenuItem value="4">4+ уровней</MenuItem>
									</Select>
								</FormControl>
							</Flex>

							<Flex flexGrow={1} minWidth="200px">
								<FormControl fullWidth>
									<InputLabel>Последнее изменение</InputLabel>
									<Select
										value={filters.lastModified}
										label="Последнее изменение"
										onChange={(e: SelectChangeEvent) =>
											setFilter("lastModified", e.target.value as LastModified)
										}
									>
										<MenuItem value="any">В любое время</MenuItem>
										<MenuItem value="1h">Последний час</MenuItem>
										<MenuItem value="24h">Последние 24 часа</MenuItem>
										<MenuItem value="7d">Последние 7 дней</MenuItem>
										<MenuItem value="30d">Последние 30 дней</MenuItem>
										<MenuItem value="90d">Последние 90 дней</MenuItem>
									</Select>
								</FormControl>
							</Flex>

							<Flex flexGrow={1} minWidth="200px">
								<FormControl fullWidth>
									<InputLabel>Разделенные</InputLabel>
									<Select
										value={filters.partitioned}
										label="Разделенные"
										onChange={(e: SelectChangeEvent) =>
											setFilter("partitioned", e.target.value as BinaryOption)
										}
									>
										<MenuItem value="any">Любые</MenuItem>
										<MenuItem value="yes">Да</MenuItem>
										<MenuItem value="no">Нет</MenuItem>
									</Select>
								</FormControl>
							</Flex>
						</Flex>

						{/* Переключатели */}
						<Flex flexDirection="row" gap={3} wrap="wrap">
							<Flex flexGrow={1} minWidth="200px">
								<FormControlLabel
									control={
										<Switch
											checked={filters.hasErrors}
											onChange={(e) => setFilter("hasErrors", e.target.checked)}
											color="error"
										/>
									}
									label="Только с ошибками"
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="200px">
								<FormControlLabel
									control={
										<Switch
											checked={filters.isActive}
											onChange={(e) => setFilter("isActive", e.target.checked)}
											color="success"
										/>
									}
									label="Только активные"
								/>
							</Flex>

							<Flex flexGrow={1} minWidth="200px">
								<FormControlLabel
									control={
										<Switch
											checked={filters.compressed === "yes"}
											onChange={(e) =>
												setFilter(
													"compressed",
													e.target.checked ? "yes" : "any",
												)
											}
											color="primary"
										/>
									}
									label="Только сжатые"
								/>
							</Flex>
						</Flex>

						{/* Кнопки действий */}
						<Divider sx={{ my: 2 }} />
						<Flex
							flexDirection="row"
							gap={2}
							wrap="wrap"
							sx={{
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Button
								variant="outlined"
								onClick={resetFilters}
								sx={{ textTransform: "none" }}
							>
								Очистить все
							</Button>
							<Button
								variant="contained"
								onClick={handleApplyFilters}
								size="large"
							>
								Применить фильтры
							</Button>
						</Flex>
					</Stack>
				</Box>
			</Collapse>
		</>
	);
};

export default AdvancedFilterForm;
