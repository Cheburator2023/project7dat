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
	const [versionError, setVersionError] = useState("");

	const { currentGraphId } = useDataLineageStore();
	const createSnapshotMutation = useCreateSnapshot();

	const validateSemver = (value: string): boolean => {
		const semverRegex =
			/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
		return semverRegex.test(value);
	};

	const formatVersionInput = (value: string): string => {
		const cleaned = value.replace(/[^0-9.]/g, "");
		const parts = cleaned.split(".");

		if (parts.length > 3) {
			return parts.slice(0, 3).join(".");
		}

		return cleaned;
	};

	const handleVersionChange = (value: string) => {
		const formatted = formatVersionInput(value);
		setVersion(formatted);

		if (formatted && !validateSemver(formatted)) {
			setVersionError(
				"Неверный формат версии. Используйте формат: MAJOR.MINOR.PATCH (например, 1.0.0)",
			);
		} else {
			setVersionError("");
		}
	};

	const handleSubmit = async () => {
		if (!name.trim() || !version.trim()) {
			toast.error("Название и версия обязательны");
			return;
		}

		if (!validateSemver(version.trim())) {
			toast.error(
				"Неверный формат версии. Используйте формат: MAJOR.MINOR.PATCH (например, 1.0.0)",
			);
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
		setVersionError("");
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
						onChange={(e) => handleVersionChange(e.target.value)}
						fullWidth
						required
						placeholder="1.0.0"
						error={!!versionError}
						helperText={
							versionError || "Формат: MAJOR.MINOR.PATCH (например, 1.0.0)"
						}
						inputProps={{
							pattern: "[0-9]+\\.[0-9]+\\.[0-9]+",
							maxLength: 20,
						}}
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
						createSnapshotMutation.isPending ||
						!name.trim() ||
						!version.trim() ||
						!!versionError
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
