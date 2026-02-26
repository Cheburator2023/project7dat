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
	Tooltip,
	Link,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { useEntitiesStore } from "@react-client/features/entities/stores";

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
	} = useEntitiesStore();

	const relatedMappings = useMemo(() => {
		if (!entity) return [];
		return mappings.filter(
			(mapping) =>
				mapping.entityId === entity.id ||
				mapping.deps?.some((dep) => dep.entityId === entity.id),
		);
	}, [entity, mappings]);

	const incomingDeps = useMemo(() => {
		if (!entity) return [];
		const incoming: Array<{
			sourceEntityId: string;
			sourceName: string;
			process?: string;
			attrMapsCount: number;
		}> = [];
		for (const mapping of relatedMappings) {
			if (mapping.entityId !== entity.id) continue;
			for (const dep of mapping.deps ?? []) {
				incoming.push({
					sourceEntityId: dep.entityId,
					sourceName: dep.entityId,
					process: mapping.process,
					attrMapsCount: dep.attrMaps?.length ?? 0,
				});
			}
		}
		return incoming;
	}, [entity, relatedMappings]);

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
	const _handleOpenInDashboard = useCallback(
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
	const _handleOpenMappingInDashboard = useCallback(
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

				{/* Incoming Vector */}
				{incomingDeps.length > 0 && (
					<CompactAccordion>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>
								Входящий вектор ({incomingDeps.length})
							</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>Источник</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Процесс</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												Атр. маппинги
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{incomingDeps.map((dep, idx) => (
											<TableRow key={idx}>
												<TableCell
													sx={{ fontFamily: "monospace", fontSize: 11 }}
												>
													<Tooltip title="Открыть страницу сущности">
														<Link
															component="button"
															variant="body2"
															sx={{ fontSize: 11 }}
															onClick={() =>
																handleOpenEntityPage(dep.sourceEntityId)
															}
														>
															{dep.sourceName}
														</Link>
													</Tooltip>
												</TableCell>
												<TableCell>{dep.process || "—"}</TableCell>
												<TableCell>
													<Chip
														label={dep.attrMapsCount}
														size="small"
														variant="outlined"
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
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
