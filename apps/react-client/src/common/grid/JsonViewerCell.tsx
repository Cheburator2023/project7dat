import { useState } from "react";
import {
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ReadOnlyJsonViewer } from "@react-client/common/jsonViewers/ReadOnlyJsonViewer";

interface JsonViewerCellProps {
	value: any;
	maxPreviewLength?: number;
}

export const JsonViewerCell = ({
	value,
	maxPreviewLength = 100,
}: JsonViewerCellProps) => {
	const [open, setOpen] = useState(false);

	if (!value) {
		return <span>-</span>;
	}

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
			<IconButton
				size="small"
				onClick={() => setOpen(true)}
				title="Просмотр JSON"
			>
				<VisibilityIcon fontSize="small" />
			</IconButton>

			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>JSON Данные</DialogTitle>
				<DialogContent>
					<ReadOnlyJsonViewer data={value} />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Закрыть</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
