import { memo, useCallback } from "react";
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
import { routes } from "@react-client/routing/routes";
import { useCommitMergeStore } from "../stores/commitMergeStore";
import type { MergeDiffItem } from "@react-client/api/hooks/mergeApi";
import { useMergingSessionStore } from "../stores/mergingSessionStore";

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
	const navigate = useNavigate();
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";

	const applyMutation = useMergeApply();
	const confirmMutation = useMergeConfirm();
	const cancelMutation = useMergeCancel();

	const {
		commit,
		applying,
		error,
		mergeStep,
		mergeSessionId,
		mergeDiff,
		mergeStats,
		setApplying,
		setError,
		setMergeStep,
		setMergeSessionId,
		setMergeDiff,
		setMergeStats,
	} = useCommitMergeStore();

	const isDone = commit?.state === "done" || commit?.state === "failed";

	const handleApply = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			const result = await applyMutation.mutateAsync(commit.id);
			setMergeSessionId(result.mergeSessionId);
			setMergeDiff(result.diff);
			setMergeStats({
				changedEntitiesCount: result.changedEntitiesCount,
				changedAttributesCount: result.changedAttributesCount,
				changedMappingsCount: result.changedMappingsCount,
			});
			setMergeStep("previewing");
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
		setError,
		setMergeSessionId,
		setMergeDiff,
		setMergeStats,
		setMergeStep,
	]);

	const handleConfirm = useCallback(async () => {
		if (!commit || !mergeSessionId) return;
		setApplying(true);
		setError(null);
		try {
			await confirmMutation.mutateAsync({
				commitId: commit.id,
				user: username,
			});
			useMergingSessionStore.getState().setPollingSessionId(mergeSessionId);
			setMergeStep("confirmed");
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
		navigate,
	]);

	const handleCancel = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			await cancelMutation.mutateAsync(commit.id);
			setMergeStep("idle");
			setMergeSessionId(null);
			setMergeDiff([]);
			setMergeStats(null);
			toast.info("Слияние отменено");
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка отмены слияния",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		cancelMutation,
		setApplying,
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

			{mergeStep === "idle" && (
				<Box
					sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "auto" }}
				>
					<Typography variant="body2" color="text.secondary">
						Нажмите «Предпросмотр», чтобы проверить изменения перед применением
						к модели данных.
					</Typography>
					<Button
						onClick={handleApply}
						variant="contained"
						startIcon={
							applying ? <CircularProgress size={16} /> : <MergeIcon />
						}
						disabled={applying || isDone}
						fullWidth
					>
						{applying ? "Расчёт изменений..." : "Предпросмотр слияния"}
					</Button>
				</Box>
			)}

			{mergeStep === "previewing" && mergeStats && (
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
												sx: { fontFamily: "monospace", wordBreak: "break-all" },
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
						<Button
							onClick={handleConfirm}
							variant="contained"
							color="error"
							startIcon={
								applying ? <CircularProgress size={16} /> : <CheckCircleIcon />
							}
							disabled={applying}
							fullWidth
						>
							{applying ? "Сохранение..." : "Подтвердить слияние"}
						</Button>
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
							Отменить
						</Button>
					</Box>
				</>
			)}
		</Box>
	);
});

CommitMergeActionsPanel.displayName = "CommitMergeActionsPanel";
