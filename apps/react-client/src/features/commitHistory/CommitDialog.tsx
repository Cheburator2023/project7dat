import React, { useState, memo } from "react";
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
import { useShallow } from "zustand/react/shallow";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { fastStringify } from "@react-client/shared/src";
import type { DataLineageGraph } from "@react-client/types/dataLineage";

// Separate component for DiffViewer to prevent re-renders on message input
const DiffViewerSection = memo(
	({
		originalGraph,
		currentGraph,
	}: {
		originalGraph: DataLineageGraph;
		currentGraph: DataLineageGraph;
	}) => {
		const { mode } = useColorScheme();
		const originalGraphJson = fastStringify(originalGraph, { space: 2 });
		const currentGraphJson = fastStringify(currentGraph, { space: 2 });

		return (
			<Box sx={{ maxHeight: 400, overflow: "auto" }}>
				<ReactDiffViewer
					oldValue={originalGraphJson}
					newValue={currentGraphJson}
					splitView={true}
					compareMethod={DiffMethod.CHARS}
					useDarkTheme={mode === "dark"}
					showDiffOnly
					leftTitle="Исходная версия"
					rightTitle="Новая версия"
				/>
			</Box>
		);
	},
);

DiffViewerSection.displayName = "DiffViewerSection";

// Separate component for commit form to isolate message state
const CommitForm: React.FC<{
	onClose: () => void;
	hasUnsavedChanges: boolean;
}> = ({ onClose, hasUnsavedChanges }) => {
	const [message, setMessage] = useState("");
	const [isCommitting, setIsCommitting] = useState(false);
	const commitChangesWithMessage = useDataLineageStore(
		(state) => state.commitChangesWithMessage,
	);

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
		<>
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
		</>
	);
};

interface CommitDialogProps {
	open: boolean;
	onClose: () => void;
}

export const CommitDialog: React.FC<CommitDialogProps> = ({
	open,
	onClose,
}) => {
	const { hasUnsavedChanges, currentGraph, originalGraph } =
		useDataLineageStore(
			useShallow((state) => ({
				hasUnsavedChanges: state.hasUnsavedChanges,
				currentGraph: state.currentGraph,
				originalGraph: state.originalGraph,
			})),
		);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>Сохранить изменения</DialogTitle>
			<DialogContent>
				{hasUnsavedChanges && currentGraph && originalGraph && (
					<DiffViewerSection
						originalGraph={originalGraph}
						currentGraph={currentGraph}
					/>
				)}
				<Spacer />
				<CommitForm onClose={onClose} hasUnsavedChanges={hasUnsavedChanges} />
			</DialogContent>
		</Dialog>
	);
};
