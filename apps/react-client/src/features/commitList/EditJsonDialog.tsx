import { useState, useEffect, useCallback, memo } from "react";
import type { FC } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	CircularProgress,
	Alert,
	Box,
	Typography,
} from "@mui/material";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";
import { CodeJsonEditor } from "@react-client/features/codeEditor/CodeJsonEditor";

interface EditJsonDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	editable?: boolean;
	onClose: () => void;
	onSaved: () => void;
}

interface EditJsonDialogEditorProps {
	data: Record<string, unknown>;
	dataKey: string;
	editable: boolean;
	saving: boolean;
	onChange: (data: any) => void;
}

const EditJsonDialogEditor = memo(
	({
		data,
		dataKey,
		editable,
		saving,
		onChange,
	}: EditJsonDialogEditorProps) => {
		return (
			<CodeJsonEditor
				initialData={data}
				dataKey={dataKey}
				onChange={onChange}
				editable={editable && !saving}
				autoExpandAll={true}
				deferInitialization={true}
				syncWithDataLineageStore={false}
			/>
		);
	},
);

EditJsonDialogEditor.displayName = "EditJsonDialogEditor";

export const EditJsonDialog: FC<EditJsonDialogProps> = ({
	open,
	commit,
	editable = true,
	onClose,
	onSaved,
}) => {
	const [editedPayload, setEditedPayload] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditorMounted, setIsEditorMounted] = useState(false);

	useEffect(() => {
		if (commit) {
			setEditedPayload(commit.payload as Record<string, unknown>);
			setError(null);
		}
	}, [commit]);

	useEffect(() => {
		if (!open || !commit) {
			setIsEditorMounted(false);
			return;
		}

		setIsEditorMounted(false);
		const rafId = window.requestAnimationFrame(() => {
			window.setTimeout(() => {
				setIsEditorMounted(true);
			}, 0);
		});

		return () => {
			window.cancelAnimationFrame(rafId);
		};
	}, [open, commit]);

	const handleEditorChange = useCallback((data: any) => {
		setEditedPayload(data as Record<string, unknown>);
	}, []);

	const handleSave = async () => {
		if (!commit || !editedPayload) return;
		setSaving(true);
		setError(null);
		try {
			await s2tCommitStoreService.update({
				id: commit.id,
				commit_name: commit.commit_name,
				commit_description: commit.commit_description ?? undefined,
				type: commit.type,
				user: commit.user ?? undefined,
				payload: editedPayload,
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
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				Редактирование JSON коммита
				{commit && (
					<Typography variant="body2" color="text.secondary">
						{commit.commit_name} ({commit.id.slice(0, 8)})
					</Typography>
				)}
			</DialogTitle>
			<DialogContent sx={{ p: 0 }}>
				{error && (
					<Alert severity="error" sx={{ mx: 2, mt: 1 }}>
						{error}
					</Alert>
				)}

				<Box sx={{ p: 2, height: 560 }}>
					{!isEditorMounted || !editedPayload || !commit ? (
						<Box
							sx={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 1,
							}}
						>
							<CircularProgress size={24} />
							<Typography variant="body2" color="text.secondary">
								Подготавливаем JSON редактор…
							</Typography>
						</Box>
					) : (
						<EditJsonDialogEditor
							data={editedPayload}
							dataKey={commit.id}
							editable={editable}
							saving={saving}
							onChange={handleEditorChange}
						/>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Отмена
				</Button>
				{editable && (
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={saving || !editedPayload}
						startIcon={saving ? <CircularProgress size={16} /> : undefined}
					>
						Сохранить
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};
