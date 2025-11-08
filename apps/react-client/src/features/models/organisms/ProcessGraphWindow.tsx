import { useState, useCallback, useMemo } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	IconButton,
	Typography,
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
	NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ObjectDetailsDialog } from "../molecules/ObjectDetailsDialog";
import { ConnectionDetailsDialog } from "../molecules/ConnectionDetailsDialog";

interface Process {
	id: string;
	name: string;
	type: string;
	description: string;
	createdDate: string;
	status: "active" | "inactive" | "pending";
}

interface ProcessGraphWindowProps {
	process: Process;
	open: boolean;
	onClose: () => void;
}

interface GraphObject {
	id: string;
	name: string;
	type: "source" | "datamart" | "model" | "vector";
	description: string;
	attributes: ObjectAttribute[];
	connections: ObjectConnection[];
}

interface ObjectAttribute {
	id: string;
	name: string;
	type: string;
	description: string;
	isKey?: boolean;
}

interface ObjectConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	description: string;
	mappings: AttributeMapping[];
	functions?: AttributeFunction[];
}

interface AttributeMapping {
	id: string;
	sourceAttribute: string;
	sourceDescription: string;
	targetAttribute: string;
	targetDescription: string;
}

interface AttributeFunction {
	id: string;
	attribute: string;
	function: string;
	description: string;
}

interface GraphConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	description: string;
	mappings: AttributeMapping[];
	functions?: AttributeFunction[];
}

// Кастомный компонент узла
interface CustomNodeData {
	id: string;
	label: string;
	type: "source" | "datamart" | "model" | "vector";
}

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	const getNodeColor = (type: string) => {
		switch (type) {
			case "source":
				return "#e3f2fd";
			case "datamart":
				return "#f3e5f5";
			case "model":
				return "#e8f5e8";
			case "vector":
				return "#fff3e0";
			default:
				return "#f5f5f5";
		}
	};

	const getBorderColor = (type: string) => {
		switch (type) {
			case "source":
				return "#1976d2";
			case "datamart":
				return "#7b1fa2";
			case "model":
				return "#388e3c";
			case "vector":
				return "#f57c00";
			default:
				return "#757575";
		}
	};

	return (
		<div
			style={{
				padding: "10px",
				borderRadius: "8px",
				border: `2px solid ${getBorderColor(data.type)}`,
				backgroundColor: getNodeColor(data.type),
				minWidth: "150px",
				textAlign: "center",
			}}
		>
			<div style={{ fontWeight: "bold", marginBottom: "4px" }}>
				{data.label}
			</div>
			<div style={{ fontSize: "12px", color: "#666" }}>
				{data.type === "source" && "Источник"}
				{data.type === "datamart" && "Витрина"}
				{data.type === "model" && "Модель"}
				{data.type === "vector" && "Вектор"}
			</div>
		</div>
	);
};

const nodeTypes: NodeTypes = {
	custom: CustomNode,
};

export function ProcessGraphWindow({
	process,
	open,
	onClose,
}: ProcessGraphWindowProps) {
	const [selectedObject, setSelectedObject] = useState<GraphObject | null>(
		null,
	);
	const [selectedConnection, setSelectedConnection] =
		useState<GraphConnection | null>(null);
	const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
	const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);

	// Мок данные для графа процесса
	const mockObjects: GraphObject[] = [
		{
			id: "source1",
			name: "База данных продаж",
			type: "source",
			description: "Основная база данных с информацией о продажах",
			attributes: [
				{
					id: "attr1",
					name: "order_id",
					type: "string",
					description: "Идентификатор заказа",
					isKey: true,
				},
				{
					id: "attr2",
					name: "customer_id",
					type: "string",
					description: "Идентификатор клиента",
				},
				{
					id: "attr3",
					name: "amount",
					type: "decimal",
					description: "Сумма заказа",
				},
			],
			connections: [],
		},
		{
			id: "source2",
			name: "CRM система",
			type: "source",
			description: "Система управления взаимоотношениями с клиентами",
			attributes: [
				{
					id: "attr4",
					name: "customer_id",
					type: "string",
					description: "Идентификатор клиента",
					isKey: true,
				},
				{
					id: "attr5",
					name: "customer_name",
					type: "string",
					description: "Имя клиента",
				},
				{
					id: "attr6",
					name: "email",
					type: "string",
					description: "Email клиента",
				},
			],
			connections: [],
		},
		{
			id: "process1",
			name: process.name,
			type: "model",
			description: process.description,
			attributes: [],
			connections: [],
		},
		{
			id: "datamart1",
			name: "Витрина аналитики",
			type: "datamart",
			description: "Витрина данных для аналитических отчетов",
			attributes: [
				{
					id: "attr7",
					name: "report_id",
					type: "string",
					description: "Идентификатор отчета",
					isKey: true,
				},
				{
					id: "attr8",
					name: "metric_value",
					type: "decimal",
					description: "Значение метрики",
				},
			],
			connections: [],
		},
		{
			id: "target1",
			name: "Дашборд руководства",
			type: "vector",
			description: "Дашборд для руководства компании",
			attributes: [],
			connections: [],
		},
	];

	const mockConnections: GraphConnection[] = [
		{
			id: "conn1",
			sourceId: "source1",
			targetId: "process1",
			sourceName: "База данных продаж",
			targetName: process.name,
			description: "Передача данных о продажах для обработки",
			mappings: [
				{
					id: "map1",
					sourceAttribute: "order_id",
					sourceDescription: "Идентификатор заказа",
					targetAttribute: "order_id",
					targetDescription: "Идентификатор заказа",
				},
				{
					id: "map2",
					sourceAttribute: "customer_id",
					sourceDescription: "Идентификатор клиента",
					targetAttribute: "customer_id",
					targetDescription: "Идентификатор клиента",
				},
			],
		},
		{
			id: "conn2",
			sourceId: "source2",
			targetId: "process1",
			sourceName: "CRM система",
			targetName: process.name,
			description: "Передача информации о клиентах",
			mappings: [
				{
					id: "map3",
					sourceAttribute: "customer_id",
					sourceDescription: "Идентификатор клиента",
					targetAttribute: "customer_id",
					targetDescription: "Идентификатор клиента",
				},
			],
		},
		{
			id: "conn3",
			sourceId: "process1",
			targetId: "datamart1",
			sourceName: process.name,
			targetName: "Витрина аналитики",
			description: "Результат обработки данных процессом",
			mappings: [
				{
					id: "map4",
					sourceAttribute: "customer_id",
					sourceDescription: "Идентификатор клиента",
					targetAttribute: "customer_id",
					targetDescription: "Идентификатор клиента",
				},
			],
		},
		{
			id: "conn4",
			sourceId: "datamart1",
			targetId: "target1",
			sourceName: "Витрина аналитики",
			targetName: "Дашборд руководства",
			description: "Данные для построения отчетов и дашбордов",
			mappings: [],
		},
	];

	const initialNodes: Node[] = useMemo(
		() => [
			{
				id: "source1",
				type: "custom",
				position: { x: 50, y: 100 },
				data: { label: "База данных продаж", type: "source" },
			},
			{
				id: "source2",
				type: "custom",
				position: { x: 50, y: 250 },
				data: { label: "CRM система", type: "source" },
			},
			{
				id: "process1",
				type: "custom",
				position: { x: 300, y: 175 },
				data: { label: process.name, type: "model" },
			},
			{
				id: "datamart1",
				type: "custom",
				position: { x: 550, y: 175 },
				data: { label: "Витрина аналитики", type: "datamart" },
			},
			{
				id: "target1",
				type: "custom",
				position: { x: 800, y: 175 },
				data: { label: "Дашборд руководства", type: "vector" },
			},
		],
		[process.name],
	);

	const initialEdges: Edge[] = useMemo(
		() => [
			{
				id: "conn1",
				source: "source1",
				target: "process1",
				label: "Данные продаж",
				type: "smoothstep",
			},
			{
				id: "conn2",
				source: "source2",
				target: "process1",
				label: "Данные клиентов",
				type: "smoothstep",
			},
			{
				id: "conn3",
				source: "process1",
				target: "datamart1",
				label: "Обработанные данные",
				type: "smoothstep",
			},
			{
				id: "conn4",
				source: "datamart1",
				target: "target1",
				label: "Аналитические данные",
				type: "smoothstep",
			},
		],
		[],
	);

	const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			const object = mockObjects.find((obj) => obj.id === node.id);
			if (object) {
				setSelectedObject(object);
				setIsObjectDialogOpen(true);
			}
		},
		[mockObjects],
	);

	const onEdgeClick = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			const connection = mockConnections.find((conn) => conn.id === edge.id);
			if (connection) {
				setSelectedConnection(connection);
				setIsConnectionDialogOpen(true);
			}
		},
		[mockConnections],
	);

	const handleCloseObjectDialog = () => {
		setIsObjectDialogOpen(false);
		setSelectedObject(null);
	};

	const handleCloseConnectionDialog = () => {
		setIsConnectionDialogOpen(false);
		setSelectedConnection(null);
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="xl"
				fullWidth
				PaperProps={{
					sx: { height: "90vh" },
				}}
			>
				<DialogTitle>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography variant="h6">Граф объектов {process.name}</Typography>
						<IconButton onClick={onClose} size="small">
							<CloseIcon />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ p: 0, height: "100%" }}>
					<Box sx={{ height: "100%", width: "100%" }}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onNodeClick={onNodeClick}
							onEdgeClick={onEdgeClick}
							nodeTypes={nodeTypes}
							connectionMode={ConnectionMode.Loose}
							fitView
							attributionPosition="bottom-left"
						>
							<Controls />
							<Background />
						</ReactFlow>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Закрыть</Button>
				</DialogActions>
			</Dialog>

			{selectedObject && (
				<ObjectDetailsDialog
					object={selectedObject}
					connections={mockConnections}
					open={isObjectDialogOpen}
					onClose={handleCloseObjectDialog}
				/>
			)}

			{selectedConnection && (
				<ConnectionDetailsDialog
					connection={selectedConnection}
					open={isConnectionDialogOpen}
					onClose={handleCloseConnectionDialog}
				/>
			)}
		</>
	);
}
