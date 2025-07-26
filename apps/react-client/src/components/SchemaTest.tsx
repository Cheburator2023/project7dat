import { Button, Card, CardContent, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { sampleDataLineageActual } from "@react-client/data/sampleDataLineageActual";
import { useShallow } from "zustand/react/shallow";

export const SchemaTest = () => {
	const {
		currentActualData,
		currentGraph,
		loadActualData,
		loadFromFile,
		loadFromAPI,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentActualData: state.currentActualData,
			currentGraph: state.currentGraph,
			loadActualData: state.loadActualData,
			loadFromFile: state.loadFromFile,
			loadFromAPI: state.loadFromAPI,
		})),
	);

	const handleLoadSampleData = () => {
		loadActualData(sampleDataLineageActual);
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
					Тест новой схемы данных
				</Typography>

				<Typography variant="body2" color="text.secondary" gutterBottom>
					Текущие данные (новый формат):{" "}
					{currentActualData ? "Загружены" : "Не загружены"}
				</Typography>

				<Typography variant="body2" color="text.secondary" gutterBottom>
					Текущий граф (legacy формат):{" "}
					{currentGraph ? "Загружен" : "Не загружен"}
				</Typography>

				<div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
					<Button variant="contained" onClick={handleLoadSampleData}>
						Загрузить пример данных
					</Button>
					<Button variant="outlined" onClick={handleLoadFromFile}>
						Загрузить из файла
					</Button>
					<Button variant="outlined" onClick={handleLoadFromAPI}>
						Загрузить из API
					</Button>
				</div>

				{currentActualData && (
					<div style={{ marginTop: "16px" }}>
						<Typography variant="subtitle2">Описание:</Typography>
						<Typography variant="body2">
							{currentActualData.desc.appName}
						</Typography>
						<Typography variant="body2">
							Сущностей: {currentActualData.entities.length}
						</Typography>
						<Typography variant="body2">
							Маппингов: {currentActualData.mappings.length}
						</Typography>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
