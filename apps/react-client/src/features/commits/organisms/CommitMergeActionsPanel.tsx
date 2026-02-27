import { memo, useCallback } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@react-client/common/stores/authStore";
import { useApplyS2tCommit } from "@react-client/api/hooks/useApplyS2tCommit";
import { routes } from "@react-client/routing/routes";
import { useCommitMergeStore } from "../stores/commitMergeStore";

export const CommitMergeActionsPanel = memo(() => {
	const navigate = useNavigate();
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";
	const applyMutation = useApplyS2tCommit();

	const {
		commit,
		sourceType,
		applying,
		error,
		setSourceType,
		setApplying,
		setError,
	} = useCommitMergeStore();

	const isDone = commit?.state === "done" || commit?.state === "failed";

	const handleApply = useCallback(async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			await applyMutation.mutateAsync({
				id: commit.id,
				payload: { user: username, sourceType },
			});
			toast.success("Коммит успешно применён");
			navigate(routes.allCommits.rootPath);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка применения",
			);
		} finally {
			setApplying(false);
		}
	}, [
		commit,
		username,
		sourceType,
		setApplying,
		setError,
		applyMutation,
		navigate,
	]);

	const _handleBack = useCallback(() => {
		navigate(routes.allCommits.rootPath);
	}, [navigate]);

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
			<Typography variant="subtitle2" color="text.secondary">
				Применение коммита
			</Typography>

			{error && <Alert severity="error">{error}</Alert>}

			{isDone && (
				<Alert severity="info">
					Коммит уже применён (change_id: {commit?.change_id ?? "—"})
				</Alert>
			)}

			<FormControl fullWidth size="small">
				<InputLabel>Тип импорта</InputLabel>
				<Select
					value={sourceType}
					label="Тип импорта"
					onChange={(e) => setSourceType(e.target.value as "SURM" | "DAPP")}
					disabled={applying || isDone}
				>
					<MenuItem value="DAPP">DAPP</MenuItem>
					<MenuItem value="SURM">SURM</MenuItem>
				</Select>
			</FormControl>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1,
					mt: "auto",
				}}
			>
				<Button
					onClick={handleApply}
					variant="contained"
					color="error"
					disabled={applying || isDone}
					startIcon={applying ? <CircularProgress size={16} /> : undefined}
					fullWidth
				>
					Применить (merge)
				</Button>
			</Box>
		</Box>
	);
});

CommitMergeActionsPanel.displayName = "CommitMergeActionsPanel";
