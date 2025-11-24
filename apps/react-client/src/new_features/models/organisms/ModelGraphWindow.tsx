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
	ReactFlowProvider,
	Node,
	Edge,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	ConnectionMode,
	NodeTypes,
	MarkerType,
	Handle,
	Position,
} from "@xyflow/react";
import { Close, Visibility, ExpandMore, ExpandLess } from "@mui/icons-material";

import { ObjectDetailsDialog } from "../molecules/ObjectDetailsDialog";
import { ConnectionDetailsDialog } from "../molecules/ConnectionDetailsDialog";
import { featureFlags } from "@react-client/config/featureFlags";
import { jsonDataV2Service } from "@react-client/api/jsonDataV2Api";
import type { JsonDataItem } from "@react-client/api/jsonDataV2Api";
import type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

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
	isExpanded?: boolean;
	canExpand?: boolean;
	onToggleExpand?: () => void;
}

const CustomNode = ({ data }: { data: CustomNodeData }) => {
	return (
		<>
			{/* Target handle - for incoming edges */}
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#555" }}
			/>

			<Paper
				sx={{
					backgroundColor: getNodeColor(data.type),
					border: `2px solid ${getNodeBorderColor(data.type)}`,
					borderRadius: 1,
					p: 2,
					minWidth: "200px",
					cursor: "pointer",
					"&:hover": { boxShadow: 2 },
					boxShadow: data.isExpanded ? 3 : 0,
				}}
				onDoubleClick={data.onDoubleClick}
			>
				<Box display="flex" flexDirection="column" gap={1}>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
					>
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
						<Box display="flex" gap={0.5}>
							{data.canExpand && data.onToggleExpand && (
								<IconButton
									size="small"
									title={
										data.isExpanded ? "Свернуть связи" : "Развернуть связи"
									}
									onClick={(e) => {
										e.stopPropagation();
										data.onToggleExpand?.();
									}}
									sx={{
										bgcolor: data.isExpanded ? "primary.main" : "transparent",
										color: data.isExpanded ? "white" : "inherit",
										"&:hover": {
											bgcolor: data.isExpanded
												? "primary.dark"
												: "action.hover",
										},
									}}
								>
									{data.isExpanded ? (
										<ExpandLess fontSize="small" />
									) : (
										<ExpandMore fontSize="small" />
									)}
								</IconButton>
							)}
							<IconButton
								size="small"
								title="Просмотр деталей"
								onClick={data.onView}
							>
								<Visibility fontSize="small" />
							</IconButton>
						</Box>
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

			{/* Source handle - for outgoing edges */}
			<Handle
				type="source"
				position={Position.Right}
				style={{ background: "#555" }}
			/>
		</>
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
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
		new Set([model.id]),
	);

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

	// Build full graph with all entities and connections
	const { allObjects, allConnections } = useMemo(() => {
		if (!schema || !featureFlags.newJsonDataV2Enabled) {
			return { allObjects: [], allConnections: [] };
		}

		const entitiesById = new Map<string, DataLineageEntity>();
		schema.entities.forEach((entity) => {
			entitiesById.set(entity.id, entity);
		});

		const toModelObjectType = (
			entity: DataLineageEntity,
		): ModelObject["type"] => {
			if (entity.id === model.id) return "model";
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

		// Deduplicate entities by ID - take the first occurrence
		const uniqueEntitiesMap = new Map<string, DataLineageEntity>();
		schema.entities.forEach((entity) => {
			if (!uniqueEntitiesMap.has(entity.id)) {
				uniqueEntitiesMap.set(entity.id, entity);
			}
		});

		const objects: ModelObject[] = [];
		uniqueEntitiesMap.forEach((entity) => {
			objects.push({
				id: entity.id,
				name: entity.name ?? entity.id,
				type: toModelObjectType(entity),
				description: "",
				attributes: makeAttributes(entity),
				connections: [],
			});
		});

		const connections: ObjectConnection[] = [];
		const mappings: DataLineageMapping[] = schema.mappings ?? [];

		mappings.forEach((mapping) => {
			if (!mapping.deps || mapping.deps.length === 0) return;
			if (!mapping.entityId) {
				console.warn(
					"[ModelGraphWindow] Skipping mapping - no entityId:",
					mapping,
				);
				return;
			}

			const targetEntity = entitiesById.get(mapping.entityId);
			if (!targetEntity) return;

			mapping.deps.forEach((dep, depIndex) => {
				if (!dep.entityId) {
					console.warn("[ModelGraphWindow] Skipping dep - no entityId:", dep);
					return;
				}

				const sourceEntity = entitiesById.get(dep.entityId);
				if (!sourceEntity) return;
				const attrMaps = dep.attrMaps ?? [];
				if (attrMaps.length === 0) return;

				const mappingsList: AttributeMapping[] = attrMaps.map((am, idx) => {
					const srcAttr = sourceEntity.attrSeq?.find((a) => a.name === am.src);
					const dstAttr = targetEntity.attrSeq?.find((a) => a.name === am.dst);
					return {
						id: `${mapping.id}__${depIndex}__${idx}`,
						sourceAttribute: am.src,
						sourceDescription: srcAttr?.comment ?? "",
						targetAttribute: am.dst,
						targetDescription: dstAttr?.comment ?? "",
					};
				});

				connections.push({
					id: `conn__${mapping.id}__${dep.entityId}__${mapping.entityId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name ?? sourceEntity.id,
					targetName: targetEntity.name ?? targetEntity.id,
					description:
						mapping.entityId === model.id
							? "Трансформация источника в модель"
							: dep.entityId === model.id
								? "Трансформация модели в витрину"
								: "Трансформация данных",
					mappings: mappingsList,
					functions: [],
				});
			});
		});

		console.log("[ModelGraphWindow] Full graph data:", {
			modelId: model.id,
			schemaEntities: schema.entities?.length,
			uniqueEntities: uniqueEntitiesMap.size,
			duplicatesRemoved: schema.entities.length - uniqueEntitiesMap.size,
			schemaMappings: schema.mappings?.length,
			objects: objects.length,
			connections: connections.length,
		});

		return { allObjects: objects, allConnections: connections };
	}, [schema, model.id]);

	// Filter objects and connections based on expanded nodes
	const { objects, connections } = useMemo(() => {
		if (allObjects.length === 0) {
			return { objects: [], connections: [] };
		}

		const visibleNodeIds = new Set<string>(expandedNodes);
		const visibleConnections: ObjectConnection[] = [];

		// Add all connections involving expanded nodes
		allConnections.forEach((conn) => {
			if (
				expandedNodes.has(conn.sourceId) ||
				expandedNodes.has(conn.targetId)
			) {
				visibleConnections.push(conn);
				visibleNodeIds.add(conn.sourceId);
				visibleNodeIds.add(conn.targetId);
			}
		});

		const visibleObjects = allObjects.filter((obj) =>
			visibleNodeIds.has(obj.id),
		);

		console.log("[ModelGraphWindow] Visible graph:", {
			expandedNodes: Array.from(expandedNodes),
			visibleNodeIds: Array.from(visibleNodeIds),
			allObjectIds: allObjects.map((o) => o.id),
			visibleObjectIds: visibleObjects.map((o) => o.id),
			visibleObjects: visibleObjects.length,
			visibleConnections: visibleConnections.length,
			connectionDetails: visibleConnections.map((c) => ({
				id: c.id,
				source: c.sourceId,
				target: c.targetId,
			})),
		});

		return { objects: visibleObjects, connections: visibleConnections };
	}, [allObjects, allConnections, expandedNodes]);

	const toggleNodeExpansion = useCallback(
		(nodeId: string) => {
			setExpandedNodes((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(nodeId)) {
					// When collapsing, only remove the node if it's not the main model
					if (nodeId !== model.id) {
						newSet.delete(nodeId);
					}
				} else {
					newSet.add(nodeId);
				}
				return newSet;
			});
		},
		[model.id],
	);

	const initialNodes: Node[] = useMemo(() => {
		const nodes = objects.map((obj, index) => {
			const hasConnections = allConnections.some(
				(conn) => conn.sourceId === obj.id || conn.targetId === obj.id,
			);
			const isExpanded = expandedNodes.has(obj.id);

			return {
				id: obj.id,
				type: "custom",
				position: {
					x: (index % 3) * 300,
					y: Math.floor(index / 3) * 200,
				},
				data: {
					...obj,
					isExpanded,
					canExpand: hasConnections,
					onToggleExpand: () => toggleNodeExpansion(obj.id),
					onDoubleClick: () => {
						setSelectedObject(obj);
						setIsObjectDetailsOpen(true);
					},
					onView: () => {
						setSelectedObject(obj);
						setIsObjectDetailsOpen(true);
					},
				},
			};
		});

		console.log("[ModelGraphWindow] Nodes created:", {
			count: nodes.length,
			nodeIds: nodes.map((n) => n.id),
			nodes: nodes.map((n) => ({
				id: n.id,
				dataId: n.data.id,
				name: n.data.name,
			})),
		});

		return nodes;
	}, [objects, allConnections, expandedNodes, toggleNodeExpansion]);

	const initialEdges: Edge[] = useMemo(() => {
		const nodeIdSet = new Set(objects.map((obj) => obj.id));

		// Filter connections to only include those where both source and target nodes exist
		const validConnections = connections.filter((conn) => {
			// Check if sourceId and targetId are valid strings
			if (
				!conn.sourceId ||
				!conn.targetId ||
				typeof conn.sourceId !== "string" ||
				typeof conn.targetId !== "string"
			) {
				console.warn("[ModelGraphWindow] Skipping edge - invalid IDs:", {
					edgeId: conn.id,
					sourceId: conn.sourceId,
					sourceIdType: typeof conn.sourceId,
					targetId: conn.targetId,
					targetIdType: typeof conn.targetId,
				});
				return false;
			}

			const sourceExists = nodeIdSet.has(conn.sourceId);
			const targetExists = nodeIdSet.has(conn.targetId);

			if (!sourceExists || !targetExists) {
				console.warn("[ModelGraphWindow] Skipping edge - missing node:", {
					edgeId: conn.id,
					sourceId: conn.sourceId,
					sourceExists,
					targetId: conn.targetId,
					targetExists,
					availableNodeIds: Array.from(nodeIdSet).slice(0, 10), // Show first 10 for debugging
				});
				return false;
			}
			return true;
		});

		const edges = validConnections.map((conn) => ({
			id: conn.id,
			source: conn.sourceId,
			target: conn.targetId,
			type: "default",
			style: { strokeWidth: 2, stroke: "#666" },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: "#666",
			},
			label: conn.description,
			animated: false,
		}));

		console.log("[ModelGraphWindow] Edges created:", {
			totalConnections: connections.length,
			validConnections: validConnections.length,
			edgesCount: edges.length,
			nodeCount: nodeIdSet.size,
			sampleEdge: edges[0],
			edges: edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		});

		// Debug: Log if edges are empty
		if (edges.length === 0) {
			console.error(
				"[ModelGraphWindow] No valid edges created! Check node IDs.",
			);
		}

		return edges;
	}, [connections, objects]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

	// Обновляем nodes и edges при изменении данных
	useEffect(() => {
		setNodes(initialNodes);
	}, [initialNodes, setNodes]);

	useEffect(() => {
		setEdges(initialEdges);
	}, [initialEdges, setEdges]);

	// Fit view after nodes and edges are set
	useEffect(() => {
		if (reactFlowInstance && nodes.length > 0) {
			setTimeout(() => {
				reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
			}, 100);
		}
	}, [reactFlowInstance, nodes, edges]);

	// Debug: log current state
	useEffect(() => {
		console.log("[ModelGraphWindow] Current state:", {
			nodesCount: nodes.length,
			edgesCount: edges.length,
			nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
			edges: edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		});
	}, [nodes, edges]);

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
							<>
								{console.log("[ModelGraphWindow] Rendering ReactFlow:", {
									nodesCount: nodes.length,
									edgesCount: edges.length,
									nodeIds: nodes.map((n) => n.id),
									edges: edges.map((e) => ({
										id: e.id,
										source: e.source,
										sourceType: typeof e.source,
										target: e.target,
										targetType: typeof e.target,
										type: e.type,
									})),
									firstEdge: edges[0],
								})}
								<ReactFlowProvider>
									<ReactFlow
										nodes={nodes}
										edges={edges}
										onNodesChange={onNodesChange}
										onEdgesChange={onEdgesChange}
										onEdgeDoubleClick={onEdgeDoubleClick}
										onInit={setReactFlowInstance}
										nodeTypes={nodeTypes}
										connectionMode={ConnectionMode.Loose}
										minZoom={0.1}
										maxZoom={4}
										defaultEdgeOptions={{
											type: "default",
											animated: false,
										}}
										proOptions={{ hideAttribution: true }}
									>
										<Controls />
										<Background />
									</ReactFlow>
								</ReactFlowProvider>
							</>
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
					connections={allConnections.filter(
						(conn) =>
							conn.sourceId === selectedObject.id ||
							conn.targetId === selectedObject.id,
					)}
					onExpandNode={toggleNodeExpansion}
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
