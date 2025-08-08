import React, { useState, useCallback } from "react";
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

// MUI v7 imports
import {
	AppBar,
	Toolbar,
	Typography,
	Button,
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
} from "@mui/material";
import {
	Storage as DatabaseIcon,
	TableChart as TableIcon,
	Key as KeyIcon,
	Link as LinkIcon,
	AccountTree as DiagramIcon,
	CheckCircle as ConnectedIcon,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Create MUI theme
const theme = createTheme({
	palette: {
		primary: {
			main: "#1976d2",
		},
		secondary: {
			main: "#dc004e",
		},
		background: {
			default: "#f5f5f5",
			paper: "#ffffff",
		},
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 12,
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 16,
					boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
				},
			},
		},
	},
});

// Mock SQLite connection
const mockDatabase = {
	users: {
		columns: [
			{ name: "id", type: "INTEGER", primaryKey: true },
			{ name: "username", type: "TEXT", nullable: false },
			{ name: "email", type: "TEXT", nullable: false },
			{ name: "created_at", type: "DATETIME", nullable: true },
		],
		data: [
			{
				id: 1,
				username: "john_doe",
				email: "john@example.com",
				created_at: "2024-01-01 10:00:00",
			},
			{
				id: 2,
				username: "jane_smith",
				email: "jane@example.com",
				created_at: "2024-01-02 11:30:00",
			},
		],
		foreignKeys: [],
	},
	posts: {
		columns: [
			{ name: "id", type: "INTEGER", primaryKey: true },
			{ name: "user_id", type: "INTEGER", nullable: false },
			{ name: "title", type: "TEXT", nullable: false },
			{ name: "content", type: "TEXT", nullable: true },
			{ name: "created_at", type: "DATETIME", nullable: true },
		],
		data: [
			{
				id: 1,
				user_id: 1,
				title: "My First Post",
				content: "Hello world!",
				created_at: "2024-01-03 09:00:00",
			},
			{
				id: 2,
				user_id: 2,
				title: "React Tips",
				content: "Some useful React tips...",
				created_at: "2024-01-04 14:20:00",
			},
		],
		foreignKeys: [{ column: "user_id", references: "users.id" }],
	},
	comments: {
		columns: [
			{ name: "id", type: "INTEGER", primaryKey: true },
			{ name: "post_id", type: "INTEGER", nullable: false },
			{ name: "user_id", type: "INTEGER", nullable: false },
			{ name: "content", type: "TEXT", nullable: false },
			{ name: "created_at", type: "DATETIME", nullable: true },
		],
		data: [
			{
				id: 1,
				post_id: 1,
				user_id: 2,
				content: "Great post!",
				created_at: "2024-01-05 16:45:00",
			},
		],
		foreignKeys: [
			{ column: "post_id", references: "posts.id" },
			{ column: "user_id", references: "users.id" },
		],
	},
	categories: {
		columns: [
			{ name: "id", type: "INTEGER", primaryKey: true },
			{ name: "name", type: "TEXT", nullable: false },
			{ name: "description", type: "TEXT", nullable: true },
		],
		data: [
			{ id: 1, name: "Technology", description: "Tech-related posts" },
			{ id: 2, name: "Lifestyle", description: "Lifestyle content" },
		],
		foreignKeys: [],
	},
	post_categories: {
		columns: [
			{ name: "post_id", type: "INTEGER", primaryKey: true },
			{ name: "category_id", type: "INTEGER", primaryKey: true },
		],
		data: [
			{ post_id: 1, category_id: 1 },
			{ post_id: 2, category_id: 1 },
		],
		foreignKeys: [
			{ column: "post_id", references: "posts.id" },
			{ column: "category_id", references: "categories.id" },
		],
	},
};

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
	const [tables, setTables] = useState<any>({});
	const [connected, setConnected] = useState(false);
	const [activeTab, setActiveTab] = useState<number>(0);
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	const connectToDatabase = () => {
		setTables(mockDatabase);
		setConnected(true);
		generateFlowDiagram(mockDatabase);
	};

	const generateFlowDiagram = (database: any) => {
		const tableNames = Object.keys(database);
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		tableNames.forEach((tableName, index) => {
			const table = database[tableName];
			const row = Math.floor(index / 3);
			const col = index % 3;

			newNodes.push({
				id: tableName,
				type: "tableNode",
				position: {
					x: col * 350 + (row % 2) * 100,
					y: row * 350,
				},
				data: {
					tableName,
					columns: table.columns,
					foreignKeys: table.foreignKeys,
				},
			});
		});

		tableNames.forEach((tableName) => {
			const table = database[tableName];
			table.foreignKeys?.forEach((fk: any, index: number) => {
				const [refTable] = fk.references.split(".");
				newEdges.push({
					id: `${tableName}-${refTable}-${index}`,
					source: tableName,
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
	};

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const TableView: React.FC<{ table: any; tableName: string }> = ({
		table,
		tableName,
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
							{tableName}
						</Typography>
					}
					action={
						<Stack direction="row" spacing={1}>
							<Chip
								label={`${table.data.length} rows`}
								color="primary"
								variant="outlined"
							/>
							<Chip
								label={`${table.columns.length} columns`}
								color="success"
								variant="outlined"
							/>
							{table.foreignKeys?.length > 0 && (
								<Chip
									label={`${table.foreignKeys.length} foreign keys`}
									color="secondary"
									variant="outlined"
								/>
							)}
						</Stack>
					}
				/>
			</Card>

			{/* Schema */}
			<Card>
				<CardHeader
					title="Schema"
					avatar={<Avatar sx={{ bgcolor: "info.main" }}>📋</Avatar>}
				/>
				<CardContent>
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Column</TableCell>
									<TableCell>Type</TableCell>
									<TableCell>Constraints</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{table.columns.map((column: any, index: number) => (
									<TableRow key={index} hover>
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												{column.primaryKey && (
													<Tooltip title="Primary Key">
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
														label="PRIMARY KEY"
														color="warning"
														size="small"
													/>
												)}
												{!column.nullable && (
													<Chip label="NOT NULL" color="error" size="small" />
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

			{/* Foreign Keys */}
			{table.foreignKeys?.length > 0 && (
				<Card>
					<CardHeader
						title="Foreign Keys"
						avatar={
							<Avatar sx={{ bgcolor: "secondary.main" }}>
								<LinkIcon />
							</Avatar>
						}
					/>
					<CardContent>
						<Stack spacing={2}>
							{table.foreignKeys.map((fk: any, index: number) => (
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
										references
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

			{/* Data */}
			<Card>
				<CardHeader
					title="Data Preview"
					avatar={<Avatar sx={{ bgcolor: "success.main" }}>📊</Avatar>}
				/>
				<CardContent>
					<TableContainer sx={{ maxHeight: 400 }}>
						<Table stickyHeader>
							<TableHead>
								<TableRow>
									{table.columns.map((column: any, index: number) => (
										<TableCell key={index} sx={{ fontWeight: "bold" }}>
											{column.name}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{table.data.map((row: any, rowIndex: number) => (
									<TableRow key={rowIndex} hover>
										{table.columns.map((column: any, colIndex: number) => (
											<TableCell key={colIndex}>{row[column.name]}</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
		</Stack>
	);

	return (
		<ThemeProvider theme={theme}>
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					bgcolor: "background.default",
				}}
			>
				{/* Header */}
				<AppBar position="static" elevation={1}>
					<Toolbar>
						<DatabaseIcon sx={{ mr: 2 }} />
						<Box sx={{ flexGrow: 1 }}>
							<Typography
								variant="h5"
								component="h1"
								sx={{ fontWeight: "bold" }}
							>
								SQLite Database Viewer
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.8 }}>
								Explore your database schema and relationships
							</Typography>
						</Box>
						{!connected ? (
							<Button
								variant="contained"
								color="secondary"
								size="large"
								onClick={connectToDatabase}
								startIcon={<DatabaseIcon />}
								sx={{
									borderRadius: 3,
									px: 3,
								}}
							>
								Connect to Database
							</Button>
						) : (
							<Chip
								icon={<ConnectedIcon />}
								label="Connected to Database"
								color="success"
								variant="filled"
								sx={{
									bgcolor: "success.main",
									color: "white",
									"& .MuiChip-icon": { color: "white" },
								}}
							/>
						)}
					</Toolbar>
				</AppBar>

				{connected && (
					<>
						{/* Navigation Tabs */}
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
									label="Tables & Data"
									iconPosition="start"
								/>
								<Tab
									icon={<DiagramIcon />}
									label="ER Diagram"
									iconPosition="start"
								/>
							</Tabs>
						</Paper>

						<Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
							{activeTab === 0 && (
								<>
									{/* Sidebar */}
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
											<Typography
												variant="h6"
												sx={{ mb: 2, fontWeight: "bold" }}
											>
												Tables ({Object.keys(tables).length})
											</Typography>
											<List>
												{Object.keys(tables).map((tableName) => (
													<ListItem
														key={tableName}
														disablePadding
														sx={{ mb: 1 }}
													>
														<ListItemButton
															selected={selectedTable === tableName}
															onClick={() => setSelectedTable(tableName)}
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
																		{tableName}
																	</Typography>
																}
																secondary={
																	<Stack
																		direction="row"
																		spacing={1}
																		sx={{ mt: 0.5 }}
																	>
																		<Chip
																			label={`${tables[tableName].data.length} rows`}
																			size="small"
																			variant="outlined"
																			color="primary"
																		/>
																		<Chip
																			label={`${tables[tableName].columns.length} cols`}
																			size="small"
																			variant="outlined"
																			color="success"
																		/>
																		{tables[tableName].foreignKeys?.length >
																			0 && (
																			<Chip
																				label={`${tables[tableName].foreignKeys.length} FK`}
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

									{/* Main Content */}
									<Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
										{selectedTable ? (
											<TableView
												table={tables[selectedTable]}
												tableName={selectedTable}
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
														Select a table to explore
													</Typography>
													<Typography variant="body1" color="text.secondary">
														Choose a table from the sidebar to view its detailed
														schema, constraints, and data preview
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
											nodeColor={(node) =>
												node.selected ? "#1976d2" : "#64748b"
											}
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
					</>
				)}

				{!connected && (
					<Container maxWidth="md">
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								minHeight: "60vh",
								textAlign: "center",
							}}
						>
							<Avatar
								sx={{
									width: 120,
									height: 120,
									mb: 4,
									bgcolor: "primary.50",
									color: "primary.main",
								}}
							>
								<DatabaseIcon sx={{ fontSize: 60 }} />
							</Avatar>
							<Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
								Connect to your SQLite database
							</Typography>
							<Typography
								variant="h6"
								color="text.secondary"
								sx={{ mb: 4, maxWidth: 600 }}
							>
								Click the connect button to load a sample database with tables,
								relationships, and data to explore the full functionality
							</Typography>
						</Box>
					</Container>
				)}
			</Box>
		</ThemeProvider>
	);
};

export default SQLiteViewer;
