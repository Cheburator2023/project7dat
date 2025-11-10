import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Typography,
	Stack,
	Breadcrumbs,
	Link,
	CircularProgress,
	Alert,
	Chip,
	Divider,
} from "@mui/material";
import { ArrowBack, Home } from "@mui/icons-material";
import { useProcessesStore } from "@react-client/stores/processesStore";
import { DataLineageGraph } from "@react-client/organisms/DataLineageGraph";
import type { DataLineageEntity } from "@react-client/types/dataLineage";

export const ProcessGraphPage = () => {
	const { processId } = useParams<{ processId: string }>();
	const navigate = useNavigate();
	const { processes, isLoading, loadProcesses } = useProcessesStore();
	const [selectedEntity, setSelectedEntity] =
		useState<DataLineageEntity | null>(null);

	const process = processes.find((p) => p.id === processId);

	useEffect(() => {
		if (processes.length === 0) {
			loadProcesses();
		}
	}, [processes.length, loadProcesses]);

	const handleBack = () => {
		navigate("/processes");
	};

	const handleHome = () => {
		navigate("/");
	};

	if (isLoading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!process) {
		return (
			<Box p={4}>
				<Alert severity="error">Процесс с ID "{processId}" не найден</Alert>
			</Box>
		);
	}

	return (
		<Box p={3}>
			<Stack spacing={3}>
				{/* Хлебные крошки */}
				<Breadcrumbs aria-label="breadcrumb">
					<Link
						underline="hover"
						color="inherit"
						onClick={handleHome}
						sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
					>
						<Home sx={{ mr: 0.5 }} fontSize="inherit" />
						Главная
					</Link>
					<Link
						underline="hover"
						color="inherit"
						onClick={handleBack}
						sx={{ cursor: "pointer" }}
					>
						Процессы
					</Link>
					<Typography color="text.primary">{process.name}</Typography>
				</Breadcrumbs>

				{/* Кнопка назад */}
				<Box>
					<Button
						variant="outlined"
						startIcon={<ArrowBack />}
						onClick={handleBack}
					>
						Назад к списку процессов
					</Button>
				</Box>

				{/* Информация о процессе */}
				<Card>
					<CardHeader
						title={
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="h5" component="h1">
									{process.name}
								</Typography>
								<Chip
									label={process.type}
									color="primary"
									variant="outlined"
									size="small"
								/>
							</Stack>
						}
						subheader={
							<Stack spacing={1}>
								<Typography variant="body2" color="text.secondary">
									{process.description}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Дата создания:{" "}
									{new Date(process.createdAt).toLocaleDateString("ru-RU")}
								</Typography>
							</Stack>
						}
					/>
				</Card>

				{/* Граф данных */}
				<Card>
					<CardHeader
						title="Граф объектов данных"
						subheader="Визуализация связей между объектами процесса"
					/>
					<CardContent>
						{process.dataLineage ? (
							<DataLineageGraph
								data={process.dataLineage}
								onNodeSelect={setSelectedEntity}
							/>
						) : (
							<Alert severity="info">
								Данные о линии данных для этого процесса недоступны
							</Alert>
						)}
					</CardContent>
				</Card>

				{/* Детальная информация о выбранной сущности */}
				{selectedEntity && (
					<Card>
						<CardHeader
							title="Детальная информация"
							subheader="Информация о выбранном объекте"
						/>
						<CardContent>
							<Stack spacing={2}>
								<Stack direction="row" spacing={2} alignItems="center">
									<Typography variant="h6">{selectedEntity.name}</Typography>
									<Chip
										label={selectedEntity.type}
										color="secondary"
										size="small"
									/>
								</Stack>

								<Divider />

								<Stack spacing={1}>
									<Typography variant="subtitle2" color="text.secondary">
										ID: {selectedEntity.id}
									</Typography>
									<Typography variant="subtitle2" color="text.secondary">
										Пространство имен: {selectedEntity.namespace}
									</Typography>
									{selectedEntity.modified && (
										<Chip
											label="Изменено"
											color="warning"
											size="small"
											sx={{ alignSelf: "flex-start" }}
										/>
									)}
								</Stack>

								{selectedEntity.attrSeq &&
									selectedEntity.attrSeq.length > 0 && (
										<>
											<Divider />
											<Stack spacing={1}>
												<Typography variant="subtitle1" fontWeight="bold">
													Атрибуты ({selectedEntity.attrSeq.length}):
												</Typography>
												<Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
													<Stack spacing={0.5}>
														{selectedEntity.attrSeq.map((attr, index) => (
															<Stack
																key={index}
																direction="row"
																spacing={1}
																alignItems="center"
															>
																<Typography variant="body2" fontWeight="medium">
																	{attr.name}
																</Typography>
																<Typography
																	variant="body2"
																	color="text.secondary"
																>
																	{attr.type}
																</Typography>
															</Stack>
														))}
													</Stack>
												</Box>
											</Stack>
										</>
									)}
							</Stack>
						</CardContent>
					</Card>
				)}
			</Stack>
		</Box>
	);
};
