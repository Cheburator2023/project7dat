import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	OutlinedInput,
	Box,
} from "@mui/material";

interface CommitQueueItem {
	id: string;
	name: string;
	author: string;
	status: "validated" | "not_validated" | "processing" | "error";
	uploadDate: string;
	fileType: string;
	description?: string;
	fileName?: string;
	fileSize?: number;
	processName?: string;
}

interface EditCommitDialogProps {
	open: boolean;
	onClose: () => void;
	commit: CommitQueueItem | null;
	onSave: (
		commitId: string,
		updates: { name: string; description: string },
	) => void;
}

export const EditCommitDialog: React.FC<EditCommitDialogProps> = ({
	open,
	onClose,
	commit,
	onSave,
}) => {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (commit) {
			setName(commit.name);
			setDescription(commit.description || "");
		}
	}, [commit]);

	const handleSave = () => {
		if (!commit || !name.trim()) return;

		onSave(commit.id, {
			name: name.trim(),
			description: description.trim(),
		});

		handleClose();
	};

	const handleClose = () => {
		setName("");
		setDescription("");
		onClose();
	};

	if (!commit) return null;

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Редактирование коммита</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<FormControl fullWidth>
						<InputLabel>Наименование</InputLabel>
						<OutlinedInput
							value={name}
							onChange={(e) => setName(e.target.value)}
							label="Наименование"
							required
						/>
					</FormControl>

					<FormControl fullWidth>
						<InputLabel>Описание</InputLabel>
						<OutlinedInput
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							label="Описание"
							multiline
							rows={4}
						/>
					</FormControl>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Отмена</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					disabled={!name.trim()}
				>
					Сохранить
				</Button>
			</DialogActions>
		</Dialog>
	);
};
