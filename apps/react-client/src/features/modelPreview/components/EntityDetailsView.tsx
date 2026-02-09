import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { format, parseISO } from "date-fns/esm";
import {
	styled,
	Box,
	Typography,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Link,
	Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HomeIcon from "@mui/icons-material/Home";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { useDashboardStore } from "@react-client/features/dashboard/stores";

interface EntityDetailsViewProps {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
	allEntities?: DataLineageEntity[];
}

export const EntityDetailsView: React.FC<EntityDetailsViewProps> = ({
	entity,
	mappings,
	allEntities = [],
}) => {
	const navigate = useNavigate();
	const {
		setZoomToNode,
		selectEntity,
		setHighlightedMapping,
		selectEntityWithAttribute,
	} = useDashboardStore();

	const relatedMappings = useMemo(() => {
		if (!entity) return [];
		return mappings.filter(
			(mapping) =>
				mapping.entityId === entity.id ||
				mapping.deps?.some((dep) => dep.entityId === entity.id),
		);
	}, [entity, mappings]);

	// Navigate to entity page with optional attribute highlight
	const handleOpenEntityPage = useCallback(
		(entityId: string, attrName?: string) => {
			const encodedId = encodeURIComponent(entityId);
			const url = attrName
				? `/entity/${encodedId}?highlightAttr=${encodeURIComponent(attrName)}`
				: `/entity/${encodedId}`;
			navigate(url);
		},
		[navigate],
	);

	// Navigate to dashboard with entity and attribute highlight
	const handleOpenInDashboard = useCallback(
		(entityId: string, attrName?: string) => {
			if (attrName) {
				selectEntityWithAttribute(entityId, attrName);
			} else {
				selectEntity(entityId);
			}
			setZoomToNode(entityId);
			navigate("/");
		},
		[navigate, selectEntity, selectEntityWithAttribute, setZoomToNode],
	);

	// Navigate with mapping highlight
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
			navigate("/");
		},
		[navigate, selectEntity, setZoomToNode, setHighlightedMapping],
	);

	if (!entity) {
		return (
			<Container>
				<Typography variant="body1" color="text.secondary">
					Сущность не выбрана
				</Typography>
			</Container>
		);
	}

	return (
		<Container>
			<ContentContainer gap={10}>
				{/* Model Information */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>Основная информация</AccordionTitle>
					</CompactAccordionSummary>
					<CompactAccordionDetails>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableBody>
									{entity.namespace && (
										<TableRow>
											<TableCell
												component="th"
												scope="row"
												sx={{ fontWeight: 600 }}
											>
												Название
											</TableCell>
											<TableCell>{entity.namespace}</TableCell>
										</TableRow>
									)}
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Описание
										</TableCell>
										<TableCell>{entity.container_description}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Обновлена
										</TableCell>
										<TableCell>
											{entity.container_change &&
												format(
													parseISO(entity.container_change),
													"dd.MM.yyyy, HH:mm",
												)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</CompactAccordionDetails>
				</CompactAccordion>

				{/* Vector Information */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>Информация о входящем векторе</AccordionTitle>
					</CompactAccordionSummary>
					<CompactAccordionDetails>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600, width: 180 }}
										>
											ID
										</TableCell>
										<TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
											{entity.id}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Имя
										</TableCell>
										<TableCell>{entity.name || "Не указано"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Тип
										</TableCell>
										<TableCell>
											<Chip
												label={entity.type}
												size="small"
												color={
													entity.type === "table" ? "primary" : "secondary"
												}
											/>
										</TableCell>
									</TableRow>
									{entity.namespace && (
										<TableRow>
											<TableCell
												component="th"
												scope="row"
												sx={{ fontWeight: 600 }}
											>
												Пространство имен
											</TableCell>
											<TableCell>{entity.namespace}</TableCell>
										</TableRow>
									)}
									{entity.attrSeq && entity.attrSeq.length > 0 && (
										<TableRow>
											<TableCell
												component="th"
												scope="row"
												sx={{ fontWeight: 600 }}
											>
												Количество атрибутов
											</TableCell>
											<TableCell>{entity.attrSeq.length}</TableCell>
										</TableRow>
									)}
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Описание
										</TableCell>
										<TableCell>{entity.description}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Изменено
										</TableCell>
										<TableCell>
											{entity.entity_change &&
												format(
													parseISO(entity.entity_change),
													"dd.MM.yyyy, HH:mm",
												)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</CompactAccordionDetails>
				</CompactAccordion>

				{/* Related Entities */}
				{allEntities.length > 1 && (
					<CompactAccordion>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>
								Связанные сущности ({allEntities.length - 1})
							</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
								{allEntities
									.filter((ent) => ent.id !== entity.id)
									.map((ent) => (
										<Tooltip
											key={ent.id}
											title="Клик - страница, Shift+клик - Dashboard"
										>
											<Chip
												label={ent.name || ent.id}
												size="small"
												variant="outlined"
												clickable
												onClick={(e) => {
													if (e.shiftKey) {
														handleOpenInDashboard(ent.id);
													} else {
														handleOpenEntityPage(ent.id);
													}
												}}
												sx={{ cursor: "pointer" }}
											/>
										</Tooltip>
									))}
							</Box>
						</CompactAccordionDetails>
					</CompactAccordion>
				)}

				{/* Attributes */}
				{entity.attrSeq && entity.attrSeq.length > 0 && (
					<CompactAccordion defaultExpanded>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>
								Атрибуты входящего вектора ({entity.attrSeq.length})
							</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>Имя</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												Комментарий
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{entity.attrSeq.map((attr, index) => (
											<TableRow key={index}>
												<TableCell
													sx={{ fontFamily: "monospace", fontSize: 12 }}
												>
													{attr.name}
												</TableCell>
												<TableCell>
													<Chip
														label={attr.type}
														size="small"
														variant="outlined"
													/>
												</TableCell>
												<TableCell>{attr.comment || "—"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</CompactAccordionDetails>
					</CompactAccordion>
				)}

				{/* Related Mappings */}
				{relatedMappings.length > 0 && (
					<CompactAccordion>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>
								Связанные маппинги ({relatedMappings.length})
							</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>
												ID маппинга
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												Целевая сущность
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												Зависимости
											</TableCell>
											<TableCell sx={{ fontWeight: 600, width: 80 }}>
												Действия
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{relatedMappings.map((mapping) => (
											<TableRow key={mapping.id}>
												<TableCell>{mapping.id}</TableCell>
												<TableCell>
													<Link
														component="button"
														variant="body2"
														sx={{ fontFamily: "monospace", fontSize: 11 }}
														onClick={() =>
															handleOpenEntityPage(mapping.entityId)
														}
													>
														{mapping.entityId}
													</Link>
												</TableCell>
												<TableCell>
													{mapping.deps?.length || 0} зависимостей
												</TableCell>
												<TableCell>
													<Box sx={{ display: "flex", gap: 0.5 }}>
														<Tooltip title="Открыть страницу">
															<OpenInNewIcon
																fontSize="small"
																sx={{
																	cursor: "pointer",
																	color: "primary.main",
																}}
																onClick={() =>
																	handleOpenEntityPage(mapping.entityId)
																}
															/>
														</Tooltip>
														<Tooltip title="Показать в Dashboard">
															<HomeIcon
																fontSize="small"
																sx={{
																	cursor: "pointer",
																	color: "secondary.main",
																}}
																onClick={() => {
																	const sourceId = mapping.deps?.[0]?.entityId;
																	if (sourceId) {
																		handleOpenMappingInDashboard(
																			sourceId,
																			mapping.entityId,
																		);
																	} else {
																		handleOpenInDashboard(mapping.entityId);
																	}
																}}
															/>
														</Tooltip>
													</Box>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</CompactAccordionDetails>
					</CompactAccordion>
				)}

				{/* Dependencies Details */}
				{relatedMappings.some((m) => m.deps && m.deps.length > 0) && (
					<CompactAccordion defaultExpanded>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>Детали зависимостей</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							{relatedMappings.map((mapping) =>
								mapping.deps && mapping.deps.length > 0 ? (
									<Box key={mapping.id} sx={{ mb: 2 }}>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												mb: 1,
											}}
										>
											<Typography variant="subtitle2">
												Маппинг {mapping.id}:
											</Typography>
											<Link
												component="button"
												variant="body2"
												onClick={() => handleOpenEntityPage(mapping.entityId)}
											>
												{mapping.entityId}
											</Link>
											<Tooltip title="Показать в Dashboard">
												<HomeIcon
													fontSize="small"
													sx={{ cursor: "pointer", color: "secondary.main" }}
													onClick={() =>
														handleOpenInDashboard(mapping.entityId)
													}
												/>
											</Tooltip>
										</Box>
										{mapping.deps.map((dep, depIndex) => (
											<Box
												key={depIndex}
												sx={{
													mb: 1.5,
													pl: 1,
													borderLeft: "2px solid",
													borderColor: "primary.light",
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1,
														mb: 0.5,
													}}
												>
													<Typography variant="caption" color="text.secondary">
														Источник:
													</Typography>
													<Link
														component="button"
														variant="body2"
														sx={{ fontSize: 11 }}
														onClick={() => handleOpenEntityPage(dep.entityId)}
													>
														{dep.entityId}
													</Link>
													<Tooltip title="Показать в Dashboard">
														<HomeIcon
															fontSize="small"
															sx={{
																cursor: "pointer",
																color: "secondary.main",
																fontSize: 14,
															}}
															onClick={() =>
																handleOpenMappingInDashboard(
																	dep.entityId,
																	mapping.entityId,
																)
															}
														/>
													</Tooltip>
												</Box>
												{/* Attribute Mappings */}
												{dep.attrMaps && dep.attrMaps.length > 0 && (
													<Box sx={{ ml: 1 }}>
														<Typography
															variant="caption"
															color="text.secondary"
															sx={{ display: "block", mb: 0.5 }}
														>
															Маппинги атрибутов ({dep.attrMaps.length}):
														</Typography>
														<Box
															sx={{
																display: "flex",
																flexWrap: "wrap",
																gap: 0.5,
															}}
														>
															{dep.attrMaps.map((attrMap, idx) => (
																<Tooltip
																	key={idx}
																	title={`${attrMap.src} → ${attrMap.dst}. Клик - выделить в Dashboard`}
																>
																	<Chip
																		size="small"
																		label={`${attrMap.src} → ${attrMap.dst}`}
																		variant="outlined"
																		clickable
																		sx={{ fontSize: 10 }}
																		onClick={() =>
																			handleOpenMappingInDashboard(
																				dep.entityId,
																				mapping.entityId,
																				attrMap.src,
																				attrMap.dst,
																			)
																		}
																	/>
																</Tooltip>
															))}
														</Box>
													</Box>
												)}
											</Box>
										))}
									</Box>
								) : null,
							)}
						</CompactAccordionDetails>
					</CompactAccordion>
				)}
			</ContentContainer>
		</Container>
	);
};

const Container = styled(Box)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(0.5),
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(0.5),
}));

const CompactAccordion = styled(Accordion)({
	"&:before": { display: "none" },
	boxShadow: "none",
	border: "1px solid",
	borderColor: "rgba(0, 0, 0, 0.12)",
	borderRadius: "4px !important",
	"&:not(:last-child)": { marginBottom: 0 },
	"&.Mui-expanded": { margin: 0 },
});

const CompactAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
	minHeight: 32,
	padding: theme.spacing(0, 1),
	"&.Mui-expanded": { minHeight: 32 },
	"& .MuiAccordionSummary-content": {
		margin: theme.spacing(0.5, 0),
		"&.Mui-expanded": { margin: theme.spacing(0.5, 0) },
	},
	"& .MuiAccordionSummary-expandIconWrapper": {
		"& .MuiSvgIcon-root": { fontSize: 18 },
	},
}));

const CompactAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
	padding: theme.spacing(0.5, 1, 1, 1),
}));

const AccordionTitle = styled(Typography)({
	fontSize: 12,
	fontWeight: 600,
});
