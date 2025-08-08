import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { ReadOnlyJsonViewer } from "@react-client/common/jsonViewers/ReadOnlyJsonViewer";

const sampleData = {
	id: "12345",
	name: "Тестовые данные",
	description: "Пример JSON данных для тестирования компонента",
	metadata: {
		version: "1.0.0",
		author: "Система",
		tags: ["тест", "json", "компонент"],
		settings: {
			enabled: true,
			maxItems: 100,
			timeout: 5000,
		},
	},
	items: [
		{
			id: 1,
			title: "Первый элемент",
			active: true,
		},
		{
			id: 2,
			title: "Второй элемент",
			active: false,
		},
	],
	nullValue: null,
	emptyArray: [],
	emptyObject: {},
};

export const TestJsonViewerPage: React.FC = () => {
	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom>
				Тест ReadOnlyJsonViewer
			</Typography>

			<Paper sx={{ p: 2, mb: 3 }}>
				<Typography variant="h6" gutterBottom>
					Универсальный компонент для просмотра JSON
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Компонент поддерживает поиск, сворачивание/разворачивание узлов и
					темную/светлую тему
				</Typography>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<ReadOnlyJsonViewer data={sampleData} height={500} showSearch={true} />
			</Paper>
		</Box>
	);
};
