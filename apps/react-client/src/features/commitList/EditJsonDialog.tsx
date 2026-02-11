import { useState, useEffect, useMemo } from "react";
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
	Tabs,
	Tab,
} from "@mui/material";
import { create as createDiff } from "jsondiffpatch";
import * as htmlFormatter from "jsondiffpatch/formatters/html";
import "jsondiffpatch/formatters/styles/html.css";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";

const diffInstance = createDiff();

interface EditJsonDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	onClose: () => void;
	onSaved: () => void;
}

export const EditJsonDialog: FC<EditJsonDialogProps> = ({
	open,
	commit,
	onClose,
	onSaved,
}) => {
	const [jsonText, setJsonText] = useState("");
	const [originalPayload, setOriginalPayload] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState(0);

	useEffect(() => {
		if (commit) {
			const formatted = JSON.stringify(commit.payload, null, 2);
			setJsonText(formatted);
			setOriginalPayload(commit.payload);
			setError(null);
			setTab(0);
		}
	}, [commit]);

	const { parsedJson, parseError } = useMemo(() => {
		try {
			const parsed = JSON.parse(jsonText);
			return { parsedJson: parsed, parseError: null };
		} catch (e: any) {
			return { parsedJson: null, parseError: e.message as string };
		}
	}, [jsonText]);

	const diffHtml = useMemo(() => {
		if (!originalPayload || !parsedJson) return null;
		const delta = diffInstance.diff(originalPayload, parsedJson);
		if (!delta) return "<p style='padding:8px;color:#666'>Нет изменений</p>";
		return htmlFormatter.format(delta, originalPayload);
	}, [originalPayload, parsedJson]);

	const handleSave = async () => {
		if (!commit || !parsedJson) return;
		setSaving(true);
		setError(null);
		try {
			await s2tCommitStoreService.update({
				id: commit.id,
				commit_name: commit.commit_name,
				commit_description: commit.commit_description ?? undefined,
				type: commit.type,
				user: commit.user ?? undefined,
				payload: parsedJson,
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
				<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
					<Tab label="Редактор" />
					<Tab label="Diff к оригиналу" disabled={!!parseError} />
				</Tabs>

				{tab === 0 && (
					<Box sx={{ p: 2 }}>
						{parseError && (
							<Alert severity="warning" sx={{ mb: 1 }}>
								JSON невалиден: {parseError}
							</Alert>
						)}
						<textarea
							value={jsonText}
							onChange={(e) => setJsonText(e.target.value)}
							style={{
								width: "100%",
								minHeight: 400,
								fontFamily: "monospace",
								fontSize: 13,
								border: parseError ? "2px solid #f44336" : "1px solid #ccc",
								borderRadius: 4,
								padding: 8,
								resize: "vertical",
								backgroundColor: "inherit",
								color: "inherit",
							}}
							spellCheck={false}
							disabled={saving}
						/>
					</Box>
				)}

				{tab === 1 && (
					<Box
						sx={{
							p: 2,
							maxHeight: 500,
							overflow: "auto",
							"& .jsondiffpatch-delta": { fontSize: 13 },
							"& .jsondiffpatch-added .jsondiffpatch-value pre": {
								backgroundColor: "rgba(76,175,80,0.15)",
							},
							"& .jsondiffpatch-deleted .jsondiffpatch-value pre": {
								backgroundColor: "rgba(244,67,54,0.15)",
							},
							"& .jsondiffpatch-modified .jsondiffpatch-value pre": {
								backgroundColor: "rgba(255,152,0,0.15)",
							},
						}}
						dangerouslySetInnerHTML={{
							__html: diffHtml ?? "",
						}}
					/>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Отмена
				</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					disabled={saving || !!parseError || !parsedJson}
					startIcon={saving ? <CircularProgress size={16} /> : undefined}
				>
					Сохранить
				</Button>
			</DialogActions>
		</Dialog>
	);
};
