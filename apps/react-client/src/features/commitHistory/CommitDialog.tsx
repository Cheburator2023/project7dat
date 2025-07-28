import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	useColorScheme,
} from "@mui/material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Spacer } from "@react-client/common/primitives/Spacer";

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
				{hasUnsavedChanges && currentGraph && originalGraph && (
					<>
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
					</>
				)}
				<Spacer />

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
