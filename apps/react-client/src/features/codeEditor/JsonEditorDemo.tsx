import React, { useRef } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CodeJsonEditor } from "./CodeJsonEditor";

const DemoContainer = styled(Box)(({ theme }) => ({
	padding: theme.spacing(3),
	maxWidth: "1200px",
	margin: "0 auto",
}));

const ControlPanel = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	marginBottom: theme.spacing(2),
	display: "flex",
	gap: theme.spacing(1),
	flexWrap: "wrap",
}));

const EditorContainer = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
}));

interface CodeJsonEditorRef {
	focusPath: (path: string) => void;
	highlightPath: (path: string) => void;
	unhighlightPath: (path: string) => void;
	clearAllHighlights: () => void;
	getData: () => any;
	setData: (data: any) => void;
}

export const JsonEditorDemo: React.FC = () => {
	const editorRef = useRef<CodeJsonEditorRef>(null);

	const sampleData = {
		пользователь: {
			имя: "Иван",
			фамилия: "Петров",
			возраст: 30,
			активен: true,
			адрес: {
				город: "Санкт-Петербург",
				улица: "Невский проспект",
				дом: 123,
			},
			хобби: ["футбол", "чтение", "программирование"],
			настройки: {
				тема: "темная",
				язык: "русский",
				уведомления: true,
			},
		},
		статистика: {
			посещения: 1250,
			лайки: 89,
			комментарии: 45,
		},
	};

	const handleFocusName = () => {
		editorRef.current?.focusPath(".пользователь.имя");
	};

	const handleHighlightAddress = () => {
		editorRef.current?.highlightPath(".пользователь.адрес");
	};

	const handleHighlightHobbies = () => {
		editorRef.current?.highlightPath(".пользователь.хобби");
	};

	const handleClearHighlights = () => {
		editorRef.current?.clearAllHighlights();
	};

	const handleGetData = () => {
		const data = editorRef.current?.getData();
		console.log("Текущие данные:", data);
		alert("Данные выведены в консоль");
	};

	const handleResetData = () => {
		editorRef.current?.setData(sampleData);
	};

	const handleDataChange = (newData: any) => {
		console.log("Данные изменены:", newData);
	};

	return (
		<DemoContainer>
			<Typography variant="h4" gutterBottom>
				Демо JSON Редактора
			</Typography>

			<Typography variant="body1" paragraph>
				Этот редактор позволяет редактировать только примитивные значения
				(строки, числа, булевы значения). Используйте кнопки ниже для
				программного управления фокусом и подсветкой.
			</Typography>

			<ControlPanel elevation={2}>
				<Button variant="contained" onClick={handleFocusName}>
					Фокус на имени
				</Button>
				<Button variant="outlined" onClick={handleHighlightAddress}>
					Подсветить адрес
				</Button>
				<Button variant="outlined" onClick={handleHighlightHobbies}>
					Подсветить хобби
				</Button>
				<Button
					variant="outlined"
					color="warning"
					onClick={handleClearHighlights}
				>
					Очистить подсветку
				</Button>
				<Button variant="outlined" color="info" onClick={handleGetData}>
					Получить данные
				</Button>
				<Button variant="outlined" color="secondary" onClick={handleResetData}>
					Сбросить данные
				</Button>
			</ControlPanel>

			<EditorContainer elevation={1}>
				<CodeJsonEditor
					ref={editorRef}
					initialData={sampleData}
					onChange={handleDataChange}
				/>
			</EditorContainer>

			<Box mt={2}>
				<Typography variant="h6" gutterBottom>
					Инструкции:
				</Typography>
				<Typography variant="body2" component="ul">
					<li>Кликните на любое примитивное значение для редактирования</li>
					<li>Используйте Enter для сохранения, Escape для отмены</li>
					<li>
						Кликните на иконки разворачивания для сворачивания/разворачивания
						объектов
					</li>
					<li>Значения автоматически определяют тип (строка, число, булево)</li>
					<li>Используйте кнопки выше для программного управления</li>
				</Typography>
			</Box>
		</DemoContainer>
	);
};
