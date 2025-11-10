import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Alert,
	LinearProgress,
	Chip,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

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

interface ReplaceFileDialogProps {
	open: boolean;
	onClose: () => void;
	commit: CommitQueueItem | null;
	onReplace: (commitId: string, file: File) => void;
}

const UploadBox = styled(Box)(({ theme }) => ({
	border: `2px dashed ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(4),
	textAlign: "center",
	cursor: "pointer",
	transition: "border-color 0.3s ease",
	"&:hover": {
		borderColor: theme.palette.primary.main,
	},
	"&.dragover": {
		borderColor: theme.palette.primary.main,
		backgroundColor: theme.palette.action.hover,
	},
}));

export const ReplaceFileDialog: React.FC<ReplaceFileDialogProps> = ({
	open,
	onClose,
	commit,
	onReplace,
}) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string>("");

	const validateFile = (file: File): string | null => {
		if (file.type !== "application/json") {
			return "Файл должен быть в формате JSON";
		}
		if (file.size > 1024 * 1024) {
			return "Размер файла не должен превышать 1 МБ";
		}
		return null;
	};

	const handleFileSelect = (file: File) => {
		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			setSelectedFile(null);
			return;
		}
		setError("");
		setSelectedFile(file);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setDragOver(false);
		const file = event.dataTransfer.files[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = () => {
		setDragOver(false);
	};

	const handleReplace = async () => {
		if (!selectedFile || !commit) return;

		setUploading(true);
		try {
			// Симуляция загрузки файла
			await new Promise((resolve) => setTimeout(resolve, 2000));
			onReplace(commit.id, selectedFile);
			handleClose();
		} catch (_err) {
			setError("Ошибка при загрузке файла");
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		setSelectedFile(null);
		setError("");
		setUploading(false);
		onClose();
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "not_validated":
				return "Не прошел валидацию";
			case "error":
				return "Ошибка";
			default:
				return status;
		}
	};

	if (!commit) return null;

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="h6">Заменить файл коммита</Typography>
					<Chip
						label={getStatusText(commit.status)}
						color="error"
						size="small"
					/>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{/* Информация о текущем коммите */}
					<Box>
						<Typography variant="subtitle1" gutterBottom>
							Текущий коммит
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Название: {commit.name}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Файл: {commit.fileName}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Размер: {commit.fileSize ? formatFileSize(commit.fileSize) : "—"}
						</Typography>
					</Box>

					{/* Предупреждение */}
					<Alert severity="warning">
						Замена файла приведет к повторной валидации коммита. Убедитесь, что
						новый файл исправляет ошибки валидации.
					</Alert>

					{/* Область загрузки файла */}
					<Box>
						<Typography variant="subtitle1" gutterBottom>
							Выберите новый JSON файл
						</Typography>
						<UploadBox
							className={dragOver ? "dragover" : ""}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onClick={() =>
								document.getElementById("replace-file-input")?.click()
							}
						>
							<CloudUploadIcon
								sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
							/>
							<Typography variant="h6" gutterBottom>
								Перетащите файл сюда или нажмите для выбора
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Поддерживаются только JSON файлы размером до 1 МБ
							</Typography>
						</UploadBox>
						<input
							id="replace-file-input"
							type="file"
							accept=".json,application/json"
							onChange={handleFileChange}
							style={{ display: "none" }}
						/>
					</Box>

					{/* Информация о выбранном файле */}
					{selectedFile && (
						<Box
							sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 1 }}
						>
							<Typography variant="subtitle2" gutterBottom>
								Выбранный файл:
							</Typography>
							<Typography variant="body2">Имя: {selectedFile.name}</Typography>
							<Typography variant="body2">
								Размер: {formatFileSize(selectedFile.size)}
							</Typography>
							<Typography variant="body2">Тип: {selectedFile.type}</Typography>
						</Box>
					)}

					{/* Ошибки */}
					{error && <Alert severity="error">{error}</Alert>}

					{/* Прогресс загрузки */}
					{uploading && (
						<Box>
							<Typography variant="body2" gutterBottom>
								Загрузка и валидация файла...
							</Typography>
							<LinearProgress />
						</Box>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={uploading}>
					Отмена
				</Button>
				<Button
					onClick={handleReplace}
					variant="contained"
					disabled={!selectedFile || uploading}
					startIcon={<CloudUploadIcon />}
				>
					{uploading ? "Загрузка..." : "Заменить файл"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
