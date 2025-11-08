import { useState, useMemo, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	Button,
	Box,
	Chip,
	Typography,
	IconButton,
	Paper,
} from "@mui/material";
import {
	ReactFlow,
	Node,
	Edge,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	ConnectionMode,
	NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Close, Visibility } from "@mui/icons-material";

import { ObjectDetailsDialog } from "../molecules/ObjectDetailsDialog";
import { ConnectionDetailsDialog } from "../molecules/ConnectionDetailsDialog";

export interface ModelObject {
	id: string;
	name: string;
	type: "model" | "vector" | "datamart" | "source";
	description: string;
	attributes: ObjectAttribute[];
	connections: ObjectConnection[];
}

export interface ObjectAttribute {
	id: string;
	name: string;
	type: string;
	description: string;
	isKey?: boolean;
}

export interface ObjectConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	description: string;
	mappings: AttributeMapping[];
	functions?: AttributeFunction[];
}

export interface AttributeMapping {
	id: string;
	sourceAttribute: string;
	sourceDescription: string;
	targetAttribute: string;
	targetDescription: string;
}

export interface AttributeFunction {
	id: string;
	attribute: string;
	function: string;
	description: string;
}

interface ModelGraphWindowProps {
	isOpen: boolean;
	onClose: () => void;
	model: any;
}

// Мок-данные для демонстрации
const createMockModelData = (
	_modelId: string,
): { objects: ModelObject[]; connections: ObjectConnection[] } => {
	const objects: ModelObject[] = [
		{
			id: "obj1",
			name: "Таблица продаж",
			type: "source",
			description: "Основная таблица с данными о продажах",
			attributes: [
				{
					id: "attr1",
					name: "sale_id",
					type: "INTEGER",
					description: "Уникальный идентификатор продажи",
					isKey: true,
				},
				{
					id: "attr2",
					name: "product_id",
					type: "INTEGER",
					description: "Идентификатор продукта",
				},
				{
					id: "attr3",
					name: "customer_id",
					type: "INTEGER",
					description: "Идентификатор клиента",
				},
				{
					id: "attr4",
					name: "sale_date",
					type: "DATE",
					description: "Дата продажи",
				},
				{
					id: "attr5",
					name: "amount",
					type: "DECIMAL",
					description: "Сумма продажи",
				},
			],
			connections: [],
		},
		{
			id: "obj2",
			name: "Витрина продаж",
			type: "datamart",
			description: "Агрегированные данные продаж для аналитики",
			attributes: [
				{
					id: "attr6",
					name: "period",
					type: "DATE",
					description: "Период агрегации",
					isKey: true,
				},
				{
					id: "attr7",
					name: "total_sales",
					type: "DECIMAL",
					description: "Общая сумма продаж",
				},
				{
					id: "attr8",
					name: "sales_count",
					type: "INTEGER",
					description: "Количество продаж",
				},
				{
					id: "attr9",
					name: "avg_sale_amount",
					type: "DECIMAL",
					description: "Средняя сумма продажи",
				},
			],
			connections: [],
		},
		{
			id: "obj3",
			name: "Модель клиентов",
			type: "model",
			description: "Аналитическая модель поведения клиентов",
			attributes: [
				{
					id: "attr10",
					name: "customer_segment",
					type: "VARCHAR",
					description: "Сегмент клиента",
					isKey: true,
				},
				{
					id: "attr11",
					name: "lifetime_value",
					type: "DECIMAL",
					description: "Пожизненная ценность клиента",
				},
				{
					id: "attr12",
					name: "churn_probability",
					type: "DECIMAL",
					description: "Вероятность оттока",
				},
			],
			connections: [],
		},
		{
			id: "obj4",
			name: "Векторное представление",
			type: "vector",
			description: "Векторизованные данные для ML",
			attributes: [
				{
					id: "attr13",
					name: "vector_id",
					type: "INTEGER",
					description: "Идентификатор вектора",
					isKey: true,
				},
				{
					id: "attr14",
					name: "embedding",
					type: "ARRAY",
					description: "Векторное представление",
				},
				{
					id: "attr15",
					name: "metadata",
					type: "JSON",
					description: "Метаданные вектора",
				},
			],
			connections: [],
		},
	];

	const connections: ObjectConnection[] = [
		{
			id: "conn1",
			sourceId: "obj1",
			targetId: "obj2",
			sourceName: "Таблица продаж",
			targetName: "Витрина продаж",
			description: "Агрегация данных продаж",
			mappings: [
				{
					id: "map1",
					sourceAttribute: "sale_date",
					sourceDescription: "Дата продажи",
					targetAttribute: "period",
					targetDescription: "Период агрегации",
				},
				{
					id: "map2",
					sourceAttribute: "amount",
					sourceDescription: "Сумма продажи",
					targetAttribute: "total_sales",
					targetDescription: "Общая сумма продаж",
				},
			],
			functions: [
				{
					id: "func1",
					attribute: "total_sales",
					function: "SUM(amount)",
					description: "Суммирование продаж за период",
				},
				{
					id: "func2",
					attribute: "sales_count",
					function: "COUNT(*)",
					description: "Подсчет количества продаж",
				},
			],
		},
		{
			id: "conn2",
			sourceId: "obj1",
			targetId: "obj3",
			sourceName: "Таблица продаж",
			targetName: "Модель клиентов",
			description: "Анализ поведения клиентов",
			mappings: [
				{
					id: "map3",
					sourceAttribute: "customer_id",
					sourceDescription: "Идентификатор клиента",
					targetAttribute: "customer_segment",
					targetDescription: "Сегмент клиента",
				},
			],
			functions: [
				{
					id: "func3",
					attribute: "lifetime_value",
					function: "ML_MODEL_PREDICT(customer_features)",
					description: "Предсказание LTV с помощью ML модели",
				},
			],
		},
		{
			id: "conn3",
			sourceId: "obj2",
			targetId: "obj4",
			sourceName: "Витрина продаж",
			targetName: "Векторное представление",
			description: "Векторизация агрегированных данных",
			mappings: [
				{
					id: "map4",
					sourceAttribute: "total_sales",
					sourceDescription: "Общая сумма продаж",
					targetAttribute: "embedding",
					targetDescription: "Векторное представление",
				},
			],
			functions: [
				{
					id: "func4",
					attribute: "embedding",
					function: "VECTORIZE(sales_features)",
					description: "Создание векторного представления",
				},
			],
		},
	];

	return { objects, connections };
};

const getNodeColor = (type: ModelObject["type"]) => {
	switch (type) {
		case "model":
			return "#e3f2fd";
		case "vector":
			return "#f3e5f5";
		case "datamart":
			return "#e8f5e8";
		case "source":
			return "#fff3e0";
		default:
			return "#f5f5f5";
	}
};

const getNodeBorderColor = (type: ModelObject["type"]) => {
	switch (type) {
		case "model":
			return "#1976d2";
		case "vector":
			return "#7b1fa2";
		case "datamart":
			return "#388e3c";
		case "source":
			return "#f57c00";
		default:
			return "#757575";
	}
};

const getTypeLabel = (type: ModelObject["type"]) => {
	switch (type) {
		case "model":
			return "Модель";
		case "vector":
			return "Вектор";
		case "datamart":
			return "Витрина";
		case "source":
			return "Источник";
		default:
			return type;
	}
};

// Кастомный компонент узла
interface CustomNodeData {
	id: string;
	name: string;
	type: ModelObject["type"];
	description: string;
	onView: () => void;
	onDoubleClick: () => void;
}

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	return (
		<Paper
			sx={{
				backgroundColor: getNodeColor(data.type),
				border: `2px solid ${getNodeBorderColor(data.type)}`,
				borderRadius: 1,
				p: 2,
				minWidth: "200px",
				cursor: "pointer",
				"&:hover": { boxShadow: 2 },
			}}
			onDoubleClick={data.onDoubleClick}
		>
			<Box display="flex" flexDirection="column" gap={1}>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Chip
						label={getTypeLabel(data.type)}
						size="small"
						color={
							data.type === "model"
								? "primary"
								: data.type === "vector"
									? "secondary"
									: data.type === "datamart"
										? "success"
										: "warning"
						}
					/>
					<IconButton size="small" onClick={data.onView}>
						<Visibility fontSize="small" />
					</IconButton>
				</Box>
				<Typography variant="subtitle2" fontWeight="bold">
					{data.name}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{data.description}
				</Typography>
			</Box>
		</Paper>
	);
};

const nodeTypes: NodeTypes = {
	custom: CustomNode,
};

export const ModelGraphWindow = ({
	isOpen,
	onClose,
	model,
}: ModelGraphWindowProps) => {
	const [selectedObject, setSelectedObject] = useState<ModelObject | null>(
		null,
	);
	const [selectedConnection, setSelectedConnection] =
		useState<ObjectConnection | null>(null);
	const [isObjectDetailsOpen, setIsObjectDetailsOpen] = useState(false);
	const [isConnectionDetailsOpen, setIsConnectionDetailsOpen] = useState(false);

	const { objects, connections } = useMemo(
		() => createMockModelData(model.id),
		[model.id],
	);

	const initialNodes: Node[] = useMemo(() => {
		return objects.map((obj, index) => ({
			id: obj.id,
			type: "custom",
			position: {
				x: (index % 3) * 250,
				y: Math.floor(index / 3) * 150,
			},
			data: {
				...obj,
				onDoubleClick: () => {
					setSelectedObject(obj);
					setIsObjectDetailsOpen(true);
				},
				onView: () => {
					setSelectedObject(obj);
					setIsObjectDetailsOpen(true);
				},
			},
		}));
	}, [objects]);

	const initialEdges: Edge[] = useMemo(() => {
		return connections.map((conn) => ({
			id: conn.id,
			source: conn.sourceId,
			target: conn.targetId,
			type: "smoothstep",
			style: { stroke: "#666", strokeWidth: 2 },
			label: conn.description,
			labelStyle: { fontSize: "10px", fontWeight: "bold" },
		}));
	}, [connections]);

	const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onEdgeDoubleClick = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			const connection = connections.find((conn) => conn.id === edge.id);
			if (connection) {
				setSelectedConnection(connection);
				setIsConnectionDetailsOpen(true);
			}
		},
		[connections],
	);

	const handleCloseObjectDetails = () => {
		setIsObjectDetailsOpen(false);
		setSelectedObject(null);
	};

	const handleCloseConnectionDetails = () => {
		setIsConnectionDetailsOpen(false);
		setSelectedConnection(null);
	};

	return (
		<>
			<Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth>
				<DialogTitle>Граф объектов {model.name}</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							height: "600px",
							width: "100%",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 1,
						}}
					>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onEdgeDoubleClick={onEdgeDoubleClick}
							nodeTypes={nodeTypes}
							connectionMode={ConnectionMode.Loose}
							fitView
						>
							<Controls />
							<Background />
						</ReactFlow>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" onClick={onClose} startIcon={<Close />}>
						Закрыть
					</Button>
				</DialogActions>
			</Dialog>

			{/* Диалог деталей объекта */}
			{selectedObject && (
				<ObjectDetailsDialog
					open={isObjectDetailsOpen}
					onClose={handleCloseObjectDetails}
					object={selectedObject}
					connections={connections.filter(
						(conn) =>
							conn.sourceId === selectedObject.id ||
							conn.targetId === selectedObject.id,
					)}
				/>
			)}

			{/* Диалог деталей связи */}
			{selectedConnection && (
				<ConnectionDetailsDialog
					open={isConnectionDetailsOpen}
					onClose={handleCloseConnectionDetails}
					connection={selectedConnection}
				/>
			)}
		</>
	);
};
