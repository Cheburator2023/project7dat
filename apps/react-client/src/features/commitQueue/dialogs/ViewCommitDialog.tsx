import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Chip,
	Divider,
	Paper,
	CircularProgress,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { useCumulativeCommitData } from "@react-client/api/hooks";

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
	isFromApi?: boolean;
}

interface ViewCommitDialogProps {
	open: boolean;
	onClose: () => void;
	commit: CommitQueueItem | null;
}

const JsonViewer = styled(Paper)(({ theme }) => ({
	backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
	padding: theme.spacing(2),
	fontFamily: "monospace",
	fontSize: "14px",
	maxHeight: "400px",
	overflow: "auto",
	whiteSpace: "pre-wrap",
	wordBreak: "break-word",
}));

export const ViewCommitDialog: React.FC<ViewCommitDialogProps> = ({
	open,
	onClose,
	commit,
}) => {
	const { mode } = useColorScheme();
	const commitId = commit?.id ?? "";
	const {
		data: cumulativeData,
		isLoading,
		error,
	} = useCumulativeCommitData(commitId, {
		enabled: Boolean(commit?.isFromApi && commitId),
	});

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

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	if (!commit) return null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="h6">Просмотр содержимого коммита</Typography>
					<Chip
						label={getStatusText(commit.status)}
						color={getStatusColor(commit.status) as any}
						size="small"
					/>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{/* Информация о коммите */}
					<Box>
						<Typography variant="h6" gutterBottom>
							{commit.name}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							Автор: {commit.author}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							Загружен: {new Date(commit.uploadDate).toLocaleString("ru-RU")}
						</Typography>
						{commit.description && (
							<Typography variant="body2" gutterBottom>
								{commit.description}
							</Typography>
						)}
					</Box>

					<Divider />

					{/* Информация о файле */}
					<Box>
						<Typography variant="subtitle1" gutterBottom>
							Информация о файле
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Имя файла: {commit.fileName}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Размер: {commit.fileSize ? formatFileSize(commit.fileSize) : "—"}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Тип: {commit.fileType}
						</Typography>
						{commit.processName && (
							<Typography variant="body2" color="text.secondary">
								Процесс: {commit.processName}
							</Typography>
						)}
					</Box>

					<Divider />

					{/* Содержимое JSON */}
					<Box>
						<Typography variant="subtitle1" gutterBottom>
							Содержимое
						</Typography>
						{commit.isFromApi ? (
							isLoading ? (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										height: 200,
									}}
								>
									<CircularProgress size={24} />
								</Box>
							) : error ? (
								<JsonViewer>
									{`Ошибка загрузки содержимого коммита: ${error.message}`}
								</JsonViewer>
							) : cumulativeData ? (
								<JsonViewer>
									{JSON.stringify(
										cumulativeData.fullData ??
											cumulativeData.targetCommit?.diff ??
											{},
										null,
										2,
									)}
								</JsonViewer>
							) : (
								<JsonViewer>
									{"Данные содержимого коммита недоступны"}
								</JsonViewer>
							)
						) : (
							<JsonViewer>
								{"Предпросмотр содержимого доступен только для коммитов v2"}
							</JsonViewer>
						)}
					</Box>

					{/* Результаты валидации */}
					{(commit.status === "not_validated" || commit.status === "error") && (
						<>
							<Divider />
							<Box>
								<Typography variant="subtitle1" gutterBottom color="error">
									Ошибки валидации
								</Typography>
								<Paper
									sx={{
										p: 2,
										backgroundColor: "error.light",
										color: "error.contrastText",
									}}
								>
									<Typography variant="body2">
										• Поле "user_id" не может быть пустым в записи #15
									</Typography>
									<Typography variant="body2">
										• Неверный формат email в записи #23: "invalid-email"
									</Typography>
									<Typography variant="body2">
										• Отсутствует обязательное поле "created_at" в записи #31
									</Typography>
								</Paper>
							</Box>
						</>
					)}

					{commit.status === "validated" && (
						<>
							<Divider />
							<Box>
								<Typography
									variant="subtitle1"
									gutterBottom
									color="success.main"
								>
									Результат валидации
								</Typography>
								<Paper
									sx={{
										p: 2,
										backgroundColor: "success.light",
										color: "success.contrastText",
									}}
								>
									<Typography variant="body2">
										✓ Все проверки пройдены успешно
									</Typography>
									<Typography variant="body2">
										✓ Структура данных соответствует схеме
									</Typography>
									<Typography variant="body2">
										✓ Все обязательные поля заполнены
									</Typography>
								</Paper>
							</Box>
						</>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="contained">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
