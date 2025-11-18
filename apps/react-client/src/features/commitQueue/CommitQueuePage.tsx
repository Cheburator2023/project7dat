import React, { useState, useMemo, useRef } from "react";
import {
	Box,
	Typography,
	Button,
	Chip,
	IconButton,
	TextField,
	InputAdornment,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormControl,
	InputLabel,
	OutlinedInput,
} from "@mui/material";
import {
	Add as AddIcon,
	Edit as EditIcon,
	Visibility as ViewIcon,
	SwapHoriz as ReplaceIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { EditCommitDialog } from "./dialogs/EditCommitDialog";
import { ViewCommitDialog } from "./dialogs/ViewCommitDialog";
import { ReplaceFileDialog } from "./dialogs/ReplaceFileDialog";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { CloudUploadIcon } from "lucide-react";
import { useMergeStore } from "../../stores/mergeStore";
import { jsonDataService } from "../../api/jsonDataApi";
import { QueueVisualization } from "./QueueVisualization";

// Типы данных
interface CommitQueueItem {
	id: string;
	name: string;
	author: string;
	status: "validated" | "not_validated" | "processing" | "error";
	uploadDate: string;
	fileType: string;
	description?: string;
	fileName?: string;
	fileSize?: number;
	processName?: string;
}

// Макетные данные
const mockCommitQueue: CommitQueueItem[] = [
	{
		id: "1",
		name: "Обновление модели пользователей",
		author: "Иванов И.И.",
		status: "not_validated",
		uploadDate: "2024-01-15T10:30:00Z",
		fileType: "JSON",
		description: "Добавление новых полей в модель пользователей",
		fileName: "user_model_update.json",
		fileSize: 245000,
		processName: "user_data_process",
	},
	{
		id: "2",
		name: "Витрина продаж Q4",
		author: "Петров П.П.",
		status: "validated",
		uploadDate: "2024-01-14T15:45:00Z",
		fileType: "JSON",
		description: "Обновление витрины данных по продажам за 4 квартал",
		fileName: "sales_mart_q4.json",
		fileSize: 512000,
		processName: "sales_analytics",
	},
	{
		id: "3",
		name: "Признаки клиентской сегментации",
		author: "Сидорова С.С.",
		status: "processing",
		uploadDate: "2024-01-15T09:15:00Z",
		fileType: "JSON",
		description: "Новые признаки для сегментации клиентов",
		fileName: "customer_features.json",
		fileSize: 128000,
		processName: "customer_segmentation",
	},
	{
		id: "4",
		name: "Модель рекомендаций",
		author: "Козлов К.К.",
		status: "error",
		uploadDate: "2024-01-13T14:20:00Z",
		fileType: "JSON",
		description: "Обновление алгоритма рекомендаций",
		fileName: "recommendation_model.json",
		fileSize: 890000,
		processName: "recommendation_engine",
	},
	{
		id: "5",
		name: "Витрина финансовых показателей",
		author: "Морозов М.М.",
		status: "validated",
		uploadDate: "2024-01-12T11:30:00Z",
		fileType: "JSON",
		description: "Обновление финансовых метрик",
		fileName: "financial_metrics.json",
		fileSize: 367000,
		processName: "financial_reporting",
	},
	{
		id: "6",
		name: "Признаки поведенческого анализа",
		author: "Лебедева Л.Л.",
		status: "not_validated",
		uploadDate: "2024-01-15T08:45:00Z",
		fileType: "JSON",
		description: "Новые признаки для анализа поведения пользователей",
		fileName: "behavior_features.json",
		fileSize: 445000,
		processName: "behavior_analytics",
	},
];

// Компонент карточки коммита
const CommitCard: React.FC<{
	commit: CommitQueueItem;
	onEdit: (commit: CommitQueueItem) => void;
	onView: (commit: CommitQueueItem) => void;
	onReplace: (commit: CommitQueueItem) => void;
}> = ({ commit, onEdit, onView, onReplace }) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "validated":
				return "success";
			case "not_validated":
				return "error";
			case "processing":
				return "warning";
			case "error":
				return "error";
			default:
				return "default";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "validated":
				return "Прошел валидацию";
			case "not_validated":
				return "Не прошел валидацию";
			case "processing":
				return "Обрабатывается";
			case "error":
				return "Ошибка";
			default:
				return status;
		}
	};

	return (
		<Card
			uuid={`commit-card-${commit.id}`}
			zoom={0.9}
			sx={{
				height: "100%",
				backgroundColor: "background.paper",
				"&:hover": {
					boxShadow: 3,
					transform: "translateY(-2px)",
				},
				transition: "all 0.2s ease-in-out",
			}}
		>
			<Box
				sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
			>
				{/* Заголовок и статус */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						mb: 1,
					}}
				>
					<Flex alignItems="center">
						<Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
							{commit.name}
						</Typography>
						<Chip
							label={getStatusText(commit.status)}
							color={getStatusColor(commit.status) as any}
							size="small"
							variant="filled"
						/>
					</Flex>
					<Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
						<IconButton
							size="small"
							onClick={() => onView(commit)}
							title="Просмотр содержимого"
						>
							<ViewIcon />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => onEdit(commit)}
							title="Редактировать"
						>
							<EditIcon />
						</IconButton>
						{(commit.status === "not_validated" ||
							commit.status === "error") && (
							<IconButton
								size="small"
								onClick={() => onReplace(commit)}
								title="Заменить файл"
								color="warning"
							>
								<ReplaceIcon />
							</IconButton>
						)}
					</Box>
				</Box>

				{/* Автор и дата */}
				<Box sx={{ mb: 1 }}>
					<Typography variant="body2" color="text.secondary">
						Автор: {commit.author}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Загружен: {new Date(commit.uploadDate).toLocaleString("ru-RU")}
					</Typography>
				</Box>

				{/* Описание */}
				{commit.description && (
					<Typography variant="body2" color="text.secondary">
						{commit.description}
					</Typography>
				)}

				{commit.processName && (
					<Typography variant="body2" color="text.secondary" display="block">
						Процесс: {commit.processName}
					</Typography>
				)}

				{/* Действия */}
			</Box>
		</Card>
	);
};

// Диалог загрузки файла
const UploadDialog: React.FC<{
	open: boolean;
	onClose: () => void;
	onUpload: (
		file: File,
		metadata: { name: string; description: string },
	) => void;
}> = ({ open, onClose, onUpload }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	const [dragOver, setDragOver] = useState(false);

	const validateFile = (file: File) => {
		// Проверка типа файла
		if (!file.name.toLowerCase().endsWith(".json")) {
			setError("Файл должен быть в формате JSON");
			return false;
		}

		// Проверка размера файла (< 1 МБ)
		if (file.size > 1024 * 1024) {
			setError("Размер файла не должен превышать 1 МБ");
			return false;
		}

		setError("");
		return true;
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (validateFile(file)) {
			setSelectedFile(file);
			// Автозаполнение имени из имени файла
			const fileName = file.name.replace(".json", "");
			setName(fileName);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragOver(false);

		const files = event.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (validateFile(file)) {
				setSelectedFile(file);
				// Автозаполнение имени из имени файла
				const fileName = file.name.replace(".json", "");
				setName(fileName);
			}
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragOver(false);
	};

	const handleUpload = () => {
		if (!selectedFile || !name.trim()) return;

		onUpload(selectedFile, {
			name: name.trim(),
			description: description.trim(),
		});
		handleClose();
	};

	const handleClose = () => {
		setSelectedFile(null);
		setName("");
		setDescription("");
		setError("");
		setDragOver(false);
		onClose();
	};

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleBoxClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Загрузка файла коммита</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<Box
						sx={{
							border: `2px dashed ${dragOver ? "#1976d2" : "#ccc"}`,
							borderRadius: 2,
							p: 4,
							textAlign: "center",
							cursor: "pointer",
							backgroundColor: dragOver ? "#f0f8ff" : "transparent",
							"&:hover": {
								borderColor: "#1976d2",
								backgroundColor: "#f5f5f5",
							},
						}}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onClick={handleBoxClick}
					>
						<input
							type="file"
							accept=".json"
							onChange={handleFileSelect}
							ref={fileInputRef}
							style={{ display: "none" }}
						/>
						<CloudUploadIcon />
						<Typography variant="h6" gutterBottom>
							Перетащите файл сюда или нажмите для выбора
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Поддерживаются только JSON файлы размером до 1 МБ
						</Typography>
					</Box>

					{selectedFile && (
						<Alert severity="success">
							Выбран файл: {selectedFile.name} (
							{(selectedFile.size / 1024).toFixed(1)} KB)
						</Alert>
					)}

					{error && <Alert severity="error">{error}</Alert>}

					<FormControl fullWidth>
						<InputLabel>Наименование обновления</InputLabel>
						<OutlinedInput
							value={name}
							onChange={(e) => setName(e.target.value)}
							label="Наименование обновления"
							required
						/>
					</FormControl>

					<FormControl fullWidth>
						<InputLabel>Описание</InputLabel>
						<OutlinedInput
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							label="Описание"
							multiline
							rows={3}
						/>
					</FormControl>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Отмена</Button>
				<Button
					onClick={handleUpload}
					variant="contained"
					disabled={!selectedFile || !name.trim()}
				>
					Загрузить
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// Основной компонент страницы
export const CommitQueuePage: React.FC = () => {
	const [searchText, setSearchText] = useState("");
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
	const [selectedCommit, setSelectedCommit] = useState<CommitQueueItem | null>(
		null,
	);
	const [commits, setCommits] = useState<CommitQueueItem[]>(mockCommitQueue);

	// Merge store
	const { startMerge, openMergeGraphWindow, openDiffWindow } = useMergeStore();

	// Фильтрация коммитов по поисковому запросу
	const filteredCommits = useMemo(() => {
		if (!searchText.trim()) return commits;

		const query = searchText.toLowerCase();
		return commits.filter(
			(commit) =>
				commit.name.toLowerCase().includes(query) ||
				commit.author.toLowerCase().includes(query) ||
				commit.description?.toLowerCase().includes(query) ||
				commit.fileName?.toLowerCase().includes(query) ||
				commit.processName?.toLowerCase().includes(query),
		);
	}, [commits, searchText]);

	// Сортировка по дате загрузки (старые сверху)
	const sortedCommits = useMemo(() => {
		return [...filteredCommits].sort(
			(a, b) =>
				new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
		);
	}, [filteredCommits]);

	const handleUpload = (
		file: File,
		metadata: { name: string; description: string },
	) => {
		// Имитация загрузки файла
		const newCommit: CommitQueueItem = {
			id: Date.now().toString(),
			name: metadata.name,
			author: "Текущий пользователь",
			status: "processing",
			uploadDate: new Date().toISOString(),
			fileType: "JSON",
			description: metadata.description,
			fileName: file.name,
			fileSize: file.size,
			processName: metadata.name.toLowerCase().replace(/\s+/g, "_"),
		};

		setCommits((prev) => [...prev, newCommit]);

		// Имитация обработки
		setTimeout(() => {
			setCommits((prev) =>
				prev.map((commit) =>
					commit.id === newCommit.id
						? {
								...commit,
								status: Math.random() > 0.3 ? "validated" : "not_validated",
							}
						: commit,
				),
			);
		}, 2000);
	};

	const handleEdit = (commit: CommitQueueItem) => {
		setSelectedCommit(commit);
		setEditDialogOpen(true);
	};

	const handleView = (commit: CommitQueueItem) => {
		setSelectedCommit(commit);
		setViewDialogOpen(true);
	};

	const handleReplace = (commit: CommitQueueItem) => {
		setSelectedCommit(commit);
		setReplaceDialogOpen(true);
	};

	const handleEditSave = (
		commitId: string,
		name: string,
		description: string,
	) => {
		setCommits((prev) =>
			prev.map((commit) =>
				commit.id === commitId ? { ...commit, name, description } : commit,
			),
		);
		setEditDialogOpen(false);
		setSelectedCommit(null);
	};

	const handleApply = async () => {
		// Находим первый валидированный коммит в очереди
		const firstValidatedCommit = sortedCommits.find(
			(commit) => commit.status === "validated",
		);

		if (!firstValidatedCommit) {
			console.warn("Нет валидированных коммитов для применения");
			return;
		}

		try {
			// Получаем кумулятивные данные коммита
			const cumulativeData = await jsonDataService.applyCommit(
				firstValidatedCommit.id,
			);

			// Подготавливаем данные для мерджа
			const mergeData = {
				mergedJson: cumulativeData.fullData,
				diffJson: cumulativeData.targetCommit.diff,
				commitId: firstValidatedCommit.id,
				processName: firstValidatedCommit.processName || "unknown_process",
			};

			// Запускаем процесс мерджа
			startMerge(mergeData);

			// Открываем окна для просмотра
			openMergeGraphWindow();
			openDiffWindow();
		} catch (error) {
			console.error("Ошибка при применении коммита:", error);
		}
	};

	const handleReplaceFile = (commitId: string, file: File) => {
		// Обновляем статус коммита на "processing"
		setCommits((prev) =>
			prev.map((commit) =>
				commit.id === commitId
					? {
							...commit,
							status: "processing" as const,
							fileName: file.name,
							fileSize: file.size,
							uploadDate: new Date().toISOString(),
						}
					: commit,
			),
		);

		// Симуляция валидации файла
		setTimeout(() => {
			const newStatus = Math.random() > 0.5 ? "validated" : "not_validated";
			setCommits((prev) =>
				prev.map((commit) =>
					commit.id === commitId
						? { ...commit, status: newStatus as any }
						: commit,
				),
			);
		}, 3000);

		setReplaceDialogOpen(false);
		setSelectedCommit(null);
	};

	// Проверяем, есть ли валидированные коммиты
	const hasValidatedCommits = sortedCommits.some(
		(commit) => commit.status === "validated",
	);

	return (
		<Box>
			<Header>
				<Flex gap={12} alignItems="center">
					<AddIcon onClick={() => setUploadDialogOpen(true)} />

					<Button
						variant="contained"
						size="small"
						onClick={handleApply}
						disabled={!hasValidatedCommits}
					>
						Применить
					</Button>
				</Flex>
			</Header>

			<Box>
				{/* Основной контент с визуализацией очереди и карточками */}
				<Flex gap={6} alignItems="flex-start">
					{/* Визуализация очереди слева */}
					<Box sx={{ flexShrink: 0 }}>
						<QueueVisualization commits={sortedCommits} />
					</Box>

					{/* Карточки коммитов справа */}
					<Box sx={{ flex: 1 }}>
						<Flex justifyContent="space-between" alignItems="center">
							<TextField
								fullWidth
								placeholder="Поиск по наименованию, автору, описанию..."
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
						</Flex>
						<Spacer space={6} />

						{/* Сетка карточек */}
						<Flex flexDirection="column" gap={5}>
							{sortedCommits.map((commit) => (
								<CommitCard
									key={commit.id}
									commit={commit}
									onEdit={handleEdit}
									onView={handleView}
									onReplace={handleReplace}
								/>
							))}
						</Flex>

						{sortedCommits.length === 0 && (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography variant="h6" color="text.secondary">
									{searchText ? "Коммиты не найдены" : "Очередь коммитов пуста"}
								</Typography>
							</Box>
						)}
					</Box>
				</Flex>
			</Box>

			<Spacer space={6} />

			<Box>
				<Typography variant="body2" color="text.secondary">
					Всего коммитов: {sortedCommits.length} | Не прошли валидацию:{" "}
					{
						sortedCommits.filter(
							(c) => c.status === "not_validated" || c.status === "error",
						).length
					}
				</Typography>
			</Box>

			{/* Диалоги */}
			<UploadDialog
				open={uploadDialogOpen}
				onClose={() => setUploadDialogOpen(false)}
				onUpload={handleUpload}
			/>

			<EditCommitDialog
				open={editDialogOpen}
				onClose={() => {
					setEditDialogOpen(false);
					setSelectedCommit(null);
				}}
				commit={selectedCommit}
				onSave={handleEditSave as any}
			/>

			<ViewCommitDialog
				open={viewDialogOpen}
				onClose={() => {
					setViewDialogOpen(false);
					setSelectedCommit(null);
				}}
				commit={selectedCommit}
			/>

			<ReplaceFileDialog
				open={replaceDialogOpen}
				onClose={() => {
					setReplaceDialogOpen(false);
					setSelectedCommit(null);
				}}
				commit={selectedCommit}
				onReplace={handleReplaceFile}
			/>
		</Box>
	);
};
