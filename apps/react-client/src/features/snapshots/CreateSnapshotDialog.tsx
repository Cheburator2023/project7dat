import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	CircularProgress,
} from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useCreateSnapshot } from "@react-client/api/hooks";
import { toast } from "sonner";

interface CreateSnapshotDialogProps {
	open: boolean;
	onClose: () => void;
}

export function CreateSnapshotDialog({
	open,
	onClose,
}: CreateSnapshotDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [version, setVersion] = useState("");
	const [metadata, setMetadata] = useState("");

	const { currentGraphId } = useDataLineageStore();
	const createSnapshotMutation = useCreateSnapshot();

	const handleSubmit = async () => {
		if (!name.trim() || !version.trim()) {
			toast.error("Название и версия обязательны");
			return;
		}

		if (!currentGraphId) {
			toast.error("Нет активного графа для создания снимка");
			return;
		}

		try {
			let parsedMetadata = {};
			if (metadata.trim()) {
				try {
					parsedMetadata = JSON.parse(metadata);
				} catch {
					toast.error("Неверный формат метаданных (должен быть JSON)");
					return;
				}
			}

			await createSnapshotMutation.mutateAsync({
				name: name.trim(),
				description: description.trim() || undefined,
				version: version.trim(),
				metadata:
					Object.keys(parsedMetadata).length > 0 ? parsedMetadata : undefined,
			});

			toast.success("Снимок успешно создан");
			handleClose();
		} catch (error) {
			console.error("Error creating snapshot:", error);
			toast.error("Ошибка при создании снимка");
		}
	};

	const handleClose = () => {
		setName("");
		setDescription("");
		setVersion("");
		setMetadata("");
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Создать снимок</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<TextField
						label="Название"
						value={name}
						onChange={(e) => setName(e.target.value)}
						fullWidth
						required
						autoFocus
					/>
					<TextField
						label="Версия"
						value={version}
						onChange={(e) => setVersion(e.target.value)}
						fullWidth
						required
						placeholder="1.0.0"
					/>
					<TextField
						label="Описание"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						rows={3}
					/>
					<TextField
						label="Метаданные (JSON)"
						value={metadata}
						onChange={(e) => setMetadata(e.target.value)}
						fullWidth
						multiline
						rows={4}
						placeholder='{"author": "user", "tags": ["production"]}'
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={handleClose}
					disabled={createSnapshotMutation.isPending}
				>
					Отмена
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={
						createSnapshotMutation.isPending || !name.trim() || !version.trim()
					}
					startIcon={
						createSnapshotMutation.isPending ? (
							<CircularProgress size={16} />
						) : null
					}
				>
					Создать
				</Button>
			</DialogActions>
		</Dialog>
	);
}
