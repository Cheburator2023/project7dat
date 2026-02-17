import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
	Tooltip,
} from "@mui/material";
import {
	Close as CloseIcon,
	Search as SearchIcon,
	OpenInNew as OpenInNewIcon,
	Link as LinkIcon,
	Storage as StorageIcon,
	TableChart as TableChartIcon,
	ViewModule as ViewModuleIcon,
	HelpOutline as HelpOutlineIcon,
	Home as HomeIcon,
} from "@mui/icons-material";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useEntitiesStore } from "@react-client/features/entities/stores";

interface EntityConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	processName: string;
	processId?: number | null;
	processCode?: string;
	attrMaps: Array<{ src: string; dst: string }>;
	description: string;
}

interface EntityDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	entity: DataLineageEntity;
	connections: EntityConnection[];
	onOpenEntity?: (entityId: string) => void;
	onOpenConnection?: (connection: EntityConnection) => void;
}

type ViewMode = "attributes" | "connections";

const TYPE_LABELS: Record<string, string> = {
	table: "Таблица",
	view: "Представление",
	rdd: "RDD",
	unresolved: "Неизвестно",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
	table: <TableChartIcon />,
	view: <ViewModuleIcon />,
	rdd: <StorageIcon />,
	unresolved: <HelpOutlineIcon />,
};

export const EntityDetailsDialog = ({
	open,
	onClose,
	entity,
	connections,
	onOpenEntity,
	onOpenConnection,
}: EntityDetailsDialogProps) => {
	const navigate = useNavigate();
	const {
		setZoomToNode,
		selectEntity,
		selectEntityWithAttribute,
		setHighlightedMapping,
	} = useEntitiesStore();
	const [viewMode, setViewMode] = useState<ViewMode>("attributes");
	const [searchTerm, setSearchTerm] = useState("");

	// Navigate to dashboard with attribute highlight
	const handleOpenAttrInDashboard = useCallback(
		(attrName: string) => {
			selectEntityWithAttribute(entity.id, attrName);
			setZoomToNode(entity.id);
			onClose();
			navigate("/");
		},
		[entity.id, navigate, selectEntityWithAttribute, setZoomToNode, onClose],
	);

	// Navigate to dashboard with mapping highlight
	const handleOpenMappingInDashboard = useCallback(
		(
			sourceEntityId: string,
			targetEntityId: string,
			sourceAttr?: string,
			targetAttr?: string,
		) => {
			setHighlightedMapping({
				sourceEntityId,
				targetEntityId,
				sourceAttr,
				targetAttr,
			});
			selectEntity(targetEntityId);
			setZoomToNode(targetEntityId);
			onClose();
			navigate("/");
		},
		[navigate, selectEntity, setZoomToNode, setHighlightedMapping, onClose],
	);

	const attributes = entity.attrSeq || [];

	const filteredAttributes = attributes.filter(
		(attr) =>
			attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(attr.comment || "").toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const filteredConnections = connections.filter(
		(conn) =>
			conn.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conn.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conn.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(conn.processCode || "").toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const getConnectionDirection = (connection: EntityConnection) => {
		if (connection.sourceId === entity.id) {
			return `${entity.name || entity.id} → ${connection.targetName}`;
		} else {
			return `${connection.sourceName} → ${entity.name || entity.id}`;
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					maxHeight: "85vh",
					borderRadius: 2,
				},
			}}
		>
			{/* Заголовок диалога */}
			<DialogTitle
				sx={{
					background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
					color: "white",
					py: 2.5,
					px: 3,
				}}
			>
				<Box
					display="flex"
					justifyContent="space-between"
					alignItems="flex-start"
				>
					<Box display="flex" alignItems="center" gap={2}>
						<Box
							sx={{
								bgcolor: "rgba(255,255,255,0.2)",
								borderRadius: 1.5,
								p: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{TYPE_ICONS[entity.type] || <StorageIcon />}
						</Box>
						<Box>
							<Typography
								variant="overline"
								sx={{ opacity: 0.9, letterSpacing: 1 }}
							>
								{TYPE_LABELS[entity.type] || entity.type}
							</Typography>
							<Typography variant="h5" fontWeight={600}>
								{entity.name || entity.id}
							</Typography>
							{entity.namespace && (
								<Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
									{entity.namespace}
								</Typography>
							)}
						</Box>
					</Box>
					<Box display="flex" alignItems="center" gap={1}>
						{entity.modified && (
							<Chip
								label="Изменено"
								size="small"
								sx={{
									bgcolor: "rgba(255,152,0,0.9)",
									color: "white",
									fontWeight: 500,
								}}
							/>
						)}
						<IconButton
							onClick={onClose}
							size="small"
							sx={{
								color: "white",
								"&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
							}}
						>
							<CloseIcon />
						</IconButton>
					</Box>
				</Box>
			</DialogTitle>
			<DialogContent sx={{ p: 3 }}>
				<Stack spacing={3}>
					{/* Информационная карточка */}
					<Spacer />
					<Paper elevation={0}>
						<Typography
							variant="overline"
							color="text.secondary"
							sx={{ mb: 1.5, display: "block", fontWeight: 600 }}
						>
							Информация о сущности
						</Typography>
						<Box
							display="grid"
							gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
							gap={2.5}
						>
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={500}
								>
									Идентификатор
								</Typography>
								<Typography
									variant="body2"
									fontFamily="monospace"
									fontSize={12}
									sx={{
										bgcolor: "grey.100",
										px: 1,
										py: 0.5,
										borderRadius: 1,
										mt: 0.5,
										wordBreak: "break-all",
									}}
								>
									{entity.id}
								</Typography>
							</Box>
						</Box>
						{entity.description && (
							<Box mt={2.5} pt={2} borderTop="1px solid" borderColor="grey.200">
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={500}
								>
									Описание
								</Typography>
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									{entity.description}
								</Typography>
							</Box>
						)}
					</Paper>

					{/* Панель управления */}
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						flexWrap="wrap"
						gap={2}
					>
						<FormControl size="small" sx={{ minWidth: 180 }}>
							<Select
								value={viewMode}
								onChange={(e) => setViewMode(e.target.value as ViewMode)}
								sx={{
									bgcolor: "white",
									"& .MuiSelect-select": { py: 1 },
								}}
							>
								<MenuItem value="attributes">
									<Box display="flex" alignItems="center" gap={1}>
										<TableChartIcon fontSize="small" color="action" />
										Атрибуты ({attributes.length})
									</Box>
								</MenuItem>
								<MenuItem value="connections">
									<Box display="flex" alignItems="center" gap={1}>
										<LinkIcon fontSize="small" color="action" />
										Связи ({connections.length})
									</Box>
								</MenuItem>
							</Select>
						</FormControl>

						<TextField
							placeholder={
								viewMode === "attributes"
									? "Поиск атрибута..."
									: "Поиск связи..."
							}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							size="small"
							sx={{
								minWidth: 250,
								bgcolor: "white",
								"& .MuiOutlinedInput-root": { borderRadius: 2 },
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" color="action" />
									</InputAdornment>
								),
							}}
						/>
					</Box>

					{/* Содержимое в зависимости от режима */}
					<Paper
						elevation={0}
						sx={{
							border: "1px solid",
							borderColor: "grey.200",
							borderRadius: 2,
							overflow: "hidden",
						}}
					>
						<Box sx={{ maxHeight: 350, overflow: "auto" }}>
							{viewMode === "attributes" ? (
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											>
												Наименование
											</TableCell>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
													width: 150,
												}}
											>
												Тип
											</TableCell>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											>
												Комментарий
											</TableCell>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
													width: 60,
												}}
											/>
										</TableRow>
									</TableHead>
									<TableBody>
										{filteredAttributes.map((attr, idx) => (
											<TableRow
												key={attr.name}
												sx={{
													bgcolor: idx % 2 === 0 ? "white" : "grey.50",
													"&:hover": { bgcolor: "action.hover" },
												}}
											>
												<TableCell>
													<Typography
														variant="body2"
														fontWeight={500}
														fontFamily="monospace"
														fontSize={13}
													>
														{attr.name}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={attr.type}
														size="small"
														sx={{
															bgcolor: "primary.50",
															color: "primary.700",
															fontWeight: 500,
															fontSize: 11,
														}}
													/>
												</TableCell>
												<TableCell>
													<Typography variant="body2" color="text.secondary">
														{attr.comment || "—"}
													</Typography>
												</TableCell>
												<TableCell>
													<Tooltip title="Показать в Dashboard">
														<IconButton
															size="small"
															color="secondary"
															onClick={() =>
																handleOpenAttrInDashboard(attr.name)
															}
														>
															<HomeIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell
												width="40px"
												sx={{
													bgcolor: "grey.100",
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											/>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											>
												Связь
											</TableCell>
											<TableCell
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
													minWidth: 220,
												}}
											>
												Процесс
											</TableCell>
											<TableCell
												width={100}
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											>
												Маппингов
											</TableCell>
											<TableCell
												width={80}
												sx={{
													bgcolor: "grey.100",
													fontWeight: 600,
													borderBottom: "2px solid",
													borderBottomColor: "grey.300",
												}}
											>
												Действия
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{filteredConnections.map((conn, idx) => (
											<TableRow
												key={conn.id}
												sx={{
													bgcolor: idx % 2 === 0 ? "white" : "grey.50",
													cursor: "pointer",
													"&:hover": { bgcolor: "primary.50" },
													transition: "background-color 0.15s",
												}}
												onClick={() => onOpenConnection?.(conn)}
											>
												<TableCell>
													<LinkIcon
														sx={{ fontSize: 18, color: "primary.main" }}
													/>
												</TableCell>
												<TableCell>
													<Typography variant="body2" fontWeight={500}>
														{getConnectionDirection(conn)}
													</Typography>
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
													<Chip
														label={conn.attrMaps.length}
														size="small"
														color="primary"
														variant="outlined"
													/>
												</TableCell>
												<TableCell>
													<Box sx={{ display: "flex", gap: 0.5 }}>
														<Tooltip title="Открыть связанную сущность">
															<IconButton
																size="small"
																color="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	const relatedId =
																		conn.sourceId === entity.id
																			? conn.targetId
																			: conn.sourceId;
																	onOpenEntity?.(relatedId);
																}}
															>
																<OpenInNewIcon fontSize="small" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Показать маппинг в Dashboard">
															<IconButton
																size="small"
																color="secondary"
																onClick={(e) => {
																	e.stopPropagation();
																	handleOpenMappingInDashboard(
																		conn.sourceId,
																		conn.targetId,
																	);
																}}
															>
																<HomeIcon fontSize="small" />
															</IconButton>
														</Tooltip>
													</Box>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</Box>
					</Paper>

					{/* Сообщение о пустом результате */}
					{((viewMode === "attributes" && filteredAttributes.length === 0) ||
						(viewMode === "connections" &&
							filteredConnections.length === 0)) && (
						<Paper
							elevation={0}
							sx={{
								p: 4,
								textAlign: "center",
								bgcolor: "grey.50",
								borderRadius: 2,
							}}
						>
							<Typography color="text.secondary">
								{viewMode === "attributes"
									? "Атрибуты не найдены"
									: "Связи не найдены"}
							</Typography>
						</Paper>
					)}

					{/* Статистика */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							pt: 2,
							mt: 1,
							borderTop: 1,
							borderColor: "divider",
						}}
					>
						{viewMode === "connections" && filteredConnections.length > 0 && (
							<Typography variant="caption" color="text.secondary">
								Кликните по связи для просмотра маппинга
							</Typography>
						)}
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};
