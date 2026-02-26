import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import {
	Alert,
	Box,
	Button,
	Container,
	Divider,
	Paper,
	Stack,
	Typography,
} from "@mui/material";

import { consoleErrorStore } from "@react-client/common/errorBoundary/shared/consoleErrorStore";
import { useConsoleEntries } from "@react-client/common/errorBoundary/hooks/useConsoleEntries";

const stringifyError = (value: unknown) => {
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}

	try {
		return { value: JSON.stringify(value) };
	} catch {
		return { value: String(value) };
	}
};

const CodeBlock = ({ children }: { children: ReactNode }) => {
	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				bgcolor: "background.default",
				overflow: "auto",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
				fontSize: 12,
				whiteSpace: "pre-wrap",
			}}
		>
			{children}
		</Paper>
	);
};

export const RoutingErrorPage = (props: {
	error: unknown;
	componentStack?: string;
	onReset: () => void;
}) => {
	const { error, componentStack, onReset } = props;
	const consoleEntries = useConsoleEntries();

	const errorJson = useMemo(() => stringifyError(error), [error]);

	useEffect(() => {
		consoleErrorStore.init();
	}, []);

	const copyToClipboard = useCallback(async () => {
		const payload = {
			url: window.location.href,
			error: errorJson,
			componentStack,
			console: consoleEntries,
		};
		await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
	}, [componentStack, consoleEntries, errorJson]);

	return (
		<Box sx={{ minHeight: "100vh", py: 6, bgcolor: "background.default" }}>
			<Container maxWidth="md">
				<Stack spacing={2}>
					<Typography variant="h4" fontWeight={700}>
						Произошла ошибка
					</Typography>

					<Alert severity="error" variant="outlined">
						<Typography variant="subtitle2" fontWeight={700}>
							{error instanceof Error ? error.name : "Error"}
						</Typography>
						<Typography variant="body2">
							{error instanceof Error ? error.message : String(error)}
						</Typography>
					</Alert>

					<Stack direction="row" spacing={1}>
						<Button variant="contained" onClick={onReset}>
							Сбросить
						</Button>
						<Button variant="outlined" onClick={() => window.location.reload()}>
							Перезагрузить
						</Button>
						<Button variant="outlined" onClick={copyToClipboard}>
							Скопировать
						</Button>
					</Stack>

					<Divider />

					<Typography variant="h6">Stack</Typography>
					<CodeBlock>{errorJson.stack ?? ""}</CodeBlock>

					{componentStack ? (
						<>
							<Typography variant="h6">Component stack</Typography>
							<CodeBlock>{componentStack}</CodeBlock>
						</>
					) : null}

					<Typography variant="h6">Console</Typography>
					<CodeBlock>
						{consoleEntries.length
							? consoleEntries
									.map(
										(e) =>
											`${new Date(e.timestamp).toISOString()} [${e.level}] ${e.message}`,
									)
									.join("\n\n")
							: "(пусто)"}
					</CodeBlock>
				</Stack>
			</Container>
		</Box>
	);
};
