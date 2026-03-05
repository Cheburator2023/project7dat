import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	TextField,
	Typography,
} from "@mui/material";
import {
	Close as CloseIcon,
	CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useUserStore } from "@react-client/common/stores/userStore";
import { useProcesses, useS2tCommitList } from "@react-client/api/hooks";
import {
	s2tCommitStoreService,
	type S2tValidationError,
} from "@react-client/api/hooks/s2tCommitStoreApi";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";

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
				reject(new Error("Некорректный результат чтения файла"));
				return;
			}
			const commaIdx = result.indexOf(",");
			resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

interface S2tCommitEditorProps {
	active: boolean;
	onClose?: () => void;
	onImported?: () => void;
	onSaved?: (commitId: string) => void;
	onOpenNewVersionUpload?: () => void;
	prefillCommitId?: string | null;
	showCloseButton?: boolean;
}

export const S2tCommitEditor = ({
	active,
	onClose,
	onImported,
	onSaved,
	onOpenNewVersionUpload,
	prefillCommitId,
	showCloseButton = false,
}: S2tCommitEditorProps) => {
	const username = useUserStore((state) => state.username) ?? "system";
	const S2T_PENDING_COMMIT_LS_KEY = "s2t_pending_commit";

	const [_convertedMeta, setConvertedMeta] = useState<{
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
	const [fieldErrors, setFieldErrors] = useState<{
		commitName?: string;
		processName?: string;
	}>({});

	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string>("");
	const [_infoMessage, setInfoMessage] = useState<string>("");
	const [validationWarnings, setValidationWarnings] = useState<
		S2tValidationError[]
	>([]);
	const [savedCommit, setSavedCommit] = useState<{
		id: string;
		state: "processing" | "done" | "failed";
		change_id: number | null;
		error: string | null;
	} | null>(null);
	const [originalCommitId, setOriginalCommitId] = useState<string | null>(null);
	const [prefilledCommitType, setPrefilledCommitType] = useState<
		"table" | "json" | "model" | null
	>(null);

	const s2tCommitsQuery = useS2tCommitList({
		enabled: active && !prefillCommitId,
		limit: 100,
	});
	const hasProcessingCommit = useMemo(
		() =>
			!prefillCommitId &&
			(s2tCommitsQuery.data?.items ?? []).some((c) => c.state === "processing"),
		[prefillCommitId, s2tCommitsQuery.data?.items],
	);

	const showProcessFields = useMemo(() => {
		const fileName = selectedFile?.name?.toLowerCase() ?? "";
		return fileName.length > 0 && !fileName.includes("json_");
	}, [selectedFile?.name]);
	const shouldShowProcessFields = showProcessFields || !!prefillCommitId;

	const processesQuery = useProcesses({
		enabled: active && shouldShowProcessFields,
	});
	const processOptions = processesQuery.data ?? [];
	// const processOptions = useMemo(() => {
	// 	return processItems.map((v) => v.name.trim()).filter((v) => v.length > 0);
	// }, [processItems]);

	// const selectedProcessDescription = useMemo(() => {
	// 	if (!processName.trim()) return null;
	// 	const found = processItems.find(
	// 		(p) => p.name.trim() === processName.trim(),
	// 	);
	// 	return found?.description ?? null;
	// }, [processItems, processName]);

	const resetState = useCallback(() => {
		setSelectedFile(null);
		setCommitName("");
		setCommitDescription("");
		setProcessName("");
		setProcessDescription("");
		setFieldErrors({});
		setConvertedMeta(null);
		setIsSaving(false);
		setError("");
		setInfoMessage("");
		setValidationWarnings([]);
		setSavedCommit(null);
		setOriginalCommitId(null);
		setDragOver(false);
		setPrefilledCommitType(null);
	}, []);

	useEffect(() => {
		if (active) return;
		resetState();
	}, [active, resetState]);

	const handleClose = useCallback(() => {
		resetState();
		onClose?.();
	}, [onClose, resetState]);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			if (!active) return;
			if (!prefillCommitId) return;

			try {
				const commit = await s2tCommitStoreService.getById(prefillCommitId);
				const payload = commit?.payload as any;
				const payloadDesc = (payload?.desc ?? {}) as any;

				if (cancelled) return;

				setCommitName(String(commit?.commit_name ?? ""));
				setCommitDescription(String(commit?.commit_description ?? ""));
				setProcessName(String(payloadDesc?.process ?? ""));
				setProcessDescription(String(payloadDesc?.description ?? ""));
				setPrefilledCommitType(
					(commit?.type ?? null) as "table" | "json" | "model" | null,
				);
				setSavedCommit({
					id: String(commit?.id ?? prefillCommitId),
					state: (commit?.state ?? "done") as "processing" | "done" | "failed",
					change_id:
						typeof commit?.change_id === "number" ? commit.change_id : null,
					error: commit?.error ?? null,
				});
				setOriginalCommitId(
					String(commit?.parent_id ?? commit?.id ?? prefillCommitId),
				);
				setError("");
				setInfoMessage("");
			} catch (e: any) {
				if (cancelled) return;
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Не удалось загрузить коммит",
				);
			}
		};

		run();
		return () => {
			cancelled = true;
		};
	}, [active, prefillCommitId]);

	const MAX_FILE_SIZE_MB = 5;
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	const validateFile = useCallback(
		(file: File): string | null => {
			const name = file.name.toLowerCase();
			if (!name.endsWith(".xlsx")) {
				return "Тип файла не является корректным, загрузите новый файл";
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				return "Превышен максимальный размер файла, загрузите новый файл";
			}
			return null;
		},
		[MAX_FILE_SIZE_BYTES],
	);

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

	const commitType = useMemo<"table" | "json" | "model">(() => {
		const fileName = selectedFile?.name?.toLowerCase() ?? "";
		if (fileName.includes("json_")) return "json";
		if (fileName.includes("model_")) return "model";
		if (selectedFile) return "table";
		return prefilledCommitType ?? "table";
	}, [prefilledCommitType, selectedFile]);

	const commitTypeChip = useMemo(() => {
		const labelMap: Record<typeof commitType, string> = {
			table: "S2T витрина",
			json: "S2T JSON файл",
			model: "S2T модель",
		};
		const colorMap: Record<
			typeof commitType,
			"default" | "primary" | "success" | "warning"
		> = {
			table: "primary",
			json: "success",
			model: "warning",
		};
		return { label: labelMap[commitType], color: colorMap[commitType] };
	}, [commitType]);

	const handleSaveCommit = useCallback(
		async (mode?: "overwrite") => {
			setFieldErrors({});
			if (!commitName.trim()) {
				setError("");
				setFieldErrors({ commitName: "Заполните наименование" });
				return;
			}
			if (shouldShowProcessFields && !processName.trim()) {
				setError("");
				setFieldErrors({ processName: "Заполните наименование процесса" });
				return;
			}

			if (!selectedFile) {
				setError("Выберите файл S2T (.xlsx)");
				return;
			}

			setError("");
			setInfoMessage("");
			setValidationWarnings([]);
			setConvertedMeta(null);
			setIsSaving(true);

			try {
				const xlsxBase64 = await fileToBase64(selectedFile);

				const createPayload: Parameters<
					typeof s2tCommitStoreService.create
				>[0] = {
					commit_name: commitName.trim(),
					commit_description: commitDescription.trim() || undefined,
					user: username,
					xlsxBase64,
					fileName: selectedFile.name,
					processName: shouldShowProcessFields
						? processName.trim() || undefined
						: undefined,
					processDescription: showProcessFields
						? processDescription.trim() || undefined
						: undefined,
				};
				if (mode === "overwrite" && savedCommit?.id) {
					createPayload.id = savedCommit.id;
				}

				const saveResponse = await s2tCommitStoreService.create(createPayload);

				if (saveResponse.warnings?.length) {
					setValidationWarnings(saveResponse.warnings);
				}

				const savedId = saveResponse?.commit?.id;
				if (!savedId) {
					throw new Error("Не удалось сохранить коммит: сервер не вернул id");
				}
				if (!originalCommitId) {
					setOriginalCommitId(savedId);
				}

				setSavedCommit({
					id: savedId,
					state: saveResponse.commit.state,
					change_id: saveResponse.commit.change_id ?? null,
					error: saveResponse.commit.error ?? null,
				});
				setPrefilledCommitType(commitType);

				localStorage.setItem(
					S2T_PENDING_COMMIT_LS_KEY,
					JSON.stringify({
						commitId: savedId,
						originalCommitId: originalCommitId ?? savedId,
						state: "saved",
						updatedAt: new Date().toISOString(),
					}),
				);

				setInfoMessage("Коммит сохранён.");
				onImported?.();
				onSaved?.(savedId);
			} catch (e: any) {
				const errData = e?.response?.data;
				if (errData?.errors?.length) {
					setValidationWarnings(errData.errors);
					setError(
						errData.message || "Коммит не сохранён: найдены ошибки валидации.",
					);
				} else {
					setError(errData?.message || e?.message || "Ошибка импорта");
				}
			} finally {
				setIsSaving(false);
			}
		},
		[
			commitDescription,
			commitName,
			commitType,
			onImported,
			processDescription,
			processName,
			selectedFile,
			savedCommit?.id,
			shouldShowProcessFields,
			showProcessFields,
			username,
			originalCommitId,
			onSaved,
		],
	);

	return (
		<Card>
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 2,
				}}
			>
				{showCloseButton && (
					<IconButton
						onClick={handleClose}
						disabled={isSaving}
						title="Закрыть"
						edge="end"
						size="small"
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				)}
			</Box>

			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				<Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 2 }}>
					<Typography sx={{ pt: 1 }}>
						Наименование
						<Typography component="span" color="error">
							*
						</Typography>
					</Typography>
					<TextField
						name="s2tCommitName"
						autoComplete="s2tCommitName"
						value={commitName}
						onChange={(e) => {
							setCommitName(e.target.value);
							setFieldErrors((prev) => ({
								...prev,
								commitName: undefined,
							}));
						}}
						placeholder="Название коммита"
						fullWidth
						disabled={isSaving}
						error={Boolean(fieldErrors.commitName)}
						helperText={fieldErrors.commitName}
					/>
					<Typography sx={{ pt: 1 }}>Описание</Typography>
					<TextField
						name="s2tCommitDescription"
						autoComplete="s2tCommitDescription"
						value={commitDescription}
						onChange={(e) => setCommitDescription(e.target.value)}
						multiline
						rows={3}
						fullWidth
						disabled={isSaving}
					/>
				</Box>

				{shouldShowProcessFields && (
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
								<Typography sx={{ pt: 1 }}>
									Наименование
									<Typography component="span" color="error">
										*
									</Typography>
								</Typography>

								<div>
									<TextField
										name="s2tProcessName"
										autoComplete="s2tProcessName"
										placeholder="выберите или введите наименование процесса"
										fullWidth
										value={processName}
										onChange={(e) => {
											setProcessName(e.target.value);
											setFieldErrors((prev) => ({
												...prev,
												processName: undefined,
											}));
										}}
										disabled={isSaving}
										error={Boolean(fieldErrors.processName)}
										helperText={fieldErrors.processName}
									/>
									<Spacer />
									<Card
										height="200px"
										overflow="auto"
										innerWrapperHeight="-webkit-fill-available"
									>
										{processOptions
											.filter((process) => process.includes(processName))
											.map((process) => {
												return (
													<div
														key={process}
														style={{
															cursor: "pointer",
															backgroundColor:
																process === processName
																	? "#027bf317"
																	: undefined,
															padding: "4px 8px",
															borderRadius: "4px",
														}}
														onClick={() => {
															setProcessName(process);
															setFieldErrors((prev) => ({
																...prev,
																processName: undefined,
															}));
														}}
													>
														{process}
													</div>
												);
											})}
									</Card>
								</div>
								<Typography sx={{ pt: 1 }}>Описание</Typography>
								<TextField
									name="s2tProcessDescription"
									autoComplete="s2tProcessDescription"
									value={processDescription}
									onChange={(e) => setProcessDescription(e.target.value)}
									multiline
									rows={3}
									fullWidth
									disabled={isSaving}
								/>
							</Box>
						</Box>
					</>
				)}

				<Divider />

				{hasProcessingCommit && (
					<Alert severity="warning">
						Загрузка нового коммита невозможна: есть несмерженный коммит в
						обработке. Дождитесь завершения или удалите его.
					</Alert>
				)}

				<Box>
					<Typography variant="subtitle1" gutterBottom>
						Файл S2T
					</Typography>
					<UploadBox
						className={dragOver ? "dragover" : ""}
						onDrop={hasProcessingCommit ? undefined : handleDrop}
						onDragOver={hasProcessingCommit ? undefined : handleDragOver}
						onDragLeave={hasProcessingCommit ? undefined : handleDragLeave}
						onClick={
							hasProcessingCommit
								? undefined
								: () => document.getElementById("s2t-file-input")?.click()
						}
						sx={
							hasProcessingCommit
								? { opacity: 0.5, pointerEvents: "none" }
								: undefined
						}
					>
						<CloudUploadIcon sx={{ fontSize: 32, color: "text.secondary" }} />
						<Typography variant="h6" gutterBottom>
							Перетащите файл сюда или нажмите для выбора
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Поддерживаются XLSX файлы
						</Typography>
						{selectedFile && (
							<div>
								<Typography variant="body2" color="text.secondary">
									Выбран файл: {selectedFile.name}
								</Typography>
								<Spacer space={4} />
								<Chip
									label={"Тип: " + commitTypeChip.label}
									color={commitTypeChip.color}
									size="small"
									variant="filled"
								/>
							</div>
						)}
					</UploadBox>
					<input
						id="s2t-file-input"
						type="file"
						accept=".xlsx"
						onChange={handleFileChange}
						style={{ display: "none" }}
					/>
				</Box>

				<Spacer space={1} />

				{validationWarnings.length > 0 && (
					<Alert severity={error ? "error" : "warning"}>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Typography variant="subtitle2">
								{error ? "Ошибки валидации" : "Предупреждения"}
							</Typography>
							{validationWarnings.map((w, idx) => (
								<Typography key={idx} variant="body2">
									<strong>[{w.code}]</strong> {w.message}
									{w.details && ` — ${w.details}`}
								</Typography>
							))}
						</Box>
					</Alert>
				)}

				{error && <Alert severity="error">{error}</Alert>}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
				{prefillCommitId && (
					<Button
						onClick={onOpenNewVersionUpload}
						variant="outlined"
						disabled={isSaving}
					>
						Загрузить новую версию S2T
					</Button>
				)}
				<Button
					onClick={handleClose}
					disabled={isSaving}
					title="Закрыть без сохранения и без применения изменений."
				>
					Отмена
				</Button>
				<Button
					onClick={() =>
						handleSaveCommit(savedCommit?.id ? "overwrite" : undefined)
					}
					data-name="s2t_save_button"
					variant="contained"
					disabled={isSaving || !selectedFile || hasProcessingCommit}
					title={
						!selectedFile
							? "Сначала приложите файл S2T (.xlsx)."
							: savedCommit?.id
								? "Сохранить текущий результат конвертации в хранилище коммитов, перезаписав ранее сохранённый коммит."
								: "Сохранить текущий результат конвертации в хранилище коммитов как новый коммит."
					}
				>
					{isSaving ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<CircularProgress size={18} />
							<span>Сохранение</span>
						</Box>
					) : (
						"Сохранить"
					)}
				</Button>
			</Box>
		</Card>
	);
};
