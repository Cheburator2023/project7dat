import { useCallback } from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { S2tCommitEditor } from "./S2tCommitEditor";

interface S2tImportDialogProps {
	open: boolean;
	onClose: () => void;
	onImported?: () => void;
	prefillCommitId?: string | null;
}

export const S2tImportDialog = ({
	open,
	onClose,
	onImported,
	prefillCommitId,
}: S2tImportDialogProps) => {
	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle
				sx={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 2,
				}}
			>
				<IconButton
					onClick={handleClose}
					title="Закрыть"
					edge="end"
					size="small"
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				<S2tCommitEditor
					active={open}
					onClose={handleClose}
					onImported={onImported}
					prefillCommitId={prefillCommitId}
					showCloseButton={false}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} title="Закрыть">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
