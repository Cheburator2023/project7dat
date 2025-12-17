import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Divider,
	Chip,
	Paper,
	IconButton,
	useColorScheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { ChangelogTableEntry } from "../types";

interface ChangelogDetailsModalProps {
	open: boolean;
	onClose: () => void;
	entry: ChangelogTableEntry | null;
}

const DiffViewer = ({
	beforeData,
	afterData,
	changeType,
}: {
	beforeData: Record<string, any> | null | undefined;
	afterData: Record<string, any> | null | undefined;
	changeType: string;
}) => {
	const { mode } = useColorScheme();

	// Подготавливаем данные для diff viewer
	const oldValue = beforeData ? JSON.stringify(beforeData, null, 2) : "";
	const newValue = afterData ? JSON.stringify(afterData, null, 2) : "";

	// Определяем заголовки в зависимости от типа изменения
	const leftTitle = changeType === "added" ? "" : "До изменения";
	const rightTitle = changeType === "deleted" ? "" : "После изменения";

	// Для добавленных объектов показываем только правую часть
	if (changeType === "added") {
		return (
			<Paper sx={{ p: 2 }}>
				<Typography variant="subtitle2" gutterBottom color="text.secondary">
					Добавленные данные
				</Typography>
				<ReactDiffViewer
					oldValue=""
					newValue={newValue}
					splitView={false}
					compareMethod={DiffMethod.WORDS}
					useDarkTheme={mode === "dark"}
					showDiffOnly={false}
					hideLineNumbers={false}
					rightTitle={rightTitle}
				/>
			</Paper>
		);
	}

	// Для удаленных объектов показываем только левую часть
	if (changeType === "deleted") {
		return (
			<Paper sx={{ p: 2 }}>
				<Typography variant="subtitle2" gutterBottom color="text.secondary">
					Удаленные данные
				</Typography>
				<ReactDiffViewer
					oldValue={oldValue}
					newValue=""
					splitView={false}
					compareMethod={DiffMethod.WORDS}
					useDarkTheme={mode === "dark"}
					showDiffOnly={false}
					hideLineNumbers={false}
					leftTitle={leftTitle}
				/>
			</Paper>
		);
	}

	// Для обновленных объектов показываем diff
	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="subtitle2" gutterBottom color="text.secondary">
				Сравнение изменений
			</Typography>
			<ReactDiffViewer
				oldValue={oldValue}
				newValue={newValue}
				splitView={true}
				compareMethod={DiffMethod.WORDS}
				useDarkTheme={mode === "dark"}
				showDiffOnly={false}
				hideLineNumbers={false}
				leftTitle={leftTitle}
				rightTitle={rightTitle}
			/>
		</Paper>
	);
};

const getChangeTypeColor = (changeType: string) => {
	switch (changeType) {
		case "added":
			return "success";
		case "updated":
			return "warning";
		case "deleted":
			return "error";
		default:
			return "default";
	}
};

const getChangeTypeLabel = (changeType: string) => {
	switch (changeType) {
		case "added":
			return "Добавлен";
		case "updated":
			return "Обновлен";
		case "deleted":
			return "Удален";
		default:
			return changeType;
	}
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("ru-RU", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export const ChangelogDetailsModal = ({
	open,
	onClose,
	entry,
}: ChangelogDetailsModalProps) => {
	if (!entry) return null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: { minHeight: "70vh" },
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="h6">Детали изменения</Typography>
				<IconButton onClick={onClose} size="small">
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent dividers>
				<Box sx={{ mb: 3 }}>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								ID версии:
							</Typography>
							<Typography variant="body1" fontFamily="monospace">
								{entry.versionId}
							</Typography>
						</Box>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								Дата изменения:
							</Typography>
							<Typography variant="body1">
								{formatDate(entry.changeDate)}
							</Typography>
						</Box>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								Пользователь:
							</Typography>
							<Typography variant="body1">{entry.userName}</Typography>
						</Box>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								Процесс:
							</Typography>
							<Typography variant="body1">{entry.processName}</Typography>
						</Box>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								Объект:
							</Typography>
							<Typography variant="body1">{entry.objectName}</Typography>
						</Box>
						<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
							<Typography variant="body2" color="text.secondary">
								Тип объекта:
							</Typography>
							<Typography variant="body1">{entry.objectType}</Typography>
						</Box>
						<Box sx={{ flex: "1 1 100%" }}>
							<Typography variant="body2" color="text.secondary">
								Тип изменения:
							</Typography>
							<Chip
								label={getChangeTypeLabel(entry.changeType)}
								color={getChangeTypeColor(entry.changeType) as any}
								size="small"
								sx={{ mt: 0.5 }}
							/>
						</Box>
					</Box>
				</Box>

				<Divider sx={{ my: 3 }} />

				<Typography variant="h6" gutterBottom>
					Метаданные изменения (JSON diff)
				</Typography>

				{entry.beforeData || entry.afterData ? (
					<DiffViewer
						beforeData={entry.beforeData}
						afterData={entry.afterData}
						changeType={entry.changeType}
					/>
				) : (
					<Paper
						sx={{
							p: 2,
							backgroundColor:
								entry.changeType === "added" ? "success.light" : "error.light",
							color:
								entry.changeType === "added"
									? "success.contrastText"
									: "error.contrastText",
						}}
					>
						<Typography variant="body2" align="center">
							{entry.changeType === "added"
								? "Объект был добавлен (без метаданных)"
								: "Объект был удален (без метаданных)"}
						</Typography>
					</Paper>
				)}
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} variant="contained">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
