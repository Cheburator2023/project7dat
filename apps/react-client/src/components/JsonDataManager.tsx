import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	Typography,
} from "@mui/material";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { useState } from "react";
import { useJsonDataManager, useJsonDataSearch } from "../hooks";
import type { CreateJsonDataRequest } from "../api/jsonDataApi";

export const JsonDataManager = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedId, setSelectedId] = useState<string>();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [formData, setFormData] = useState<string>("");

	const {
		data: items,
		isLoading,
		error,
		totalCount,
		filteredCount,
	} = useJsonDataSearch(searchTerm);

	const {
		item: selectedItem,
		isLoadingItem,
		createItem,
		updateItem,
		deleteItem,
		isCreating,
		isUpdating,
		isDeleting,
		refreshList,
	} = useJsonDataManager(selectedId);

	const handleCreate = async () => {
		try {
			const data = JSON.parse(formData) as CreateJsonDataRequest["data"];
			await createItem({ data });
			setIsCreateDialogOpen(false);
			setFormData("");
		} catch (error) {
			console.error("Ошибка создания:", error);
		}
	};

	const handleUpdate = async () => {
		if (!selectedId) return;
		try {
			const data = JSON.parse(formData);
			await updateItem(selectedId, { data });
			setIsEditDialogOpen(false);
			setFormData("");
			setSelectedId(undefined);
		} catch (error) {
			console.error("Ошибка обновления:", error);
		}
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Вы уверены, что хотите удалить этот элемент?")) {
			try {
				await deleteItem(id);
			} catch (error) {
				console.error("Ошибка удаления:", error);
			}
		}
	};

	const openEditDialog = (id: string, data: Record<string, any>) => {
		setSelectedId(id);
		setFormData(JSON.stringify(data, null, 2));
		setIsEditDialogOpen(true);
	};

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" p={4}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={4}>
				<Typography color="error">
					Ошибка загрузки данных: {error.message}
				</Typography>
			</Box>
		);
	}

	return (
		<Box p={4}>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Typography variant="h4">Управление JSON данными</Typography>
				<Box display="flex" gap={2}>
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => setIsCreateDialogOpen(true)}
					>
						Создать
					</Button>
					<IconButton onClick={refreshList}>
						<Refresh />
					</IconButton>
				</Box>
			</Box>

			<Box mb={3}>
				<TextField
					fullWidth
					label="Поиск"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Поиск по ID или содержимому..."
				/>
				<Typography variant="body2" color="text.secondary" mt={1}>
					Показано {filteredCount} из {totalCount} элементов
				</Typography>
			</Box>

			<Box
				display="grid"
				gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
				gap={2}
			>
				{items.map((item) => (
					<Card key={item.id}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								ID: {item.id}
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Создан: {new Date(item.createdAt).toLocaleString()}
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Обновлен: {new Date(item.updatedAt).toLocaleString()}
							</Typography>
							<Box
								component="pre"
								sx={{
									fontSize: "0.75rem",
									backgroundColor: "grey.100",
									p: 1,
									borderRadius: 1,
									overflow: "auto",
									maxHeight: 200,
								}}
							>
								{JSON.stringify(item.data, null, 2)}
							</Box>
						</CardContent>
						<CardActions>
							<Button
								size="small"
								startIcon={<Edit />}
								onClick={() => openEditDialog(item.id, item.data)}
							>
								Редактировать
							</Button>
							<Button
								size="small"
								color="error"
								startIcon={<Delete />}
								onClick={() => handleDelete(item.id)}
								disabled={isDeleting}
							>
								Удалить
							</Button>
						</CardActions>
					</Card>
				))}
			</Box>

			<Dialog
				open={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Создать новый элемент</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						multiline
						rows={10}
						label="JSON данные"
						value={formData}
						onChange={(e) => setFormData(e.target.value)}
						placeholder='{"example": "data"}'
						sx={{ mt: 2 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsCreateDialogOpen(false)}>Отмена</Button>
					<Button
						onClick={handleCreate}
						variant="contained"
						disabled={isCreating || !formData.trim()}
					>
						{isCreating ? <CircularProgress size={20} /> : "Создать"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={isEditDialogOpen}
				onClose={() => setIsEditDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Редактировать элемент</DialogTitle>
				<DialogContent>
					{isLoadingItem ? (
						<CircularProgress />
					) : (
						<TextField
							fullWidth
							multiline
							rows={10}
							label="JSON данные"
							value={formData}
							onChange={(e) => setFormData(e.target.value)}
							sx={{ mt: 2 }}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
					<Button
						onClick={handleUpdate}
						variant="contained"
						disabled={isUpdating || !formData.trim()}
					>
						{isUpdating ? <CircularProgress size={20} /> : "Сохранить"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
