import React from "react";
import { styled, Box, Typography, Chip, CardContent } from "@mui/material";
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
			<DetailsSection>
				<div>
					<CardContent>
						<Typography variant="subtitle1" gutterBottom>
							Детали сущности
						</Typography>
						<DetailRow>
							<DetailLabel>ID:</DetailLabel>
							<DetailValue>{entity.id}</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Имя:</DetailLabel>
							<DetailValue>{entity.name || "Не указано"}</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Тип:</DetailLabel>
							<DetailValue>
								<Chip
									label={entity.type}
									size="small"
									color={entity.type === "table" ? "primary" : "secondary"}
								/>
							</DetailValue>
						</DetailRow>
						{entity.namespace && (
							<DetailRow>
								<DetailLabel>Пространство имен:</DetailLabel>
								<DetailValue>{entity.namespace}</DetailValue>
							</DetailRow>
						)}
						<DetailRow>
							<DetailLabel>Статус:</DetailLabel>
							<DetailValue>
								<Chip
									label={entity.modified ? "Целевая" : "Исходная"}
									size="small"
									color={entity.modified ? "success" : "default"}
								/>
							</DetailValue>
						</DetailRow>
						{entity.attrSeq && entity.attrSeq.length > 0 && (
							<DetailRow>
								<DetailLabel>Атрибуты:</DetailLabel>
								<DetailValue>{entity.attrSeq.length} атрибутов</DetailValue>
							</DetailRow>
						)}
					</CardContent>
				</div>

				{allEntities.length > 1 && (
					<div>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								Связанные сущности
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{allEntities.length - 1} связанных сущностей
							</Typography>
							<Box sx={{ mt: 1 }}>
								{allEntities
									.filter((ent) => ent.id !== entity.id)
									.slice(0, 5)
									.map((ent) => (
										<Chip
											key={ent.id}
											label={ent.name || ent.id}
											size="small"
											variant="outlined"
											sx={{ mr: 0.5, mb: 0.5 }}
										/>
									))}
								{allEntities.length > 6 && (
									<Typography variant="caption" color="text.secondary">
										и еще {allEntities.length - 6}...
									</Typography>
								)}
							</Box>
						</CardContent>
					</div>
				)}

				{entity.attrSeq && entity.attrSeq.length > 0 && (
					<div>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								Атрибуты сущности
							</Typography>
							<Box sx={{ mt: 1 }}>
								{entity.attrSeq.map((attr, index) => (
									<Box
										key={index}
										sx={{
											mb: 1,
											p: 1,
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
										}}
									>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											{attr.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											Тип: {attr.type}
										</Typography>
										{attr.comment && (
											<Typography
												variant="caption"
												display="block"
												color="text.secondary"
											>
												{attr.comment}
											</Typography>
										)}
									</Box>
								))}
							</Box>
						</CardContent>
					</div>
				)}
			</DetailsSection>
		</Container>
	);
};

const Container = styled(Box)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
}));

const DetailsSection = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const DetailRow = styled(Box)({
	display: "flex",
	alignItems: "center",
	marginBottom: 8,
});

const DetailLabel = styled(Typography)(({ theme }) => ({
	minWidth: 120,
	fontWeight: 500,
	color: theme.vars?.palette?.text.secondary,
}));

const DetailValue = styled(Box)({
	flex: 1,
});
