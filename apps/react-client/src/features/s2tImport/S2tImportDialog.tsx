import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import axios from "axios";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	TextField,
	Typography,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useAuthStore } from "@react-client/common/store/authStore";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";

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

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("Invalid file read result"));
				return;
			}
			const commaIdx = result.indexOf(",");
			resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

interface S2tImportDialogProps {
	open: boolean;
	onClose: () => void;
	onImported?: () => void;
}

export const S2tImportDialog = ({
	open,
	onClose,
	onImported,
}: S2tImportDialogProps) => {
	const authStore = useAuthStore();
	const [convertedMeta, setConvertedMeta] = useState<{
		fileName?: string;
		generatedAt: string;
		worksheetsCount: number;
	} | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dragOver, setDragOver] = useState(false);

	const [commitName, setCommitName] = useState("");
	const [commitDescription, setCommitDescription] = useState("");
	const [processName, setProcessName] = useState("");
	const [processDescription, setProcessDescription] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>("");
	const [infoMessage, setInfoMessage] = useState<string>("");
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

	const showProcessFields = useMemo(() => {
		const fileName = selectedFile?.name?.toLowerCase() ?? "";
		return (
			fileName.length > 0 &&
			!fileName.includes("json_") &&
			!fileName.includes("model_")
		);
	}, [selectedFile?.name]);

	const resetState = useCallback(() => {
		setSelectedFile(null);
		setCommitName("");
		setCommitDescription("");
		setProcessName("");
		setProcessDescription("");
		setConvertedMeta(null);
		setIsSubmitting(false);
		setError("");
		setInfoMessage("");
		setValidationErrors([]);
		setValidationWarnings([]);
		setDragOver(false);
	}, []);

	const handleClose = useCallback(() => {
		resetState();
		onClose();
	}, [onClose, resetState]);

	const validateFile = useCallback((file: File): string | null => {
		const name = file.name.toLowerCase();
		if (!name.endsWith(".xlsx")) {
			return "Файл должен быть в формате XLSX";
		}
		return null;
	}, []);

	const handleFileSelect = useCallback(
		(file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				setSelectedFile(null);
				return;
			}
			setError("");
			setSelectedFile(file);
		},
		[validateFile],
	);

	const handleFileChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const handleDrop = useCallback(
		(event: DragEvent) => {
			event.preventDefault();
			setDragOver(false);
			const file = event.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOver(false);
	}, []);

	const handleSubmit = useCallback(async () => {
		if (!selectedFile) {
			setError("Выберите файл S2T (.xlsx)");
			return;
		}
		if (!commitName.trim()) {
			setError("Заполните наименование");
			return;
		}
		if (showProcessFields && !processName.trim()) {
			setError("Заполните наименование процесса");
			return;
		}

		setError("");
		setInfoMessage("");
		setValidationErrors([]);
		setValidationWarnings([]);
		setConvertedMeta(null);
		setIsSubmitting(true);

		try {
			const xlsxBase64 = await fileToBase64(selectedFile);

			const convertResponse = await axios.post(
				`${API_BASE_URL}/api/s2t/convert-xlsx-to-commit-json`,
				{
					xlsxBase64,
					fileName: selectedFile.name,
					commitName: commitName.trim(),
					processName: showProcessFields ? processName.trim() : undefined,
					processDescription: showProcessFields
						? processDescription.trim()
						: undefined,
				},
			);

			const commitJson = convertResponse.data?.commitJson;
			const meta = convertResponse.data?.meta;

			setConvertedMeta({
				fileName: meta?.fileName,
				generatedAt: meta?.generatedAt ?? new Date().toISOString(),
				worksheetsCount: commitJson?.entities?.length ?? 0,
			});

			const validateResponse = await axios.post(
				`${API_BASE_URL}/api/json-validation/validate`,
				{ data: commitJson },
			);

			if (!validateResponse.data?.isValid) {
				setValidationErrors(
					Array.isArray(validateResponse.data?.errors)
						? validateResponse.data.errors
						: [],
				);
				setValidationWarnings(
					Array.isArray(validateResponse.data?.warnings)
						? validateResponse.data.warnings
						: [],
				);
				return;
			}

			await axios.post(`${API_BASE_URL}/api/json-import/dapp`, {
				data: commitJson,
				user: authStore.userInfo?.username ?? "system",
				changeName: commitName.trim(),
				validated: true,
				sourceType: "DAPP",
			});

			onImported?.();
			handleClose();
		} catch (e: any) {
			setError(e?.response?.data?.message || e?.message || "Ошибка импорта");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		authStore.userInfo?.username,
		commitDescription,
		commitName,
		handleClose,
		onImported,
		processDescription,
		processName,
		selectedFile,
		showProcessFields,
	]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Typography variant="h6">Коммит</Typography>
					<Typography variant="body2" color="text.secondary">
						Файл коммита{" "}
						{selectedFile ? `<${selectedFile.name}>` : "<имя файла S2T>"}
					</Typography>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								display: "inline-block",
								px: 1.5,
								py: 0.5,
								borderRadius: 999,
								backgroundColor: "primary.main",
								color: "primary.contrastText",
								mb: 1,
							}}
						>
							Метаданные
						</Typography>

						<Box
							sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 2 }}
						>
							<Typography sx={{ pt: 1 }}>Наименование</Typography>
							<TextField
								value={commitName}
								onChange={(e) => setCommitName(e.target.value)}
								placeholder="название коммита"
								fullWidth
								disabled={isSubmitting}
							/>
							<Typography sx={{ pt: 1 }}>Описание</Typography>
							<TextField
								value={commitDescription}
								onChange={(e) => setCommitDescription(e.target.value)}
								multiline
								rows={3}
								fullWidth
								disabled={isSubmitting}
							/>
						</Box>
					</Box>

					{showProcessFields && (
						<>
							<Divider />
							<Box>
								<Typography
									variant="subtitle2"
									sx={{
										display: "inline-block",
										px: 1.5,
										py: 0.5,
										borderRadius: 999,
										backgroundColor: "primary.main",
										color: "primary.contrastText",
										mb: 1,
									}}
								>
									Процесс
								</Typography>

								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: "160px 1fr",
										gap: 2,
									}}
								>
									<Typography sx={{ pt: 1 }}>Наименование</Typography>
									<TextField
										value={processName}
										onChange={(e) => setProcessName(e.target.value)}
										placeholder="наименование процесса"
										fullWidth
										disabled={isSubmitting}
									/>
									<Typography sx={{ pt: 1 }}>Описание</Typography>
									<TextField
										value={processDescription}
										onChange={(e) => setProcessDescription(e.target.value)}
										multiline
										rows={3}
										fullWidth
										disabled={isSubmitting}
									/>
								</Box>
							</Box>
						</>
					)}

					<Divider />

					<Box>
						<Typography variant="subtitle1" gutterBottom>
							Файл S2T
						</Typography>
						<UploadBox
							className={dragOver ? "dragover" : ""}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onClick={() => document.getElementById("s2t-file-input")?.click()}
						>
							<CloudUploadIcon
								sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
							/>
							<Typography variant="h6" gutterBottom>
								Перетащите файл сюда или нажмите для выбора
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Поддерживаются XLSX файлы
							</Typography>
						</UploadBox>
						<input
							id="s2t-file-input"
							type="file"
							accept=".xlsx"
							onChange={handleFileChange}
							style={{ display: "none" }}
						/>
					</Box>

					{selectedFile && (
						<Alert severity="info">Выбран файл: {selectedFile.name}</Alert>
					)}

					{convertedMeta && (
						<Alert severity="success">
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
								<Typography variant="subtitle2">
									Конвертация выполнена
								</Typography>
								<Typography variant="body2">
									Файл: {convertedMeta.fileName ?? "—"}
								</Typography>
								<Typography variant="body2">
									Листов: {convertedMeta.worksheetsCount}
								</Typography>
								<Typography variant="body2">
									Время: {convertedMeta.generatedAt}
								</Typography>
							</Box>
						</Alert>
					)}

					{validationErrors.length > 0 && (
						<Alert severity="error">
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
								<Typography variant="subtitle2">Ошибки валидации</Typography>
								{validationErrors.map((m, idx) => (
									<Typography key={idx} variant="body2">
										{m}
									</Typography>
								))}
							</Box>
						</Alert>
					)}

					{validationWarnings.length > 0 && (
						<Alert severity="warning">
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
								<Typography variant="subtitle2">Предупреждения</Typography>
								{validationWarnings.map((m, idx) => (
									<Typography key={idx} variant="body2">
										{m}
									</Typography>
								))}
							</Box>
						</Alert>
					)}

					{infoMessage && <Alert severity="info">{infoMessage}</Alert>}

					{error && <Alert severity="error">{error}</Alert>}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={isSubmitting}>
					Отмена
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<CircularProgress size={18} />
							<span>OK</span>
						</Box>
					) : (
						"OK"
					)}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
