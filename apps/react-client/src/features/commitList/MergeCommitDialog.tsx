import { useState } from "react";
import type { FC } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	CircularProgress,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
} from "@mui/material";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import {
	s2tCommitStoreService,
	type ApplyS2tCommitPayload,
} from "@react-client/api/hooks/s2tCommitStoreApi";

interface MergeCommitDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	username: string;
	onClose: () => void;
	onApplied: () => void;
}

export const MergeCommitDialog: FC<MergeCommitDialogProps> = ({
	open,
	commit,
	username,
	onClose,
	onApplied,
}) => {
	const [sourceType, setSourceType] = useState<"SURM" | "DAPP">("DAPP");
	const [applying, setApplying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleApply = async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			await s2tCommitStoreService.apply(commit.id, {
				user: username,
				sourceType,
			} satisfies ApplyS2tCommitPayload);
			onApplied();
			onClose();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка применения",
			);
		} finally {
			setApplying(false);
		}
	};

	const isDone = commit?.state === "done";
	const _isProcessing = commit?.state === "processing";

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Применить коммит (merge)</DialogTitle>
			<DialogContent
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 2,
					pt: "8px !important",
				}}
			>
				{error && <Alert severity="error">{error}</Alert>}
				{isDone && (
					<Alert severity="info">
						Коммит уже применён (change_id: {commit?.change_id ?? "—"})
					</Alert>
				)}
				<Typography variant="body2" color="text.secondary">
					Коммит: <b>{commit?.commit_name}</b> ({commit?.id.slice(0, 8)})
				</Typography>
				<FormControl fullWidth size="small">
					<InputLabel>Тип импорта</InputLabel>
					<Select
						value={sourceType}
						label="Тип импорта"
						onChange={(e) => setSourceType(e.target.value as "SURM" | "DAPP")}
						disabled={applying}
					>
						<MenuItem value="DAPP">DAPP</MenuItem>
						<MenuItem value="SURM">SURM</MenuItem>
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={applying}>
					Отмена
				</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					color="warning"
					disabled={applying || isDone}
					startIcon={applying ? <CircularProgress size={16} /> : undefined}
				>
					Применить
				</Button>
			</DialogActions>
		</Dialog>
	);
};
