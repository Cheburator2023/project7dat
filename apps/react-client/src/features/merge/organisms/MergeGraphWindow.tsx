import React, { useMemo } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
	ReactFlow,
	Node,
	Edge,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	ConnectionMode,
	BackgroundVariant,
} from "@xyflow/react";

import { useMergeStore } from "../../../stores/mergeStore";

export const MergeGraphWindow: React.FC = () => {
	const { isMergeGraphWindowOpen, closeMergeGraphWindow, mergeData } =
		useMergeStore();

	// Создаем моки данных для демонстрации react-flow
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [
			{
				id: "1",
				type: "input",
				data: {
					label: "Исходная БД\n(PostgreSQL)",
				},
				position: { x: 50, y: 50 },
				style: {
					background: "#e3f2fd",
					border: "2px solid #1976d2",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
			{
				id: "2",
				data: {
					label: "ETL Процесс\n(Трансформация данных)",
				},
				position: { x: 300, y: 50 },
				style: {
					background: "#fff3e0",
					border: "2px solid #f57c00",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
			{
				id: "3",
				data: {
					label: "Хранилище данных\n(Snowflake)",
				},
				position: { x: 550, y: 50 },
				style: {
					background: "#f3e5f5",
					border: "2px solid #7b1fa2",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
			{
				id: "4",
				data: {
					label: "Слой аналитики\n(dbt модели)",
				},
				position: { x: 200, y: 200 },
				style: {
					background: "#e8f5e8",
					border: "2px solid #388e3c",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
			{
				id: "5",
				data: {
					label: "Бизнес-аналитика\n(Tableau)",
				},
				position: { x: 450, y: 200 },
				style: {
					background: "#fce4ec",
					border: "2px solid #c2185b",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
			{
				id: "6",
				type: "output",
				data: {
					label: "Дашборд\n(Отчеты руководства)",
				},
				position: { x: 325, y: 350 },
				style: {
					background: "#fff8e1",
					border: "2px solid #ffa000",
					borderRadius: "8px",
					padding: "10px",
					fontSize: "12px",
					fontWeight: "bold",
				},
			},
		];

		const edges: Edge[] = [
			{
				id: "e1-2",
				source: "1",
				target: "2",
				type: "smoothstep",
				style: { stroke: "#1976d2", strokeWidth: 2 },
				label: "Сырые данные",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
			{
				id: "e2-3",
				source: "2",
				target: "3",
				type: "smoothstep",
				style: { stroke: "#f57c00", strokeWidth: 2 },
				label: "Очищенные данные",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
			{
				id: "e3-4",
				source: "3",
				target: "4",
				type: "smoothstep",
				style: { stroke: "#7b1fa2", strokeWidth: 2 },
				label: "Данные хранилища",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
			{
				id: "e3-5",
				source: "3",
				target: "5",
				type: "smoothstep",
				style: { stroke: "#7b1fa2", strokeWidth: 2 },
				label: "Прямой доступ",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
			{
				id: "e4-6",
				source: "4",
				target: "6",
				type: "smoothstep",
				style: { stroke: "#388e3c", strokeWidth: 2 },
				label: "Аналитика",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
			{
				id: "e5-6",
				source: "5",
				target: "6",
				type: "smoothstep",
				style: { stroke: "#c2185b", strokeWidth: 2 },
				label: "Визуализации",
				labelStyle: { fontSize: "10px", fontWeight: "bold" },
			},
		];

		return { initialNodes: nodes, initialEdges: edges };
	}, []);

	const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const handleClose = () => {
		closeMergeGraphWindow();
	};

	if (!mergeData) {
		return null;
	}

	return (
		<Dialog
			open={isMergeGraphWindowOpen}
			onClose={handleClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					height: "80vh",
					maxHeight: "80vh",
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pb: 1,
				}}
			>
				<Typography variant="h6">Merge Граф объектов</Typography>
				<IconButton
					onClick={handleClose}
					size="small"
					sx={{ color: "grey.500" }}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ p: 2 }}>
				<Box
					sx={{
						height: "100%",
						border: "1px solid",
						borderColor: "divider",
						borderRadius: 1,
						backgroundColor: "background.paper",
					}}
				>
					{/* React Flow граф */}
					<Box
						sx={{
							height: "calc(100% - 40px)",
							borderRadius: 1,
							overflow: "hidden",
						}}
					>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							connectionMode={ConnectionMode.Loose}
							fitView
							fitViewOptions={{
								padding: 0.2,
							}}
							style={{
								backgroundColor: "#f8f9fa",
							}}
						>
							<Controls />
							<Background
								variant={BackgroundVariant.Dots}
								gap={20}
								size={1}
								color="#e0e0e0"
							/>
						</ReactFlow>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={handleClose} variant="outlined">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
