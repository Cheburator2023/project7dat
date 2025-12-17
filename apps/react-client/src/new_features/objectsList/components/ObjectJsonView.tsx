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
import type { ObjectItem } from "../types";
import {
	highlightJson,
	getJsonHighlightColors,
} from "@react-client/features/entityPreview/utils/jsonSyntaxHighlight";

interface ObjectJsonViewProps {
	object: ObjectItem | null;
}

export const ObjectJsonView: React.FC<ObjectJsonViewProps> = ({ object }) => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const [copied, setCopied] = useState(false);

	const { formattedJson, highlightedJson } = useMemo(() => {
		if (!object) return { formattedJson: "{}", highlightedJson: "{}" };

		const formatted = JSON.stringify(object, null, 2);
		const colors = getJsonHighlightColors(isDark);
		const highlighted = highlightJson(formatted, colors);

		return { formattedJson: formatted, highlightedJson: highlighted };
	}, [object, isDark]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(formattedJson);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Не удалось скопировать JSON:", err);
		}
	};

	if (!object) {
		return (
			<Container>
				<Typography variant="body1" color="text.secondary">
					Объект не выбран
				</Typography>
			</Container>
		);
	}

	return (
		<Container>
			<JsonContainer>
				<CopyButton>
					<Tooltip title={copied ? "Скопировано!" : "Скопировать JSON"}>
						<IconButton
							onClick={handleCopy}
							size="small"
							color={copied ? "success" : "default"}
						>
							{copied ? <CheckIcon /> : <ContentCopyIcon />}
						</IconButton>
					</Tooltip>
				</CopyButton>
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

const CopyButton = styled(Box)(({ theme }) => ({
	position: "absolute",
	top: theme.spacing(1),
	right: theme.spacing(1),
	zIndex: 1,
}));

const JsonContainer = styled(Box)(({ theme }) => ({
	position: "relative",
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
