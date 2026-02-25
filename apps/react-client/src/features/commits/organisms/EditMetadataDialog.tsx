import { useState, useEffect } from "react";
import type { FC } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	CircularProgress,
	Alert,
} from "@mui/material";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";

interface EditMetadataDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	onClose: () => void;
	onSaved: () => void;
}

export const EditMetadataDialog: FC<EditMetadataDialogProps> = ({
	open,
	commit,
	onClose,
	onSaved,
}) => {
	const [commitName, setCommitName] = useState("");
	const [commitDescription, setCommitDescription] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (commit) {
			setCommitName(commit.commit_name ?? "");
			setCommitDescription(commit.commit_description ?? "");
			setError(null);
		}
	}, [commit]);

	const handleSave = async () => {
		if (!commit) return;
		if (!commitName.trim()) {
			setError("Название коммита обязательно");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await s2tCommitStoreService.update({
				id: commit.id,
				commit_name: commitName.trim(),
				commit_description: commitDescription.trim() || undefined,
				type: commit.type,
				user: commit.user ?? undefined,
				payload: commit.payload,
			});
			onSaved();
			onClose();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка сохранения",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Редактирование метаданных коммита</DialogTitle>
			<DialogContent
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 2,
					pt: "8px !important",
				}}
			>
				{error && <Alert severity="error">{error}</Alert>}
				<TextField
					label="Название"
					value={commitName}
					onChange={(e) => setCommitName(e.target.value)}
					fullWidth
					disabled={saving}
					autoFocus
				/>
				<TextField
					label="Описание"
					value={commitDescription}
					onChange={(e) => setCommitDescription(e.target.value)}
					fullWidth
					multiline
					rows={3}
					disabled={saving}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Отмена
				</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					disabled={saving || !commitName.trim()}
					startIcon={saving ? <CircularProgress size={16} /> : undefined}
				>
					Сохранить
				</Button>
			</DialogActions>
		</Dialog>
	);
};
