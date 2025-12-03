import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	Button,
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
} from "@mui/material";
import {
	Close as CloseIcon,
	ArrowForward as ArrowRightIcon,
	Shuffle as ShuffleIcon,
	AccountTree as AccountTreeIcon,
} from "@mui/icons-material";
import { Spacer } from "@react-client/common/primitives/Spacer";

interface EntityConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	attrMaps: Array<{ src: string; dst: string }>;
	description?: string;
}

interface MappingDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	connection: EntityConnection;
}

export const MappingDetailsDialog = ({
	open,
	onClose,
	connection,
}: MappingDetailsDialogProps) => {
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
				<Stack spacing={3}>
					{/* Информация о связи */}
					<Spacer />
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
								<Typography
									variant="caption"
									color="success.main"
									fontWeight={600}
									sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
								>
									Источник
								</Typography>
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
								<Typography
									variant="caption"
									color="primary.main"
									fontWeight={600}
									sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
								>
									Цель
								</Typography>
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
															sx={{
																bgcolor: "success.50",
																color: "success.700",
																fontFamily: "monospace",
																fontWeight: 500,
															}}
														/>
													</TableCell>
													<TableCell align="center">
														<ArrowRightIcon
															sx={{ color: "primary.main", fontSize: 18 }}
														/>
													</TableCell>
													<TableCell>
														<Chip
															label={mapping.dst}
															size="small"
															sx={{
																bgcolor: "primary.50",
																color: "primary.700",
																fontFamily: "monospace",
																fontWeight: 500,
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
