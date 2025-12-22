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
import {
	ChangelogEntry,
	ChangelogGroup,
} from "@react-client/api/hooks/changelogApi";
import { useChangelog } from "../../../api/hooks";

const mapActionTypeToChangeType = (
	actionType: string,
): ChangelogTableEntry["changeType"] => {
	const normalized = actionType.toLowerCase();
	switch (normalized) {
		case "updated":
			return "updated";
		case "deleted":
		case "rollback":
			return "deleted";
		default:
			return "added";
	}
};

const mapChangelogEntryToTableEntry = (
	entry: ChangelogEntry,
): ChangelogTableEntry => {
	const changeType = mapActionTypeToChangeType(entry.actionType);

	let beforeData: Record<string, any> | null = null;
	let afterData: Record<string, any> | null = null;

	const rawDetails: any = entry.details;

	if (rawDetails && typeof rawDetails === "object") {
		if ("before" in rawDetails || "after" in rawDetails) {
			beforeData =
				(rawDetails.before as Record<string, any> | null | undefined) ?? null;
			afterData =
				(rawDetails.after as Record<string, any> | null | undefined) ?? null;
		} else {
			afterData = rawDetails as Record<string, any>;
		}
	} else if (typeof rawDetails === "string") {
		try {
			const parsed = JSON.parse(rawDetails);
			if (parsed && typeof parsed === "object") {
				if ("before" in parsed || "after" in parsed) {
					beforeData =
						(parsed.before as Record<string, any> | null | undefined) ?? null;
					afterData =
						(parsed.after as Record<string, any> | null | undefined) ?? null;
				} else {
					afterData = parsed as Record<string, any>;
				}
			}
		} catch {
			afterData = { raw: rawDetails };
		}
	}

	return {
		id: entry.id,
		versionId: entry.version || entry.commitId || entry.snapshotId || entry.id,
		changeDate: entry.createdAt,
		userName: entry.author || "",
		processName: "",
		objectName: "",
		objectType: "",
		changeType,
		beforeData,
		afterData,
		graphId: entry.graphId,
		graphName: entry.graphName,
		author: entry.author,
		commitId: entry.commitId,
		snapshotId: entry.snapshotId,
		version: entry.version,
		createdAt: entry.createdAt,
	};
};

export const ChangelogTablePage = () => {
	const [data, setData] = useState<ChangelogTableEntry[]>([]);
	const { loading, error, getChangelog } = useChangelog();
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
			const response = await getChangelog({ page: 1, limit: 1000 });
			if (response) {
				const mapped = response.groups.flatMap((group: ChangelogGroup) =>
					group.entries.map((entry: ChangelogEntry) =>
						mapChangelogEntryToTableEntry(entry),
					),
				);
				setData(mapped);
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
