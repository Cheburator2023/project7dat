import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { default as axios } from "axios";
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
import { useAuthStore } from "@react-client/common/store/authStore";
import { useProcesses } from "@react-client/api/hooks";
import { Card } from "@react-client/common/muiCustom/Card";
import { Spacer } from "@react-client/common/primitives/Spacer";

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
	prefillCommitId?: string | null;
	showCloseButton?: boolean;
}

export const S2tCommitEditor = ({
	active,
	onClose,
	onImported,
	prefillCommitId,
	showCloseButton = false,
}: S2tCommitEditorProps) => {
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";
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
	const [isApplying, setIsApplying] = useState(false);
	const [error, setError] = useState<string>("");
	const [_infoMessage, setInfoMessage] = useState<string>("");
	const [_validationErrors, setValidationErrors] = useState<string[]>([]);
	const [_validationWarnings, setValidationWarnings] = useState<string[]>([]);
	const [savedCommit, setSavedCommit] = useState<{
		id: string;
		state: "processing" | "done" | "failed";
		change_id: number | null;
		error: string | null;
	} | null>(null);
	const [originalCommitId, setOriginalCommitId] = useState<string | null>(null);
	const [prefilledCommitJson, setPrefilledCommitJson] = useState<any | null>(
		null,
	);
	const [prefilledCommitType, setPrefilledCommitType] = useState<
		"table" | "json" | "model" | null
	>(null);

	const showProcessFields = useMemo(() => {
		const fileName = selectedFile?.name?.toLowerCase() ?? "";
		return fileName.length > 0 && !fileName.includes("json_");
	}, [selectedFile?.name]);
	const shouldShowProcessFields = showProcessFields || !!prefillCommitId;

	const processesQuery = useProcesses({
		enabled: active && shouldShowProcessFields,
	});
	const isProcessOptionsLoading = processesQuery.isLoading;
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
		setIsApplying(false);
		setError("");
		setInfoMessage("");
		setValidationErrors([]);
		setValidationWarnings([]);
		setSavedCommit(null);
		setOriginalCommitId(null);
		setDragOver(false);
		setPrefilledCommitJson(null);
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
				const res = await axios.get(
					`${API_BASE_URL}/api/s2t-import/commits/${prefillCommitId}`,
				);
				const commit = (res.data?.commit ?? res.data) as any;
				const payload = (commit?.payload ??
					commit?.commitJson ??
					commit?.data) as any;
				const payloadDesc = (payload?.desc ?? commit?.desc) as any;

				if (cancelled) return;

				setCommitName(String(commit?.commit_name ?? commit?.commitName ?? ""));
				setCommitDescription(
					String(commit?.commit_description ?? commit?.commitDescription ?? ""),
				);
				setProcessName(String(payloadDesc?.process ?? ""));
				setProcessDescription(String(payloadDesc?.description ?? ""));
				setPrefilledCommitJson(payload ?? null);
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
		async (mode?: "overwrite" | "edition") => {
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

			const canSaveWithoutFile = Boolean(
				prefilledCommitJson && savedCommit?.id,
			);
			if (!selectedFile && !canSaveWithoutFile) {
				setError("Выберите файл S2T (.xlsx)");
				return;
			}

			setError("");
			setInfoMessage("");
			setValidationErrors([]);
			setValidationWarnings([]);
			setConvertedMeta(null);
			setIsSaving(true);

			try {
				let commitJson: any = null;

				if (selectedFile) {
					const xlsxBase64 = await fileToBase64(selectedFile);

					const convertResponse = await axios.post(
						`${API_BASE_URL}/api/s2t-import/convert-xlsx-to-commit-json`,
						{
							xlsxBase64,
							fileName: selectedFile.name,
							commitName: commitName.trim(),
							processName: shouldShowProcessFields ? processName : undefined,
							processDescription: showProcessFields
								? processDescription.trim()
								: undefined,
						},
					);

					commitJson = convertResponse.data?.commitJson;
					const meta = convertResponse.data?.meta;

					setConvertedMeta({
						fileName: meta?.fileName,
						generatedAt: meta?.generatedAt ?? new Date().toISOString(),
						worksheetsCount: commitJson?.entities?.length ?? 0,
					});
				} else {
					commitJson = {
						...prefilledCommitJson,
						desc: {
							...(prefilledCommitJson?.desc ?? {}),
							process: shouldShowProcessFields ? processName : undefined,
							description: shouldShowProcessFields
								? processDescription.trim() || undefined
								: undefined,
						},
					};
				}

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

				const saveResponse = await axios.post(
					`${API_BASE_URL}/api/s2t-import/commits`,
					{
						id: mode === "overwrite" ? savedCommit?.id : undefined,
						parent_id:
							mode === "edition"
								? (originalCommitId ?? savedCommit?.id)
								: undefined,
						commit_name: commitName.trim(),
						commit_description: commitDescription.trim()
							? commitDescription.trim()
							: undefined,
						type: commitType,
						user: username,
						payload: commitJson,
					},
				);

				const savedId: string | undefined = saveResponse.data?.id;
				if (!savedId) {
					throw new Error("Не удалось сохранить коммит: сервер не вернул id");
				}
				if (!originalCommitId) {
					setOriginalCommitId(savedId);
				}

				setSavedCommit({
					id: savedId,
					state: saveResponse.data?.state,
					change_id: saveResponse.data?.change_id ?? null,
					error: saveResponse.data?.error ?? null,
				});
				setPrefilledCommitJson(commitJson);
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

				setInfoMessage(
					mode === "edition"
						? "Создана редакция коммита. Теперь можно применить."
						: "Коммит сохранён. Теперь можно применить.",
				);
			} catch (e: any) {
				setError(e?.response?.data?.message || e?.message || "Ошибка импорта");
			} finally {
				setIsSaving(false);
			}
		},
		[
			commitDescription,
			commitName,
			commitType,
			originalCommitId,
			prefilledCommitJson,
			processDescription,
			processName,
			selectedFile,
			savedCommit?.id,
			shouldShowProcessFields,
			showProcessFields,
			username,
		],
	);

	const handleApplyCommit = useCallback(async () => {
		if (!savedCommit?.id) {
			setError("Сначала сохраните коммит");
			return;
		}
		setError("");
		setInfoMessage("");
		setIsApplying(true);
		try {
			localStorage.setItem(
				S2T_PENDING_COMMIT_LS_KEY,
				JSON.stringify({
					commitId: savedCommit.id,
					originalCommitId: originalCommitId ?? savedCommit.id,
					state: "applying",
					updatedAt: new Date().toISOString(),
				}),
			);

			const applyResponse = await axios.post(
				`${API_BASE_URL}/api/s2t-import/commits/${savedCommit.id}/apply`,
				{ user: username, sourceType: "DAPP" },
			);

			const commit = applyResponse.data?.commit;
			setSavedCommit({
				id: commit?.id ?? savedCommit.id,
				state: commit?.state ?? "done",
				change_id: commit?.change_id ?? applyResponse.data?.changeId ?? null,
				error: commit?.error ?? null,
			});

			onImported?.();
			setInfoMessage("Коммит применён.");
			localStorage.removeItem(S2T_PENDING_COMMIT_LS_KEY);
			handleClose();
		} catch (e: any) {
			localStorage.setItem(
				S2T_PENDING_COMMIT_LS_KEY,
				JSON.stringify({
					commitId: savedCommit.id,
					originalCommitId: originalCommitId ?? savedCommit.id,
					state: "failed",
					updatedAt: new Date().toISOString(),
				}),
			);
			setError(e?.response?.data?.message || e?.message || "Ошибка применения");
		} finally {
			setIsApplying(false);
		}
	}, [handleClose, onImported, originalCommitId, savedCommit, username]);

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
						disabled={isSaving || isApplying}
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
						disabled={isSaving || isApplying}
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
						disabled={isSaving || isApplying}
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
										disabled={isSaving || isApplying}
										error={Boolean(fieldErrors.processName)}
										helperText={fieldErrors.processName}
									/>
									<Spacer />
									<Card height="200px" overflow="auto">
										{processOptions
											.filter((process) => process.includes(processName))
											.map((process, idx, array) => {
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
									disabled={isSaving || isApplying}
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

				{/* {convertedMeta && (
					<Alert severity="success">
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Typography variant="subtitle2">Конвертация выполнена</Typography>
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
				)} */}

				{/* {validationErrors.length > 0 && (
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
				)} */}

				{/* {validationWarnings.length > 0 && (
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
				)} */}
				{/* 
				{infoMessage && <Alert severity="info">{infoMessage}</Alert>}

				{savedCommit?.id && (
					<Alert severity="info">
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Typography variant="subtitle2">Хранилище коммитов</Typography>
							<Typography variant="body2">
								ID коммита: {savedCommit.id}
							</Typography>
							<Typography variant="body2">
								Состояние:{" "}
								{savedCommit.state === "processing"
									? "в обработке"
									: savedCommit.state === "done"
										? "готово"
										: savedCommit.state === "failed"
											? "ошибка"
											: savedCommit.state}
							</Typography>
							{typeof savedCommit.change_id === "number" && (
								<Typography variant="body2">
									ID изменения: {savedCommit.change_id}
								</Typography>
							)}
							{savedCommit.error && (
								<Typography variant="body2">
									Ошибка: {savedCommit.error}
								</Typography>
							)}
						</Box>
					</Alert>
				)} */}

				{error && <Alert severity="error">{error}</Alert>}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
				<Button
					onClick={handleClose}
					disabled={isSaving || isApplying}
					title="Закрыть без сохранения и без применения изменений."
				>
					Отмена
				</Button>
				<Button
					onClick={() =>
						handleSaveCommit(savedCommit?.id ? "overwrite" : undefined)
					}
					variant="contained"
					disabled={isSaving || isApplying}
					title={
						savedCommit?.id
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
				<Button
					onClick={() => handleSaveCommit("edition")}
					variant="outlined"
					disabled={
						isSaving || isApplying || (!originalCommitId && !savedCommit?.id)
					}
					title="Сохранить как новую редакцию с ссылкой на родительский коммит."
				>
					Сохранить как редакцию
				</Button>
				<Button
					onClick={handleApplyCommit}
					variant="outlined"
					disabled={!savedCommit?.id || isSaving || isApplying}
					title={
						!savedCommit?.id
							? "Сначала сохрани коммит, после этого его можно применить."
							: "Применить сохранённый коммит к текущей модели на сервере."
					}
				>
					{isApplying ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<CircularProgress size={18} />
							<span>Применение</span>
						</Box>
					) : (
						"Применить"
					)}
				</Button>
			</Box>
		</Card>
	);
};
