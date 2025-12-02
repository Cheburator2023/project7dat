import { useState } from "react";
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
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	Paper,
	TableContainer,
	IconButton,
} from "@mui/material";
import {
	Close as CloseIcon,
	ArrowForward as ArrowRightIcon,
	Code as Code2Icon,
	Shuffle as ShuffleIcon,
} from "@mui/icons-material";
import { ObjectConnection } from "../organisms/ModelGraphWindow";

interface ConnectionDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	connection: ObjectConnection;
}

type ViewMode = "mapping" | "functions";

export const ConnectionDetailsDialog = ({
	open,
	onClose,
	connection,
}: ConnectionDetailsDialogProps) => {
	const [viewMode, setViewMode] = useState<ViewMode>("mapping");

	const hasFunctions = connection.functions && connection.functions.length > 0;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: { minHeight: "600px" },
			}}
		>
			<DialogTitle>
				<Box display="flex" alignItems="center" gap={1.5}>
					<ArrowRightIcon sx={{ color: "primary.main" }} />
					<Typography variant="h6">
						Связь {connection.sourceName} → {connection.targetName}
					</Typography>
					<IconButton
						onClick={onClose}
						sx={{ position: "absolute", right: 8, top: 8 }}
					>
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent>
				<Stack spacing={4}>
					{/* Описание связи */}
					<Paper sx={{ p: 3, bgcolor: "grey.50" }}>
						<Typography variant="body2" color="text.secondary">
							{connection.description}
						</Typography>
					</Paper>

					{/* Информация об объектах */}
					<Box display="flex" gap={4} p={3} bgcolor="grey.100" borderRadius={1}>
						<Box flex={1}>
							<Typography
								variant="body2"
								fontWeight="medium"
								color="text.secondary"
							>
								Источник:
							</Typography>
							<Typography fontWeight="bold">{connection.sourceName}</Typography>
						</Box>
						<Box flex={1}>
							<Typography
								variant="body2"
								fontWeight="medium"
								color="text.secondary"
							>
								Цель:
							</Typography>
							<Typography fontWeight="bold">{connection.targetName}</Typography>
						</Box>
					</Box>

					{/* Переключатель режима просмотра (только если есть функции) */}
					{hasFunctions && (
						<Box display="flex" alignItems="center" gap={3}>
							<Typography variant="body2" fontWeight="medium">
								Отображение:
							</Typography>
							<FormControl size="small" sx={{ minWidth: 200 }}>
								<InputLabel>Режим</InputLabel>
								<Select
									value={viewMode}
									onChange={(e) => setViewMode(e.target.value as ViewMode)}
									label="Режим"
								>
									<MenuItem value="mapping">Маппинг</MenuItem>
									<MenuItem value="functions">Функции атрибутов</MenuItem>
								</Select>
							</FormControl>
						</Box>
					)}

					{/* Содержимое в зависимости от режима */}
					<Box maxHeight="400px" overflow="auto">
						{viewMode === "mapping" ? (
							<>
								<Box display="flex" alignItems="center" gap={2} mb={3}>
									<ShuffleIcon sx={{ color: "primary.main", fontSize: 16 }} />
									<Typography fontWeight="medium">Маппинг атрибутов</Typography>
									<Chip
										label={connection.mappings.length}
										variant="outlined"
										size="small"
									/>
								</Box>

								{connection.mappings.length > 0 ? (
									<TableContainer component={Paper}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Атрибут источника</TableCell>
													<TableCell>Описание источника</TableCell>
													<TableCell width="30px" />
													<TableCell>Атрибут цели</TableCell>
													<TableCell>Описание цели</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{connection.mappings.map((mapping) => (
													<TableRow key={mapping.id}>
														<TableCell>
															<Typography fontWeight="medium">
																{mapping.sourceAttribute}
															</Typography>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{mapping.sourceDescription}
															</Typography>
														</TableCell>
														<TableCell align="center">
															<ArrowRightIcon
																sx={{ color: "primary.main", fontSize: 14 }}
															/>
														</TableCell>
														<TableCell>
															<Typography fontWeight="medium">
																{mapping.targetAttribute}
															</Typography>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{mapping.targetDescription}
															</Typography>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								) : (
									<Box textAlign="center" py={8}>
										<Typography color="text.secondary">
											Маппинг атрибутов не определен
										</Typography>
									</Box>
								)}
							</>
						) : (
							<>
								<Box display="flex" alignItems="center" gap={2} mb={3}>
									<Code2Icon sx={{ color: "secondary.main", fontSize: 16 }} />
									<Typography fontWeight="medium">Функции атрибутов</Typography>
									<Chip
										label={connection.functions?.length || 0}
										variant="outlined"
										size="small"
									/>
								</Box>

								{connection.functions && connection.functions.length > 0 ? (
									<TableContainer component={Paper}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Атрибут</TableCell>
													<TableCell>Функция</TableCell>
													<TableCell>Описание</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{connection.functions.map((func) => (
													<TableRow key={func.id}>
														<TableCell>
															<Typography fontWeight="medium">
																{func.attribute}
															</Typography>
														</TableCell>
														<TableCell>
															<Chip
																label={func.function}
																color="secondary"
																variant="outlined"
																size="small"
															/>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{func.description}
															</Typography>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								) : (
									<Box textAlign="center" py={8}>
										<Typography color="text.secondary">
											Функции атрибутов не определены
										</Typography>
									</Box>
								)}
							</>
						)}
					</Box>

					{/* Статистика */}
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						pt={2}
						borderTop="1px solid"
						borderColor="divider"
					>
						<Typography variant="body2" color="text.secondary">
							{viewMode === "mapping"
								? `Маппингов: ${connection.mappings.length}`
								: `Функций: ${connection.functions?.length || 0}`}
						</Typography>
						{viewMode === "mapping" && connection.mappings.length > 0 && (
							<Typography variant="caption" color="text.secondary">
								Прямое соответствие атрибутов
							</Typography>
						)}
						{viewMode === "functions" &&
							connection.functions &&
							connection.functions.length > 0 && (
								<Typography variant="caption" color="text.secondary">
									Трансформации данных
								</Typography>
							)}
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};
