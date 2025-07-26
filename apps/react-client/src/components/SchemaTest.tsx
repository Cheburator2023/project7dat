import { Button, Card, CardContent, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

export const SchemaTest = () => {
	const {
		currentGraph,
		loadGraphsFromBackend,
		loadFromFile,
		loadFromAPI,
		isLoading,
		error,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			loadGraphsFromBackend: state.loadGraphsFromBackend,
			loadFromFile: state.loadFromFile,
			loadFromAPI: state.loadFromAPI,
			isLoading: state.isLoading,
			error: state.error,
		})),
	);

	const handleLoadFromBackend = () => {
		loadGraphsFromBackend();
	};

	const handleLoadFromFile = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				loadFromFile(file);
			}
		};
		input.click();
	};

	const handleLoadFromAPI = () => {
		loadFromAPI("https://api.example.com/schema");
	};

	return (
		<Card sx={{ m: 2, p: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Тест схемы данных
				</Typography>

				<Typography variant="body2" color="text.secondary" gutterBottom>
					Текущий граф: {currentGraph ? "Загружен" : "Не загружен"}
				</Typography>

				{error && (
					<Typography variant="body2" color="error" gutterBottom>
						Ошибка: {error}
					</Typography>
				)}

				<div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
					<Button
						variant="contained"
						onClick={handleLoadFromBackend}
						disabled={isLoading}
					>
						{isLoading ? "Загрузка..." : "Загрузить с бэкенда"}
					</Button>
					<Button variant="outlined" onClick={handleLoadFromFile}>
						Загрузить из файла
					</Button>
					<Button variant="outlined" onClick={handleLoadFromAPI}>
						Загрузить из API
					</Button>
				</div>

				{currentGraph && (
					<div style={{ marginTop: "16px" }}>
						<Typography variant="subtitle2">Описание:</Typography>
						<Typography variant="body2">{currentGraph.desc.appName}</Typography>
						<Typography variant="body2">
							Сущностей: {currentGraph.entities.length}
						</Typography>
						<Typography variant="body2">
							Маппингов: {currentGraph.mappings.length}
						</Typography>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
