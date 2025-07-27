import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Typography,
	Box,
} from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

interface CommitDialogProps {
	open: boolean;
	onClose: () => void;
}

export const CommitDialog: React.FC<CommitDialogProps> = ({
	open,
	onClose,
}) => {
	const [message, setMessage] = useState("");
	const [isCommitting, setIsCommitting] = useState(false);
	const { commitChangesWithMessage, hasUnsavedChanges } = useDataLineageStore();

	const handleCommit = async () => {
		if (!message.trim()) return;

		try {
			setIsCommitting(true);
			await commitChangesWithMessage(message.trim());
			setMessage("");
			onClose();
		} catch (error) {
			console.error("Ошибка при коммите:", error);
		} finally {
			setIsCommitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>Сохранить изменения</DialogTitle>
			<DialogContent>
				<Box sx={{ mb: 2 }}>
					<Typography variant="body2" color="text.secondary">
						{hasUnsavedChanges
							? "У вас есть несохраненные изменения"
							: "Нет изменений для сохранения"}
					</Typography>
				</Box>

				<TextField
					fullWidth
					label="Сообщение коммита"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					multiline
					rows={3}
					placeholder="Опишите ваши изменения..."
					disabled={isCommitting || !hasUnsavedChanges}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isCommitting}>
					Отмена
				</Button>
				<Button
					onClick={handleCommit}
					variant="contained"
					disabled={!message.trim() || isCommitting || !hasUnsavedChanges}
				>
					{isCommitting ? "Сохранение..." : "Сохранить"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
