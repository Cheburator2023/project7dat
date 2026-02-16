import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	Box,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	Stack,
	Chip,
	Paper,
	IconButton,
	Alert,
} from "@mui/material";
import {
	Close as CloseIcon,
	ArrowForward as ArrowRightIcon,
	Shuffle as ShuffleIcon,
	AccountTree as AccountTreeIcon,
	Home as HomeIcon,
	OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useDashboardStore } from "@react-client/features/dashboard/stores";
import type { EntityConnection } from "@react-client/features/dashboard/types";

interface MappingDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	connection: EntityConnection;
	selectedAttribute?: {
		entityId: string;
		attrName: string;
	} | null;
}

export const MappingDetailsDialog = ({
	open,
	onClose,
	connection,
}: MappingDetailsDialogProps) => {
	const normalizedProcessName =
		connection.processName &&
		connection.processName.trim() &&
		connection.processName !== "Процесс #undefined"
			? connection.processName
			: "Процесс не указан";

	const navigate = useNavigate();
	const {
		setZoomToNode,
		selectEntity,
		selectEntityWithAttribute,
		setHighlightedMapping,
	} = useDashboardStore();

	// Navigate to entity page with attribute highlight
	const handleGoToEntityPage = useCallback(
		(entityId: string, attrName?: string) => {
			const encodedId = encodeURIComponent(entityId);
			const url = attrName
				? `/entity/${encodedId}?highlightAttr=${encodeURIComponent(attrName)}`
				: `/entity/${encodedId}`;
			onClose();
			navigate(url);
		},
		[navigate, onClose],
	);

	// Navigate to Dashboard with attribute highlight
	const handleGoToDashboard = useCallback(
		(entityId: string, attrName?: string) => {
			if (attrName) {
				selectEntityWithAttribute(entityId, attrName);
			} else {
				selectEntity(entityId);
			}
			setZoomToNode(entityId);
			onClose();
			navigate("/");
		},
		[navigate, onClose, selectEntity, selectEntityWithAttribute, setZoomToNode],
	);

	// Navigate to Dashboard with mapping highlight
	const handleGoToDashboardWithMapping = useCallback(
		(sourceAttr: string, targetAttr: string) => {
			setHighlightedMapping({
				sourceEntityId: connection.sourceId,
				targetEntityId: connection.targetId,
				sourceAttr,
				targetAttr,
			});
			selectEntity(connection.targetId);
			setZoomToNode(connection.targetId);
			onClose();
			navigate("/");
		},
		[
			navigate,
			onClose,
			connection,
			selectEntity,
			setZoomToNode,
			setHighlightedMapping,
		],
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					maxHeight: "80vh",
					borderRadius: 2,
				},
			}}
		>
			{/* Заголовок диалога */}
			<DialogTitle
				sx={{
					background: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)",
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
							<AccountTreeIcon />
						</Box>
						<Box>
							<Typography
								variant="overline"
								sx={{ opacity: 0.9, letterSpacing: 1 }}
							>
								{connection.description || "Маппинг данных"}
							</Typography>
							<Typography variant="h6" fontWeight={600}>
								{connection.sourceName} → {connection.targetName}
							</Typography>
							<Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
								<Chip
									label={normalizedProcessName}
									size="small"
									color="secondary"
									variant="filled"
								/>
								{connection.processCode ? (
									<Chip
										label={`Система: ${connection.processCode}`}
										size="small"
										variant="outlined"
									/>
								) : null}
							</Box>
						</Box>
					</Box>
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
			</DialogTitle>

			<DialogContent sx={{ p: 3 }}>
				<Stack spacing={3} padding={"10px 0"}>
					<Alert severity="info" variant="outlined">
						Связь относится к процессу <strong>{normalizedProcessName}</strong>
						{connection.processCode
							? ` (система: ${connection.processCode})`
							: ""}
						.
					</Alert>
					{/* Информация о связи */}

					<Paper elevation={0}>
						<Box
							sx={{
								px: 2,
								py: 1.5,
								bgcolor: "grey.100",
								borderBottom: "1px solid",
								borderBottomColor: "grey.200",
							}}
						>
							<Typography
								variant="overline"
								fontWeight={600}
								color="text.secondary"
							>
								Направление связи
							</Typography>
						</Box>
						<Box display="flex" alignItems="stretch">
							{/* Источник */}
							<Box flex={1} p={2.5}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Typography
										variant="caption"
										color="success.main"
										fontWeight={600}
										sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
									>
										Источник
									</Typography>
									<Box sx={{ display: "flex", gap: 0.5 }}>
										<IconButton
											size="small"
											title="Открыть страницу"
											onClick={() => handleGoToEntityPage(connection.sourceId)}
										>
											<OpenInNewIcon fontSize="small" />
										</IconButton>
										<IconButton
											size="small"
											title="Показать в Dashboard"
											onClick={() => handleGoToDashboard(connection.sourceId)}
										>
											<HomeIcon fontSize="small" />
										</IconButton>
									</Box>
								</Box>
								<Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
									{connection.sourceName}
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									fontFamily="monospace"
									sx={{
										display: "block",
										mt: 1,
										bgcolor: "grey.100",
										px: 1,
										py: 0.5,
										borderRadius: 1,
										wordBreak: "break-all",
									}}
								>
									{connection.sourceId}
								</Typography>
							</Box>

							{/* Стрелка */}
							<Box
								display="flex"
								alignItems="center"
								justifyContent="center"
								sx={{
									px: 2,
									bgcolor: "primary.50",
								}}
							>
								<ArrowRightIcon sx={{ color: "primary.main", fontSize: 28 }} />
							</Box>

							{/* Цель */}
							<Box flex={1} p={2.5}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Typography
										variant="caption"
										color="primary.main"
										fontWeight={600}
										sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
									>
										Цель
									</Typography>
									<Box sx={{ display: "flex", gap: 0.5 }}>
										<IconButton
											size="small"
											title="Открыть страницу"
											onClick={() => handleGoToEntityPage(connection.targetId)}
										>
											<OpenInNewIcon fontSize="small" />
										</IconButton>
										<IconButton
											size="small"
											title="Показать в Dashboard"
											onClick={() => handleGoToDashboard(connection.targetId)}
										>
											<HomeIcon fontSize="small" />
										</IconButton>
									</Box>
								</Box>
								<Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
									{connection.targetName}
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									fontFamily="monospace"
									sx={{
										display: "block",
										mt: 1,
										bgcolor: "grey.100",
										px: 1,
										py: 0.5,
										borderRadius: 1,
										wordBreak: "break-all",
									}}
								>
									{connection.targetId}
								</Typography>
							</Box>
						</Box>
					</Paper>

					{/* Таблица маппинга */}
					<Box>
						<Box display="flex" alignItems="center" gap={1.5} mb={2}>
							<ShuffleIcon sx={{ color: "primary.main", fontSize: 20 }} />
							<Typography variant="subtitle1" fontWeight={600}>
								Соответствие атрибутов
							</Typography>
							<Chip
								label={`${connection.attrMaps.length} маппингов`}
								size="small"
								color="primary"
								sx={{ fontWeight: 500 }}
							/>
						</Box>

						{connection.attrMaps.length > 0 ? (
							<Paper
								elevation={0}
								sx={{
									border: "1px solid",
									borderColor: "grey.200",
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<Box sx={{ maxHeight: 280, overflow: "auto" }}>
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
													Атрибут источника
												</TableCell>
												<TableCell
													width="60px"
													align="center"
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
													Атрибут цели
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{connection.attrMaps.map((mapping, index) => (
												<TableRow
													key={`${mapping.src}-${mapping.dst}-${index}`}
													sx={{
														bgcolor: index % 2 === 0 ? "white" : "grey.50",
														"&:hover": { bgcolor: "action.hover" },
													}}
												>
													<TableCell>
														<Chip
															label={mapping.src}
															size="small"
															clickable
															title="Клик - страница, Shift - Dashboard"
															onClick={(e) => {
																if (e.shiftKey) {
																	handleGoToDashboard(
																		connection.sourceId,
																		mapping.src,
																	);
																} else {
																	handleGoToEntityPage(
																		connection.sourceId,
																		mapping.src,
																	);
																}
															}}
															sx={{
																bgcolor: "success.50",
																color: "success.700",
																fontFamily: "monospace",
																fontWeight: 500,
																cursor: "pointer",
															}}
														/>
													</TableCell>
													<TableCell align="center">
														<IconButton
															size="small"
															title="Показать маппинг в Dashboard"
															onClick={() =>
																handleGoToDashboardWithMapping(
																	mapping.src,
																	mapping.dst,
																)
															}
														>
															<HomeIcon
																fontSize="small"
																sx={{ color: "primary.main" }}
															/>
														</IconButton>
													</TableCell>
													<TableCell>
														<Chip
															label={mapping.dst}
															size="small"
															clickable
															title="Клик - страница, Shift - Dashboard"
															onClick={(e) => {
																if (e.shiftKey) {
																	handleGoToDashboard(
																		connection.targetId,
																		mapping.dst,
																	);
																} else {
																	handleGoToEntityPage(
																		connection.targetId,
																		mapping.dst,
																	);
																}
															}}
															sx={{
																bgcolor: "primary.50",
																color: "primary.700",
																fontFamily: "monospace",
																fontWeight: 500,
																cursor: "pointer",
															}}
														/>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</Box>
							</Paper>
						) : (
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
									Маппинг атрибутов не определен
								</Typography>
							</Paper>
						)}
					</Box>

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
						<Typography variant="body2" color="text.secondary">
							Всего маппингов: {connection.attrMaps.length}
						</Typography>
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};
