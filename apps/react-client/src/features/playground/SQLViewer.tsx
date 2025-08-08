import React, { useState, useCallback, useEffect } from "react";
import {
	ReactFlow,
	Node,
	Edge,
	addEdge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Position,
	MarkerType,
	Handle,
	Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDatabaseSchema } from "@react-client/api/hooks/useDatabaseSchema";
import { useTableData } from "@react-client/api/hooks/useTableData";
import type { TableInfo } from "@react-client/api/databaseSchemaApi";

// MUI v7 imports
import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	Paper,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Tabs,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Card,
	CardContent,
	CardHeader,
	Avatar,
	Container,
	Stack,
	Alert,
	Tooltip,
	CircularProgress,
} from "@mui/material";
import {
	Storage as DatabaseIcon,
	TableChart as TableIcon,
	Key as KeyIcon,
	Link as LinkIcon,
	AccountTree as DiagramIcon,
	CheckCircle as ConnectedIcon,
} from "@mui/icons-material";

// Custom Table Node Component with MUI styling
const TableNode: React.FC<any> = ({ data, selected }) => {
	return (
		<Card
			sx={{
				minWidth: 280,
				border: selected ? "2px solid" : "1px solid",
				borderColor: selected ? "primary.main" : "grey.300",
				transition: "all 0.2s",
				"&:hover": {
					boxShadow: 4,
				},
			}}
		>
			<Handle
				type="target"
				position={Position.Left}
				style={{
					width: 12,
					height: 12,
					backgroundColor: "#1976d2",
					border: "2px solid white",
				}}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{
					width: 12,
					height: 12,
					backgroundColor: "#1976d2",
					border: "2px solid white",
				}}
			/>

			<CardHeader
				avatar={
					<Avatar sx={{ bgcolor: "primary.main" }}>
						<TableIcon />
					</Avatar>
				}
				title={
					<Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
						{data.tableName}
					</Typography>
				}
				subheader={`${data.columns.length} columns`}
				sx={{
					bgcolor: "primary.50",
					"& .MuiCardHeader-content": { overflow: "hidden" },
				}}
			/>

			<CardContent sx={{ pt: 1, maxHeight: 300, overflow: "auto" }}>
				<Stack spacing={1}>
					{data.columns.map((column: any, index: number) => (
						<Box
							key={index}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								py: 0.5,
								borderBottom: "1px solid",
								borderColor: "grey.100",
								"&:last-child": { borderBottom: "none" },
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								{column.primaryKey && (
									<Tooltip title="Primary Key">
										<KeyIcon sx={{ fontSize: 16, color: "warning.main" }} />
									</Tooltip>
								)}
								<Typography
									variant="body2"
									sx={{
										fontWeight: column.primaryKey ? "bold" : "normal",
										color: column.primaryKey ? "warning.dark" : "text.primary",
									}}
								>
									{column.name}
								</Typography>
							</Box>
							<Chip
								label={column.type}
								size="small"
								variant="outlined"
								sx={{ fontSize: "0.7rem", height: 20 }}
							/>
						</Box>
					))}
				</Stack>

				{data?.foreignKeys && data?.foreignKeys.length > 0 && (
					<Box
						sx={{
							mt: 2,
							pt: 2,
							borderTop: "1px solid",
							borderColor: "grey.200",
						}}
					>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ mb: 1, display: "block" }}
							component="div"
						>
							Foreign Keys:
						</Typography>
						<Stack spacing={0.5}>
							{data.foreignKeys.map((fk: any, index: number) => (
								<Chip
									key={index}
									icon={<LinkIcon />}
									label={`${fk.column} → ${fk.references}`}
									size="small"
									color="secondary"
									variant="outlined"
									sx={{ fontSize: "0.7rem" }}
								/>
							))}
						</Stack>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

const nodeTypes = {
	tableNode: TableNode,
};

const SQLiteViewer: React.FC = () => {
	const [selectedTable, setSelectedTable] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<number>(0);
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	const {
		data: schemaData,
		isLoading: isSchemaLoading,
		error: schemaError,
	} = useDatabaseSchema();
	const { data: tableData, isLoading: isTableDataLoading } = useTableData(
		selectedTable || "",
		{
			limit: 100,
			offset: 0,
			enabled: !!selectedTable,
		},
	);

	const generateFlowDiagram = useCallback(
		(tables: TableInfo[]) => {
			const newNodes: Node[] = [];
			const newEdges: Edge[] = [];

			tables.forEach((table, index) => {
				const row = Math.floor(index / 3);
				const col = index % 3;

				newNodes.push({
					id: table.name,
					type: "tableNode",
					position: {
						x: col * 350 + (row % 2) * 100,
						y: row * 350,
					},
					data: {
						tableName: table.name,
						columns: table.columns,
						foreignKeys: table.foreignKeys,
					},
				});
			});

			tables.forEach((table) => {
				table.foreignKeys?.forEach((fk, index) => {
					const [refTable] = fk.references.split(".");
					newEdges.push({
						id: `${table.name}-${refTable}-${index}`,
						source: table.name,
						target: refTable,
						type: "smoothstep",
						animated: true,
						style: {
							stroke: "#1976d2",
							strokeWidth: 2,
						},
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: "#1976d2",
							width: 20,
							height: 20,
						},
						label: fk.column,
						labelStyle: {
							fontSize: 12,
							fill: "#1976d2",
							fontWeight: "bold",
						},
					});
				});
			});

			setNodes(newNodes);
			setEdges(newEdges);
		},
		[setNodes, setEdges],
	);

	useEffect(() => {
		if (schemaData?.tables) {
			generateFlowDiagram(schemaData.tables);
		}
	}, [schemaData, generateFlowDiagram]);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const getSelectedTableInfo = () => {
		if (!selectedTable || !schemaData?.tables) return null;
		return schemaData.tables.find((table) => table.name === selectedTable);
	};

	const TableView: React.FC<{ table: TableInfo; tableData?: any[] }> = ({
		table,
		tableData: data = [],
	}) => (
		<Stack spacing={3}>
			<Card>
				<CardHeader
					avatar={
						<Avatar sx={{ bgcolor: "primary.main" }}>
							<TableIcon />
						</Avatar>
					}
					title={
						<Typography variant="h4" component="h1">
							{table.name}
						</Typography>
					}
					action={
						<Stack direction="row" spacing={1}>
							<Chip
								label={`${table.rowCount} строк`}
								color="primary"
								variant="outlined"
							/>
							<Chip
								label={`${table.columns.length} колонок`}
								color="success"
								variant="outlined"
							/>
							{table.foreignKeys?.length > 0 && (
								<Chip
									label={`${table.foreignKeys.length} внешних ключей`}
									color="secondary"
									variant="outlined"
								/>
							)}
						</Stack>
					}
				/>
			</Card>

			<Card>
				<CardHeader
					title="Схема"
					avatar={<Avatar sx={{ bgcolor: "info.main" }}>📋</Avatar>}
				/>
				<CardContent>
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Колонка</TableCell>
									<TableCell>Тип</TableCell>
									<TableCell>Ограничения</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{table.columns.map((column, index) => (
									<TableRow key={index} hover>
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												{column.primaryKey && (
													<Tooltip title="Первичный ключ">
														<KeyIcon
															sx={{ color: "warning.main", fontSize: 20 }}
														/>
													</Tooltip>
												)}
												<Typography
													variant="body2"
													sx={{
														fontWeight: column.primaryKey ? "bold" : "normal",
													}}
												>
													{column.name}
												</Typography>
											</Box>
										</TableCell>
										<TableCell>
											<Chip
												label={column.type}
												size="small"
												sx={{ fontFamily: "monospace" }}
											/>
										</TableCell>
										<TableCell>
											<Stack direction="row" spacing={1}>
												{column.primaryKey && (
													<Chip
														label="ПЕРВИЧНЫЙ КЛЮЧ"
														color="warning"
														size="small"
													/>
												)}
												{!column.nullable && (
													<Chip label="НЕ NULL" color="error" size="small" />
												)}
											</Stack>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>

			{table.foreignKeys?.length > 0 && (
				<Card>
					<CardHeader
						title="Внешние ключи"
						avatar={
							<Avatar sx={{ bgcolor: "secondary.main" }}>
								<LinkIcon />
							</Avatar>
						}
					/>
					<CardContent>
						<Stack spacing={2}>
							{table.foreignKeys.map((fk, index) => (
								<Alert
									key={index}
									severity="info"
									icon={<LinkIcon />}
									sx={{
										"& .MuiAlert-message": {
											display: "flex",
											alignItems: "center",
											gap: 1,
										},
									}}
								>
									<Typography component="span" sx={{ fontWeight: "bold" }}>
										{fk.column}
									</Typography>
									<Typography component="span" sx={{ mx: 1 }}>
										ссылается на
									</Typography>
									<Typography
										component="span"
										sx={{ fontWeight: "bold", color: "secondary.main" }}
									>
										{fk.references}
									</Typography>
								</Alert>
							))}
						</Stack>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader
					title="Предварительный просмотр данных"
					avatar={<Avatar sx={{ bgcolor: "success.main" }}>📊</Avatar>}
				/>
				<CardContent>
					{isTableDataLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
							<CircularProgress />
						</Box>
					) : (
						<TableContainer sx={{ maxHeight: 400 }}>
							<Table stickyHeader>
								<TableHead>
									<TableRow>
										{table.columns.map((column, index) => (
											<TableCell key={index} sx={{ fontWeight: "bold" }}>
												{column.name}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{data.map((row, rowIndex) => (
										<TableRow key={rowIndex} hover>
											{table.columns.map((column, colIndex) => (
												<TableCell key={colIndex}>{row[column.name]}</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</CardContent>
			</Card>
		</Stack>
	);

	if (isSchemaLoading) {
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: "background.default",
				}}
			>
				<Stack spacing={2} alignItems="center">
					<CircularProgress size={60} />
					<Typography variant="h6">Загрузка схемы базы данных...</Typography>
				</Stack>
			</Box>
		);
	}

	if (schemaError) {
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: "background.default",
				}}
			>
				<Alert severity="error" sx={{ maxWidth: 600 }}>
					<Typography variant="h6">
						Ошибка загрузки схемы базы данных
					</Typography>
					<Typography>{schemaError.message}</Typography>
				</Alert>
			</Box>
		);
	}

	const selectedTableInfo = getSelectedTableInfo();

	return (
		<Box
			sx={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.default",
			}}
		>
			<AppBar position="static" elevation={1}>
				<Toolbar>
					<DatabaseIcon sx={{ mr: 2 }} />
					<Box sx={{ flexGrow: 1 }}>
						<Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
							Просмотрщик базы данных
						</Typography>
						<Typography variant="body2" sx={{ opacity: 0.8 }}>
							Исследуйте схему базы данных и связи между таблицами
						</Typography>
					</Box>
					<Chip
						icon={<ConnectedIcon />}
						label={`Подключено к ${schemaData?.databaseType || "базе данных"}`}
						color="success"
						variant="filled"
						sx={{
							bgcolor: "success.main",
							color: "white",
							"& .MuiChip-icon": { color: "white" },
						}}
					/>
				</Toolbar>
			</AppBar>

			<Paper sx={{ borderRadius: 0 }}>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					sx={{ px: 3 }}
					textColor="primary"
					indicatorColor="primary"
				>
					<Tab
						icon={<TableIcon />}
						label="Таблицы и данные"
						iconPosition="start"
					/>
					<Tab
						icon={<DiagramIcon />}
						label="ER-диаграмма"
						iconPosition="start"
					/>
				</Tabs>
			</Paper>

			<Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
				{activeTab === 0 && (
					<>
						<Paper
							sx={{
								width: 320,
								borderRadius: 0,
								borderRight: "1px solid",
								borderColor: "divider",
								overflow: "auto",
							}}
						>
							<Box sx={{ p: 3 }}>
								<Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
									Таблицы ({schemaData?.tables?.length || 0})
								</Typography>
								<List>
									{schemaData?.tables?.map((table) => (
										<ListItem key={table.name} disablePadding sx={{ mb: 1 }}>
											<ListItemButton
												selected={selectedTable === table.name}
												onClick={() => setSelectedTable(table.name)}
												sx={{
													borderRadius: 2,
													"&.Mui-selected": {
														bgcolor: "primary.50",
														borderLeft: "4px solid",
														borderColor: "primary.main",
													},
												}}
											>
												<ListItemText
													primary={
														<Typography
															variant="subtitle1"
															sx={{ fontWeight: "bold" }}
														>
															{table.name}
														</Typography>
													}
													secondary={
														<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
															<Chip
																label={`${table.rowCount} строк`}
																size="small"
																variant="outlined"
																color="primary"
															/>
															<Chip
																label={`${table.columns.length} кол.`}
																size="small"
																variant="outlined"
																color="success"
															/>
															{table.foreignKeys?.length > 0 && (
																<Chip
																	label={`${table.foreignKeys.length} ВК`}
																	size="small"
																	variant="outlined"
																	color="secondary"
																/>
															)}
														</Stack>
													}
												/>
											</ListItemButton>
										</ListItem>
									))}
								</List>
							</Box>
						</Paper>

						<Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
							{selectedTableInfo ? (
								<TableView
									table={selectedTableInfo}
									tableData={tableData?.data}
								/>
							) : (
								<Container maxWidth="sm">
									<Box sx={{ textAlign: "center", py: 8 }}>
										<Avatar
											sx={{
												width: 80,
												height: 80,
												mx: "auto",
												mb: 3,
												bgcolor: "grey.100",
												color: "grey.400",
											}}
										>
											<TableIcon sx={{ fontSize: 40 }} />
										</Avatar>
										<Typography
											variant="h4"
											sx={{
												mb: 2,
												fontWeight: "bold",
												color: "text.primary",
											}}
										>
											Выберите таблицу для исследования
										</Typography>
										<Typography variant="body1" color="text.secondary">
											Выберите таблицу из боковой панели для просмотра её
											детальной схемы, ограничений и предварительного просмотра
											данных
										</Typography>
									</Box>
								</Container>
							)}
						</Box>
					</>
				)}

				{activeTab === 1 && (
					<Box sx={{ flex: 1, position: "relative" }}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							nodeTypes={nodeTypes}
							fitView
							fitViewOptions={{ padding: 0.2 }}
							defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
							minZoom={0.2}
							maxZoom={1.5}
						>
							<Background color="#f0f0f0" size={1} />
							<MiniMap
								nodeColor={(node) => (node.selected ? "#1976d2" : "#64748b")}
								style={{
									backgroundColor: "white",
									border: "1px solid #e0e0e0",
									borderRadius: "8px",
								}}
							/>
							<Controls
								style={{
									backgroundColor: "white",
									border: "1px solid #e0e0e0",
									borderRadius: "8px",
								}}
							/>
						</ReactFlow>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default SQLiteViewer;
