import { useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { AgCharts } from "ag-charts-community";
import { useEffect, useRef } from "react";

// Sample data for demonstration
const generateSampleData = () => {
	const months = [
		"Янв",
		"Фев",
		"Мар",
		"Апр",
		"Май",
		"Июн",
		"Июл",
		"Авг",
		"Сен",
		"Окт",
		"Ноя",
		"Дек",
	];
	return months.map((month) => ({
		month,
		entities: Math.floor(Math.random() * 100) + 50,
		objects: Math.floor(Math.random() * 80) + 30,
		commits: Math.floor(Math.random() * 50) + 10,
	}));
};

const generatePieData = () => [
	{ type: "Таблицы", count: 45 },
	{ type: "Представления", count: 25 },
	{ type: "RDD", count: 15 },
	{ type: "Неразрешённые", count: 15 },
];

export const AgChartsPanel = () => {
	const lineChartRef = useRef<HTMLDivElement>(null);
	const pieChartRef = useRef<HTMLDivElement>(null);

	const lineData = useMemo(() => generateSampleData(), []);
	const pieData = useMemo(() => generatePieData(), []);

	useEffect(() => {
		if (!lineChartRef.current) return;

		const chart = AgCharts.create({
			container: lineChartRef.current,
			title: {
				text: "Статистика по месяцам",
			},
			data: lineData,
			series: [
				{
					type: "line",
					xKey: "month",
					yKey: "entities",
					yName: "Сущности",
					stroke: "#1976d2",
					marker: {
						fill: "#1976d2",
						stroke: "#1976d2",
					},
				},
				{
					type: "line",
					xKey: "month",
					yKey: "objects",
					yName: "Объекты",
					stroke: "#4caf50",
					marker: {
						fill: "#4caf50",
						stroke: "#4caf50",
					},
				},
				{
					type: "line",
					xKey: "month",
					yKey: "commits",
					yName: "Коммиты",
					stroke: "#ff9800",
					marker: {
						fill: "#ff9800",
						stroke: "#ff9800",
					},
				},
			],
			axes: [
				{
					type: "category",
					position: "bottom",
				},
				{
					type: "number",
					position: "left",
				},
			],
			legend: {
				position: "bottom",
			},
		});

		return () => {
			chart.destroy();
		};
	}, [lineData]);

	useEffect(() => {
		if (!pieChartRef.current) return;

		const chart = AgCharts.create({
			container: pieChartRef.current,
			title: {
				text: "Распределение по типам",
			},
			data: pieData,
			series: [
				{
					type: "pie",
					angleKey: "count",
					legendItemKey: "type",
					fills: ["#1976d2", "#7b1fa2", "#f57c00", "#c2185b"],
					strokes: ["#1565c0", "#6a1b9a", "#e65100", "#ad1457"],
				},
			],
			legend: {
				position: "right",
			},
		});

		return () => {
			chart.destroy();
		};
	}, [pieData]);

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 2,
				p: 2,
				overflow: "auto",
			}}
		>
			<Typography variant="h6" sx={{ mb: 1 }}>
				📈 Аналитика
			</Typography>

			<Paper
				elevation={0}
				sx={{
					flex: 1,
					minHeight: 250,
					p: 1,
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 2,
				}}
			>
				<Box ref={lineChartRef} sx={{ width: "100%", height: "100%" }} />
			</Paper>

			<Paper
				elevation={0}
				sx={{
					flex: 1,
					minHeight: 250,
					p: 1,
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 2,
				}}
			>
				<Box ref={pieChartRef} sx={{ width: "100%", height: "100%" }} />
			</Paper>
		</Box>
	);
};
