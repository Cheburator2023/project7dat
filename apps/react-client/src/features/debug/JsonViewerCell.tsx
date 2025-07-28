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
import { JsonEditor } from "json-edit-react";

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

	const jsonString = JSON.stringify(value);
	const preview =
		jsonString.length > maxPreviewLength
			? jsonString.substring(0, maxPreviewLength) + "..."
			: jsonString;

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
			<span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
				{preview}
			</span>
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
					<JsonEditor data={value} setData={() => {}} restrictEdit />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Закрыть</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
