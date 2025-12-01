import React, { useMemo, useState } from "react";
import {
	styled,
	Box,
	Typography,
	useColorScheme,
	IconButton,
	Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import {
	highlightJson,
	getJsonHighlightColors,
} from "../utils/jsonSyntaxHighlight";

interface EntityJsonEditorProps {
	entity: DataLineageEntity | null;
}

export const EntityJsonEditor: React.FC<EntityJsonEditorProps> = ({
	entity,
}) => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const [copied, setCopied] = useState(false);

	const { formattedJson, highlightedJson } = useMemo(() => {
		if (!entity) return { formattedJson: "{}", highlightedJson: "{}" };

		const formatted = JSON.stringify(entity, null, 2);
		const colors = getJsonHighlightColors(isDark);
		const highlighted = highlightJson(formatted, colors);

		return { formattedJson: formatted, highlightedJson: highlighted };
	}, [entity, isDark]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(formattedJson);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Не удалось скопировать JSON:", err);
		}
	};

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
				<HeaderContent>
					<Tooltip title={copied ? "Скопировано!" : "Скопировать JSON"}>
						<IconButton
							onClick={handleCopy}
							size="small"
							color={copied ? "success" : "default"}
						>
							{copied ? <CheckIcon /> : <ContentCopyIcon />}
						</IconButton>
					</Tooltip>
				</HeaderContent>
			</Header>
			<JsonContainer>
				<pre dangerouslySetInnerHTML={{ __html: highlightedJson }} />
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

const HeaderContent = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
	gap: theme.spacing(2),
}));

const JsonContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	backgroundColor: theme.vars?.palette?.background.default,
	border: `1px solid ${theme.vars?.palette?.divider}`,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(2),
	"& pre": {
		margin: 0,
		fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
		fontSize: "13px",
		lineHeight: 1.6,
		color: theme.vars?.palette?.text.primary,
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		"& span": {
			fontWeight: "inherit",
		},
	},
	"&::-webkit-scrollbar": {
		width: "8px",
		height: "8px",
	},
	"&::-webkit-scrollbar-track": {
		backgroundColor: theme.vars?.palette?.action?.hover,
		borderRadius: "4px",
	},
	"&::-webkit-scrollbar-thumb": {
		backgroundColor: theme.vars?.palette?.action?.selected,
		borderRadius: "4px",
		"&:hover": {
			backgroundColor: theme.vars?.palette?.action?.focus,
		},
	},
}));
