import React, { useMemo } from "react";
import { styled, Box, Typography } from "@mui/material";
import type { DataLineageEntity } from "@react-client/types/dataLineage";

interface EntityJsonEditorProps {
	entity: DataLineageEntity | null;
}

export const EntityJsonEditor: React.FC<EntityJsonEditorProps> = ({
	entity,
}) => {
	const formattedJson = useMemo(() => {
		if (!entity) return "{}";
		return JSON.stringify(entity, null, 2);
	}, [entity]);

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
				<Typography variant="h6">JSON представление</Typography>
				<Typography variant="body2" color="text.secondary">
					Только для чтения
				</Typography>
			</Header>
			<JsonContainer>
				<pre>{formattedJson}</pre>
			</JsonContainer>
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

const JsonContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	backgroundColor: theme.vars?.palette?.background.default,
	border: `1px solid ${theme.vars?.palette?.divider}`,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(1),
	"& pre": {
		margin: 0,
		fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
		fontSize: "12px",
		lineHeight: 1.5,
		color: theme.vars?.palette?.text.primary,
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
	},
}));
