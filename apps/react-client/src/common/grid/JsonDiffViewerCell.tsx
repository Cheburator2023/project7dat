import { useState } from "react";
import {
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	useColorScheme,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

interface JsonDiffViewerCellProps {
	diff: { left: any; right: any };
	maxPreviewLength?: number;
	leftTitle?: string;
	rightTitle?: string;
}

export const JsonDiffViewerCell = ({
	diff,
	maxPreviewLength = 100,
	leftTitle = "Предыдущая версия",
	rightTitle = "Текущая версия",
}: JsonDiffViewerCellProps) => {
	const [open, setOpen] = useState(false);
	const { mode } = useColorScheme();

	if (!diff) {
		return <span>-</span>;
	}

	const jsonString = JSON.stringify(diff);
	const preview =
		jsonString.length > maxPreviewLength
			? jsonString.substring(0, maxPreviewLength) + "..."
			: jsonString;

	const oldJsonString = diff.left ? JSON.stringify(diff.left, null, 2) : "{}";
	const newJsonString = diff.right ? JSON.stringify(diff.right, null, 2) : "{}";

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
			<span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
				{preview}
			</span>
			<IconButton
				size="small"
				onClick={() => setOpen(true)}
				title="Просмотр различий JSON"
			>
				<VisibilityIcon fontSize="small" />
			</IconButton>

			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				maxWidth="lg"
				fullWidth
			>
				<DialogTitle>Сравнение JSON данных</DialogTitle>
				<DialogContent>
					<ReactDiffViewer
						oldValue={oldJsonString}
						newValue={newJsonString}
						splitView={true}
						compareMethod={DiffMethod.CHARS}
						useDarkTheme={mode === "dark"}
						showDiffOnly={!diff.left}
						leftTitle={leftTitle}
						rightTitle={rightTitle}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Закрыть</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
