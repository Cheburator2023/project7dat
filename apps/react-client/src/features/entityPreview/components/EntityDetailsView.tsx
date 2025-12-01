import React, { useMemo } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

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
	const relatedMappings = useMemo(() => {
		if (!entity) return [];
		return mappings.filter(
			(mapping) =>
				mapping.entityId === entity.id ||
				mapping.deps?.some((dep) => dep.entityId === entity.id),
		);
	}, [entity, mappings]);

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
			<ContentContainer>
				{/* Basic Information */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>Основная информация</AccordionTitle>
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
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Статус
										</TableCell>
										<TableCell>
											<Chip
												label={entity.modified ? "Целевая" : "Исходная"}
												size="small"
												color={entity.modified ? "success" : "default"}
											/>
										</TableCell>
									</TableRow>
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
										<Chip
											key={ent.id}
											label={ent.name || ent.id}
											size="small"
											variant="outlined"
										/>
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
								Атрибуты ({entity.attrSeq.length})
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
										</TableRow>
									</TableHead>
									<TableBody>
										{relatedMappings.map((mapping) => (
											<TableRow key={mapping.id}>
												<TableCell>{mapping.id}</TableCell>
												<TableCell
													sx={{ fontFamily: "monospace", fontSize: 11 }}
												>
													{mapping.entityId}
												</TableCell>
												<TableCell>
													{mapping.deps?.length || 0} зависимостей
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
					<CompactAccordion>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>Детали зависимостей</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							{relatedMappings.map((mapping) =>
								mapping.deps && mapping.deps.length > 0 ? (
									<Box key={mapping.id} sx={{ mb: 2 }}>
										<Typography variant="subtitle2" sx={{ mb: 1 }}>
											Маппинг {mapping.id} → {mapping.entityId}
										</Typography>
										<TableContainer component={Paper} variant="outlined">
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell sx={{ fontWeight: 600 }}>
															Исходная сущность
														</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>
															Маппинги атрибутов
														</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>
															Зависимости атрибутов
														</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{mapping.deps.map((dep, depIndex) => (
														<TableRow key={depIndex}>
															<TableCell
																sx={{ fontFamily: "monospace", fontSize: 11 }}
															>
																{dep.entityId}
															</TableCell>
															<TableCell>
																{dep.attrMaps?.length || 0} маппингов
															</TableCell>
															<TableCell>
																{dep.atrDeps?.length || 0} зависимостей
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TableContainer>
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
