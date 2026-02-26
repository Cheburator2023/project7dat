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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	s2tCommitStoreService,
	type ApplyS2tCommitPayload,
} from "@react-client/api/hooks/s2tCommitStoreApi";
import { useAuthStore } from "@react-client/common/stores/authStore";
import {
	PAGINATED_ENTITY_RELATIONS_QUERY_KEY,
	S2T_COMMIT_BY_ID_QUERY_KEY,
} from "@react-client/api/hooks";
import { PAGINATED_MODEL_RELATIONS_QUERY_KEY } from "@react-client/api/hooks/usePaginatedModelRelations";
import { routes } from "@react-client/routing/routes";
import { useCommitMergeStore } from "../stores/commitMergeStore";

export const CommitMergeActionsPanel = memo(() => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";

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
			await s2tCommitStoreService.apply(commit.id, {
				user: username,
				sourceType,
			} satisfies ApplyS2tCommitPayload);
			toast.success("Коммит успешно применён");
			queryClient.invalidateQueries({
				queryKey: [...PAGINATED_ENTITY_RELATIONS_QUERY_KEY],
			});
			queryClient.invalidateQueries({
				queryKey: [...PAGINATED_MODEL_RELATIONS_QUERY_KEY],
			});
			queryClient.invalidateQueries({
				queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY],
			});
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
		queryClient,
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
