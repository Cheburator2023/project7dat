import React, { useMemo } from "react";
import {
	styled,
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

interface EntityTableViewProps {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
}

export const EntityTableView: React.FC<EntityTableViewProps> = ({
	entity,
	mappings,
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
			<Header>
				<Typography variant="h6">Табличное представление</Typography>
				<Typography variant="body2" color="text.secondary">
					Детальная информация о сущности
				</Typography>
			</Header>

			<ContentContainer>
				{/* Basic Information */}
				<Accordion defaultExpanded>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography variant="subtitle1">Основная информация</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											ID
										</TableCell>
										<TableCell>{entity.id}</TableCell>
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
								</TableBody>
							</Table>
						</TableContainer>
					</AccordionDetails>
				</Accordion>

				{/* Attributes */}
				{entity.attrSeq && entity.attrSeq.length > 0 && (
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant="subtitle1">
								Атрибуты ({entity.attrSeq.length})
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
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
												<TableCell>{attr.name}</TableCell>
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
						</AccordionDetails>
					</Accordion>
				)}

				{/* Related Mappings */}
				{relatedMappings.length > 0 && (
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant="subtitle1">
								Связанные маппинги ({relatedMappings.length})
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
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
												<TableCell>{mapping.entityId}</TableCell>
												<TableCell>
													{mapping.deps?.length || 0} зависимостей
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</AccordionDetails>
					</Accordion>
				)}

				{/* Dependencies Details */}
				{relatedMappings.some((m) => m.deps && m.deps.length > 0) && (
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant="subtitle1">Детали зависимостей</Typography>
						</AccordionSummary>
						<AccordionDetails>
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
															<TableCell>{dep.entityId}</TableCell>
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
						</AccordionDetails>
					</Accordion>
				)}
			</ContentContainer>
		</Container>
	);
};

const Container = styled(Box)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
}));

const Header = styled(Box)(({ theme }) => ({
	marginBottom: theme.spacing(2),
	borderBottom: `1px solid ${theme.vars?.palette?.divider}`,
	paddingBottom: theme.spacing(1),
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));
