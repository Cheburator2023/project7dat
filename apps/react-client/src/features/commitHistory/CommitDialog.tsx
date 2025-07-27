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
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useColorScheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
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
	const {
		commitChangesWithMessage,
		hasUnsavedChanges,
		currentGraph,
		originalGraph,
	} = useDataLineageStore();
	const { mode } = useColorScheme();

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
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
					sx={{ mb: 2 }}
				/>

				{hasUnsavedChanges && currentGraph && originalGraph && (
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography>Просмотр изменений</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Box sx={{ maxHeight: 400, overflow: "auto" }}>
								<ReactDiffViewer
									oldValue={JSON.stringify(originalGraph, null, 2)}
									newValue={JSON.stringify(currentGraph, null, 2)}
									splitView={true}
									compareMethod={DiffMethod.CHARS}
									useDarkTheme={mode === "dark"}
									showDiffOnly
									leftTitle="Исходная версия"
									rightTitle="Новая версия"
								/>
							</Box>
						</AccordionDetails>
					</Accordion>
				)}
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
