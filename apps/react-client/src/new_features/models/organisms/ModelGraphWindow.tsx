import { useState, useMemo, useCallback, useEffect } from "react";
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
	CircularProgress,
	Alert,
	Divider,
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
import { Close, Visibility } from "@mui/icons-material";

import { ObjectDetailsDialog } from "../molecules/ObjectDetailsDialog";
import { ConnectionDetailsDialog } from "../molecules/ConnectionDetailsDialog";
import { featureFlags } from "@react-client/config/featureFlags";
import { jsonDataV2Service } from "@react-client/api/jsonDataV2Api";
import type { JsonDataItem } from "@react-client/api/jsonDataV2Api";
import type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageMapping,
} from "@data-lineage/shared-schemas";

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

const buildModelGraphFromSchema = (
	schema: DataLineageSchema,
	modelEntityId: string,
): { objects: ModelObject[]; connections: ObjectConnection[] } => {
	const entitiesById = new Map<string, DataLineageEntity>();
	schema.entities.forEach((entity) => {
		entitiesById.set(entity.id, entity);
	});

	const modelEntity = entitiesById.get(modelEntityId) ?? null;
	const objects: ModelObject[] = [];
	const connections: ObjectConnection[] = [];

	const toModelObjectType = (
		entity: DataLineageEntity,
	): ModelObject["type"] => {
		if (entity.id === modelEntityId) return "model";
		if (entity.type === "view") return "datamart";
		return "source";
	};

	const makeAttributes = (entity: DataLineageEntity): ObjectAttribute[] => {
		return (entity.attrSeq ?? []).map((attr, index) => ({
			id: `${entity.id}__${attr.name ?? index}`,
			name: attr.name,
			type: attr.type,
			description: attr.comment ?? "",
			isKey: false,
		}));
	};

	schema.entities.forEach((entity) => {
		objects.push({
			id: entity.id,
			name: entity.name ?? entity.id,
			type: toModelObjectType(entity),
			description: "",
			attributes: makeAttributes(entity),
			connections: [],
		});
	});

	const mappings: DataLineageMapping[] = schema.mappings ?? [];

	mappings.forEach((mapping) => {
		if (!mapping.deps || mapping.deps.length === 0) return;
		const targetEntity = entitiesById.get(mapping.entityId);
		if (!targetEntity) return;

		if (mapping.entityId === modelEntityId && modelEntity) {
			mapping.deps.forEach((dep, depIndex) => {
				const sourceEntity = entitiesById.get(dep.entityId);
				if (!sourceEntity) return;
				const attrMaps = dep.attrMaps ?? [];
				const mappingsList: AttributeMapping[] = attrMaps.map((am, idx) => {
					const srcAttr = sourceEntity.attrSeq?.find((a) => a.name === am.src);
					const dstAttr = modelEntity.attrSeq?.find((a) => a.name === am.dst);
					return {
						id: `${mapping.id}__in__${depIndex}__${idx}`,
						sourceAttribute: am.src,
						sourceDescription: srcAttr?.comment ?? "",
						targetAttribute: am.dst,
						targetDescription: dstAttr?.comment ?? "",
					};
				});
				if (mappingsList.length === 0) return;
				connections.push({
					id: `conn__in__${mapping.id}__${dep.entityId}__${mapping.entityId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name ?? sourceEntity.id,
					targetName: targetEntity.name ?? targetEntity.id,
					description: "Трансформация источника в модель",
					mappings: mappingsList,
					functions: [],
				});
			});
		}

		const modelDep = mapping.deps.find((dep) => dep.entityId === modelEntityId);
		if (modelDep && modelEntity) {
			const attrMaps = modelDep.attrMaps ?? [];
			const mappingsList: AttributeMapping[] = attrMaps.map((am, idx) => {
				const srcAttr = modelEntity.attrSeq?.find((a) => a.name === am.src);
				const dstAttr = targetEntity.attrSeq?.find((a) => a.name === am.dst);
				return {
					id: `${mapping.id}__out__${idx}`,
					sourceAttribute: am.src,
					sourceDescription: srcAttr?.comment ?? "",
					targetAttribute: am.dst,
					targetDescription: dstAttr?.comment ?? "",
				};
			});
			if (mappingsList.length === 0) return;
			connections.push({
				id: `conn__out__${mapping.id}__${modelEntityId}__${mapping.entityId}`,
				sourceId: modelEntityId,
				targetId: mapping.entityId,
				sourceName: modelEntity.name ?? modelEntityId,
				targetName: targetEntity.name ?? targetEntity.id,
				description: "Трансформация модели в витрину",
				mappings: mappingsList,
				functions: [],
			});
		}
	});

	const usedIds = new Set<string>();
	connections.forEach((conn) => {
		usedIds.add(conn.sourceId);
		usedIds.add(conn.targetId);
	});

	// Если есть связи, показываем только связанные объекты
	if (usedIds.size > 0) {
		return {
			objects: objects.filter((obj) => usedIds.has(obj.id)),
			connections,
		};
	}

	// Если связей нет, показываем хотя бы саму выбранную модель
	const selectedModelObject = objects.find((obj) => obj.id === modelEntityId);
	if (selectedModelObject) {
		return { objects: [selectedModelObject], connections: [] };
	}

	// Если не нашли модель по ID, показываем все объекты
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
	const [schema, setSchema] = useState<DataLineageSchema | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [selectedObject, setSelectedObject] = useState<ModelObject | null>(
		null,
	);
	const [selectedConnection, setSelectedConnection] =
		useState<ObjectConnection | null>(null);
	const [isObjectDetailsOpen, setIsObjectDetailsOpen] = useState(false);
	const [isConnectionDetailsOpen, setIsConnectionDetailsOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		if (!featureFlags.newJsonDataV2Enabled) {
			setSchema(null);
			setError(null);
			setIsLoading(false);
			return;
		}
		const graphId: string | undefined =
			(model as JsonDataItem | any).graphId ?? model.graphId;
		if (!graphId) {
			setSchema(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);

		jsonDataV2Service
			.getById(graphId)
			.then((item) => {
				if (cancelled) return;
				console.log("[ModelGraphWindow] Schema loaded:", {
					graphId,
					modelId: model.id,
					entities: item.data?.entities?.length,
					mappings: item.data?.mappings?.length,
				});
				setSchema(item.data as DataLineageSchema);
			})
			.catch((e) => {
				if (cancelled) return;
				setError(e instanceof Error ? e : new Error("Ошибка загрузки графа"));
				setSchema(null);
			})
			.finally(() => {
				if (cancelled) return;
				setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, model]);

	const { objects, connections } = useMemo(() => {
		if (schema && featureFlags.newJsonDataV2Enabled) {
			const result = buildModelGraphFromSchema(schema, model.id);
			console.log("[ModelGraphWindow] Graph data:", {
				modelId: model.id,
				schemaEntities: schema.entities?.length,
				schemaMappings: schema.mappings?.length,
				objects: result.objects.length,
				connections: result.connections.length,
				objectIds: result.objects.map((o) => o.id),
			});
			return result;
		}
		return { objects: [], connections: [] };
	}, [schema, model.id]);

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

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Обновляем nodes и edges при изменении данных
	useEffect(() => {
		setNodes(initialNodes);
	}, [initialNodes, setNodes]);

	useEffect(() => {
		setEdges(initialEdges);
	}, [initialEdges, setEdges]);

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
				<DialogTitle>
					<Box display="flex" alignItems="center" gap={2}>
						<Typography variant="h6">Граф объектов: {model.name}</Typography>
						<Chip
							label={model.type === "view" ? "Витрина" : "Модель"}
							color={model.type === "view" ? "success" : "primary"}
							size="small"
						/>
						{model.status && (
							<Chip
								label={
									model.status === "active"
										? "Активная"
										: model.status === "draft"
											? "Черновик"
											: "Архивная"
								}
								color={
									model.status === "active"
										? "success"
										: model.status === "draft"
											? "warning"
											: "error"
								}
								size="small"
							/>
						)}
					</Box>
				</DialogTitle>
				<DialogContent>
					{/* Метаданные модели */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Метаданные модели
						</Typography>
						<Divider sx={{ mb: 2 }} />
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
								gap: 2,
							}}
						>
							<Box>
								<Typography variant="caption" color="text.secondary">
									ID
								</Typography>
								<Typography variant="body2" fontFamily="monospace">
									{model.id}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Пространство имен
								</Typography>
								<Typography variant="body2">
									{model.namespace || "—"}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Автор
								</Typography>
								<Typography variant="body2">{model.author || "—"}</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Версия
								</Typography>
								<Typography variant="body2">{model.version || "—"}</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Количество атрибутов
								</Typography>
								<Typography variant="body2">
									{model.objectsCount || 0}
								</Typography>
							</Box>
							<Box>
								<Typography variant="caption" color="text.secondary">
									Дата создания
								</Typography>
								<Typography variant="body2">
									{model.createdDate
										? new Date(model.createdDate).toLocaleDateString()
										: "—"}
								</Typography>
							</Box>
						</Box>
						{model.description && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="caption" color="text.secondary">
									Описание
								</Typography>
								<Typography variant="body2">{model.description}</Typography>
							</Box>
						)}
					</Paper>

					{/* Граф связей */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Граф связей
						</Typography>
						<Divider sx={{ mb: 2 }} />
						{!featureFlags.newJsonDataV2Enabled && (
							<Alert severity="info" sx={{ mb: 2 }}>
								Граф связей доступен только при включенном флаге
								newJsonDataV2Enabled
							</Alert>
						)}
						{schema && featureFlags.newJsonDataV2Enabled && (
							<Box
								sx={{ mb: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}
							>
								<Typography variant="caption" color="text.secondary">
									Отладка: Сущностей в схеме: {schema.entities?.length || 0} |
									Объектов для отображения: {objects.length} | Связей:{" "}
									{connections.length} | Model ID: {model.id}
								</Typography>
							</Box>
						)}
						{objects.length === 0 &&
							!isLoading &&
							!error &&
							featureFlags.newJsonDataV2Enabled &&
							schema && (
								<Alert severity="info" sx={{ mb: 2 }}>
									Для данной модели нет связей с другими объектами. Всего
									сущностей в схеме: {schema.entities?.length || 0}
								</Alert>
							)}
						{!schema &&
							!isLoading &&
							!error &&
							featureFlags.newJsonDataV2Enabled && (
								<Alert severity="warning" sx={{ mb: 2 }}>
									Не удалось загрузить схему данных для модели. GraphId:{" "}
									{model.graphId || "отсутствует"}
								</Alert>
							)}
					</Paper>

					<Box
						sx={{
							height: "600px",
							width: "100%",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 1,
						}}
					>
						{isLoading ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									height: "100%",
								}}
							>
								<CircularProgress />
							</Box>
						) : error ? (
							<Box
								sx={{
									p: 2,
									height: "100%",
									boxSizing: "border-box",
								}}
							>
								<Alert severity="error">
									Ошибка загрузки графа модели: {error.message}
								</Alert>
							</Box>
						) : (
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
						)}
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
