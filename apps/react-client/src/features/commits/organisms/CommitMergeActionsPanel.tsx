import { memo, useCallback, useEffect } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Alert,
	Typography,
	Chip,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import {
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	Merge as MergeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@react-client/common/stores/authStore";
import { useMergeApply } from "@react-client/api/hooks/useMergeApply";
import { useMergeConfirm } from "@react-client/api/hooks/useMergeConfirm";
import { useMergeCancel } from "@react-client/api/hooks/useMergeCancel";
import { useMergeDeduplicate } from "@react-client/api/hooks/useMergeDeduplicate";
import { routes } from "@react-client/routing/routes";
import { useCommitMergeStore } from "../stores/commitMergeStore";
import type { MergeDiffItem } from "@react-client/api/hooks/mergeApi";
import { useMergeSessionPolling } from "@react-client/api/hooks/useMergeSessionPolling";
import { useUserStore } from "@react-client/common/stores/userStore";
import { Permission } from "@react-client/types/roles";

const DIFF_TYPE_COLOR: Record<
	MergeDiffItem["type"],
	"success" | "error" | "warning"
> = {
	added: "success",
	removed: "error",
	modified: "warning",
};

const DIFF_TYPE_LABEL: Record<MergeDiffItem["type"], string> = {
	added: "добавлено",
	removed: "удалено",
	modified: "изменено",
};

export const CommitMergeActionsPanel = memo(() => {
	const { hasPermission } = useUserStore();

	const navigate = useNavigate();
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";
	const { startPolling, activeSession } = useMergeSessionPolling();
	const applyMutation = useMergeApply();
	const confirmMutation = useMergeConfirm();
	const cancelMutation = useMergeCancel();
	const deduplicateMutation = useMergeDeduplicate();

	const {
		commit,
		applying,
		error,
		mergeStep,
		mergeSessionId,
		mergeDiff,
		mergeStats,
		hasDuplicates,
		duplicatesCount,
		validationWarnings,
		setApplying,
		setError,
		setMergeStep,
		setMergeSessionId,
		setMergeDiff,
		setMergeStats,
		setDuplicateState,
		setValidationWarnings,
	} = useCommitMergeStore();

	const isDone = commit?.state === "done" || commit?.state === "failed";
	const isCurrentCommitSession =
		Boolean(commit?.id) && activeSession?.commitId === commit?.id;
	const isDeduplicationRunning =
		isCurrentCommitSession && activeSession?.status === "deduplicating";
	const isMergeRunning =
		isCurrentCommitSession && activeSession?.status === "merging";

	const handleApply = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			const result = await applyMutation.mutateAsync(commit.id);
			console.log("🐸 Pepe said >> result:", result);

			setMergeSessionId(result.mergeSessionId);
			setMergeDiff(result.diff);
			setMergeStats({
				changedEntitiesCount: result.changedEntitiesCount,
				changedAttributesCount: result.changedAttributesCount,
				changedMappingsCount: result.changedMappingsCount,
			});
			setDuplicateState(result.hasDuplicates, result.duplicatesCount);
			setValidationWarnings(result.validationWarnings || []);
			setMergeStep("previewing");

			if (result.validationWarnings?.length > 0) {
				for (const w of result.validationWarnings.slice(0, 3)) {
					toast.warning(w);
				}
			}

			// if (result.hasDuplicates) {
			// 	toast.warning(
			// 		`Обнаружены дубликаты сущностей: ${result.duplicatesCount}. Запустите дедупликацию перед подтверждением слияния.`,
			// 	);
			// }
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка применения",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		applyMutation,
		setApplying,
		setDuplicateState,
		setError,
		setMergeSessionId,
		setMergeDiff,
		setMergeStats,
		setMergeStep,
		setValidationWarnings,
	]);

	useEffect(() => {
		if (!commit || !activeSession || activeSession.commitId !== commit.id) {
			return;
		}
		if (activeSession.operation !== "deduplication") {
			return;
		}
		if (activeSession.status === "done") {
			toast.success("Дедупликация завершена. Запускаем предпросмотр...");
			setMergeStep("idle");
			setMergeSessionId(null);
			setMergeDiff([]);
			setMergeStats(null);
			setDuplicateState(false, 0);
			setValidationWarnings([]);
			setError(null);
			return;
		}
		if (activeSession.status === "failed") {
			const isCancelled = activeSession.stage.toLowerCase().includes("отмен");
			if (isCancelled) {
				toast.info("Дедупликация отменена");
				setError(null);
			} else {
				setError(activeSession.errorMessage ?? "Ошибка дедупликации");
			}
			setMergeStep("previewing");
		}
	}, [
		activeSession,
		commit,
		handleApply,
		setDuplicateState,
		setError,
		setMergeDiff,
		setMergeSessionId,
		setMergeStats,
		setMergeStep,
		setValidationWarnings,
	]);

	const handleStartDeduplication = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			const result = await deduplicateMutation.mutateAsync(commit.id);
			if (!result.mergeSessionId) {
				toast.success(result.message);
				setDuplicateState(false, 0);
				setValidationWarnings([]);
				return;
			}
			setMergeStep("deduplicating");
			startPolling(result.mergeSessionId);
			toast.info(result.message);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка дедупликации",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		deduplicateMutation,
		handleApply,
		setApplying,
		setDuplicateState,
		setError,
		setMergeStep,
		setValidationWarnings,
		startPolling,
	]);

	const handleConfirm = useCallback(async () => {
		if (!commit || !mergeSessionId) return;
		setApplying(true);
		setError(null);
		try {
			const result = await confirmMutation.mutateAsync({
				commitId: commit.id,
				user: username,
			});
			setMergeStep("confirmed");
			startPolling(result.mergeSessionId || mergeSessionId);
			navigate(routes.allCommits.rootPath);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ??
					err?.message ??
					"Ошибка подтверждения слияния",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		mergeSessionId,
		username,
		confirmMutation,
		setApplying,
		setError,
		setMergeStep,
		startPolling,
		navigate,
	]);

	const handleCancel = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			await cancelMutation.mutateAsync(commit.id);
			if (isDeduplicationRunning) {
				setMergeStep("previewing");
				toast.info("Отмена дедупликации запрошена");
				return;
			}
			setMergeStep("idle");
			setMergeSessionId(null);
			setMergeDiff([]);
			setMergeStats(null);
			setDuplicateState(false, 0);
			toast.info("Слияние отменено");
		} catch (err: any) {
			setError(
				err?.response?.data?.message ??
					err?.message ??
					"Ошибка отмены процесса",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		cancelMutation,
		isDeduplicationRunning,
		setApplying,
		setDuplicateState,
		setError,
		setMergeStep,
		setMergeSessionId,
		setMergeDiff,
		setMergeStats,
	]);

	const diffPreview = mergeDiff.slice(0, 20);
	const diffOverflow = mergeDiff.length - diffPreview.length;

	return (
		<Box
			sx={{
				p: 2,
				height: "100%",
				overflow: "auto",
				display: "flex",
				flexDirection: "column",
				gap: 2,
			}}
		>
			{error && <Alert severity="error">{error}</Alert>}

			{isDone && (
				<Alert severity="info">
					Коммит уже применён (change_id: {commit?.change_id ?? "—"})
				</Alert>
			)}

			<Box
				sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "auto" }}
			>
				<Typography variant="body2" color="text.secondary">
					Нажмите «Предпросмотр», чтобы проверить изменения перед применением к
					модели данных.
				</Typography>
				<Button
					onClick={handleApply}
					variant="contained"
					startIcon={applying ? <CircularProgress size={16} /> : <MergeIcon />}
					disabled={applying || isDone}
					fullWidth
				>
					{applying ? "Расчёт изменений..." : "Предпросмотр слияния"}
				</Button>
			</Box>

			{(mergeStep === "previewing" || mergeStep === "deduplicating") &&
				mergeStats && (
					<>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Chip
								label={`Сущностей: ${mergeStats.changedEntitiesCount}`}
								color="primary"
								size="small"
								variant="outlined"
							/>
							<Chip
								label={`Атрибутов: ${mergeStats.changedAttributesCount}`}
								color="secondary"
								size="small"
								variant="outlined"
							/>
							<Chip
								label={`Маппингов: ${mergeStats.changedMappingsCount}`}
								color="default"
								size="small"
								variant="outlined"
							/>
						</Box>

						{isDeduplicationRunning && activeSession && (
							<Alert severity="info">
								Дедупликация выполняется: {activeSession.stage}{" "}
								{activeSession.progress}%
							</Alert>
						)}

						{mergeDiff.length === 0 ? (
							<Alert severity="info">
								Изменений нет — модель данных не изменится
							</Alert>
						) : (
							<>
								<Typography variant="caption" color="text.secondary">
									Изменения ({mergeDiff.length})
								</Typography>
								<List
									dense
									disablePadding
									sx={{ maxHeight: "100%", overflow: "auto" }}
								>
									{diffPreview.map((item, idx) => (
										<ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
											<Chip
												label={DIFF_TYPE_LABEL[item.type]}
												color={DIFF_TYPE_COLOR[item.type]}
												size="small"
												sx={{ mr: 1, minWidth: 80 }}
											/>
											<ListItemText
												primary={item.path}
												primaryTypographyProps={{
													variant: "caption",
													sx: {
														fontFamily: "monospace",
														wordBreak: "break-all",
													},
												}}
											/>
										</ListItem>
									))}
									{diffOverflow > 0 && (
										<ListItem disableGutters>
											<Typography variant="caption" color="text.secondary">
												...и ещё {diffOverflow} изменений
											</Typography>
										</ListItem>
									)}
								</List>
							</>
						)}

						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 1,
								mt: "auto",
							}}
						>
							{validationWarnings.length > 0 && (
								<Alert severity="warning">
									<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
										Предупреждения валидации:
									</Typography>
									<List dense disablePadding>
										{validationWarnings.map((warning, idx) => (
											<ListItem key={idx} disableGutters sx={{ py: 0 }}>
												<ListItemText
													primary={warning}
													primaryTypographyProps={{ variant: "caption" }}
												/>
											</ListItem>
										))}
									</List>
								</Alert>
							)}
							{hasPermission(Permission.DL_COMMIT_ABORT) &&
								hasDuplicates &&
								!isDeduplicationRunning && (
									<Button
										onClick={handleStartDeduplication}
										variant="contained"
										color="warning"
										startIcon={
											applying ? <CircularProgress size={16} /> : <MergeIcon />
										}
										disabled={applying}
										fullWidth
									>
										{applying
											? "Запуск дедупликации..."
											: "Запустить дедупликацию"}
									</Button>
								)}
							{hasPermission(Permission.DL_COMMIT_APLAY) && (
								<Button
									onClick={handleConfirm}
									variant="contained"
									color="error"
									startIcon={
										applying ? (
											<CircularProgress size={16} />
										) : (
											<CheckCircleIcon />
										)
									}
									disabled={
										applying ||
										hasDuplicates ||
										isDeduplicationRunning ||
										isMergeRunning
									}
									fullWidth
								>
									{applying ? "Сохранение..." : "Подтвердить слияние"}
								</Button>
							)}
							{hasPermission(Permission.DL_COMMIT_ABORT) && (
								<Button
									onClick={handleCancel}
									variant="outlined"
									color="error"
									startIcon={
										applying ? <CircularProgress size={16} /> : <CancelIcon />
									}
									disabled={applying}
									fullWidth
								>
									{isDeduplicationRunning
										? "Отменить дедупликацию"
										: "Отменить"}
								</Button>
							)}
						</Box>
					</>
				)}
		</Box>
	);
});

CommitMergeActionsPanel.displayName = "CommitMergeActionsPanel";
