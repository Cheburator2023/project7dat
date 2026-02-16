import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	Box,
	TextField,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Chip,
	Typography,
	Stack,
	Select,
	MenuItem,
	FormControl,
	InputAdornment,
	IconButton,
	Paper,
	TableContainer,
} from "@mui/material";
import {
	Close as CloseIcon,
	Search as SearchIcon,
	Key as KeyIcon,
	Link as LinkIcon,
	OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { ModelObject, ObjectConnection } from "../organisms/ModelGraphWindow";

interface ObjectDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	object: ModelObject;
	connections: ObjectConnection[];
	onExpandNode?: (nodeId: string) => void;
}

type ViewMode = "attributes" | "connections";

export const ObjectDetailsDialog = ({
	open,
	onClose,
	object,
	connections,
	onExpandNode,
}: ObjectDetailsDialogProps) => {
	const [viewMode, setViewMode] = useState<ViewMode>("attributes");
	const [searchTerm, setSearchTerm] = useState("");

	const filteredAttributes = object.attributes.filter(
		(attr) =>
			attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attr.description.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const filteredConnections = connections.filter(
		(conn) =>
			conn.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conn.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conn.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(conn.processCode || "").toLowerCase().includes(searchTerm.toLowerCase()),
	);

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
				return "Объект";
		}
	};

	const getConnectionDirection = (connection: ObjectConnection) => {
		if (connection.sourceId === object.id) {
			return `${object.name} → ${connection.targetName}`;
		} else {
			return `${connection.sourceName} → ${object.name}`;
		}
	};

	return (
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
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Box display="flex" alignItems="center" gap={2}>
						<Chip
							label={getTypeLabel(object.type)}
							color={
								object.type === "model"
									? "primary"
									: object.type === "vector"
										? "secondary"
										: object.type === "datamart"
											? "success"
											: "warning"
							}
							size="small"
						/>
						<Typography variant="h6">Признаки {object.name}</Typography>
					</Box>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={3}>
					{/* Описание объекта */}
					<Paper sx={{ p: 2, bgcolor: "grey.50" }}>
						<Typography variant="body2" color="text.secondary">
							{object.description}
						</Typography>
					</Paper>

					{/* Переключатель режима просмотра */}
					<Box display="flex" alignItems="center" gap={2}>
						<Typography variant="body2" fontWeight="medium">
							Отображение:
						</Typography>
						<FormControl size="small" sx={{ minWidth: 200 }}>
							<Select
								value={viewMode}
								onChange={(e) => setViewMode(e.target.value as ViewMode)}
								displayEmpty
							>
								<MenuItem value="attributes">Атрибуты</MenuItem>
								<MenuItem value="connections">Связи</MenuItem>
							</Select>
						</FormControl>
					</Box>

					{/* Поиск */}
					<TextField
						placeholder={
							viewMode === "attributes" ? "Поиск атрибута..." : "Поиск связи..."
						}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						size="small"
						fullWidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
					/>

					{/* Содержимое в зависимости от режима */}
					<Box sx={{ maxHeight: 400, overflow: "auto" }}>
						{viewMode === "attributes" ? (
							<TableContainer component={Paper}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell width="30px" />
											<TableCell>Наименование</TableCell>
											<TableCell>Тип</TableCell>
											<TableCell>Описание</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{filteredAttributes.map((attr) => (
											<TableRow key={attr.id}>
												<TableCell>
													{attr.isKey && (
														<KeyIcon
															sx={{ fontSize: 14, color: "warning.main" }}
														/>
													)}
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														fontWeight={attr.isKey ? "bold" : "normal"}
													>
														{attr.name}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={attr.type}
														variant="outlined"
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Typography variant="body2" color="text.secondary">
														{attr.description}
													</Typography>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<TableContainer component={Paper}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell width="30px" />
											<TableCell>Связанные объекты</TableCell>
											<TableCell>Процесс</TableCell>
											<TableCell>Описание связи</TableCell>
											<TableCell>Маппингов</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{filteredConnections.map((conn) => (
											<TableRow
												key={conn.id}
												sx={{
													cursor: "pointer",
													"&:hover": { bgcolor: "grey.50" },
												}}
												title="Дважды кликните для просмотра деталей связи"
											>
												<TableCell>
													<LinkIcon
														sx={{ fontSize: 14, color: "primary.main" }}
													/>
												</TableCell>
												<TableCell>
													<Box display="flex" alignItems="center" gap={1}>
														<Typography variant="body2" fontWeight="medium">
															{getConnectionDirection(conn)}
														</Typography>
														{onExpandNode && (
															<IconButton
																size="small"
																onClick={() => {
																	const relatedNodeId =
																		conn.sourceId === object.id
																			? conn.targetId
																			: conn.sourceId;
																	onExpandNode(relatedNodeId);
																}}
																title="Развернуть связанный объект на графе"
																sx={{ ml: 1 }}
															>
																<OpenInNewIcon fontSize="small" />
															</IconButton>
														)}
													</Box>
												</TableCell>
												<TableCell>
													<Box
														sx={{
															display: "flex",
															flexDirection: "column",
															gap: 0.5,
														}}
													>
														<Chip
															label={conn.processName}
															size="small"
															color="secondary"
															variant="filled"
															sx={{ width: "fit-content", maxWidth: "100%" }}
														/>
														{conn.processCode ? (
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{conn.processCode}
															</Typography>
														) : null}
													</Box>
												</TableCell>
												<TableCell>
													<Typography variant="body2" color="text.secondary">
														{conn.description}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={conn.mappings.length}
														variant="outlined"
														size="small"
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}

						{/* Сообщение о пустом результате */}
						{((viewMode === "attributes" && filteredAttributes.length === 0) ||
							(viewMode === "connections" &&
								filteredConnections.length === 0)) && (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography color="text.secondary">
									{viewMode === "attributes"
										? "Атрибуты не найдены"
										: "Связи не найдены"}
								</Typography>
							</Box>
						)}
					</Box>

					{/* Статистика */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							pt: 2,
						}}
					>
						{viewMode === "connections" && filteredConnections.length > 0 && (
							<Typography variant="caption" color="text.secondary">
								Дважды кликните по связи для просмотра деталей
							</Typography>
						)}
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};
