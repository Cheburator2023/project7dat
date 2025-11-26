import { useState, useEffect, type ReactNode } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	IconButton,
	Typography,
	CircularProgress,
	Alert,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { featureFlags } from "@react-client/config/featureFlags";
import { jsonDataService } from "@react-client/api/hooks/jsonDataApi";
import type { DataLineageSchema } from "@react-client/types/dataLineage";
import { DataLineageGraph } from "@react-client/new_features/processes/organisms/DataLineageGraph";

interface Process {
	id: string;
	name: string;
	type: string;
	description: string;
	createdDate: string;
	status: "active" | "inactive" | "pending";
}

interface ProcessGraphWindowProps {
	process: Process;
	open: boolean;
	onClose: () => void;
}
export function ProcessGraphWindow({
	process,
	open,
	onClose,
}: ProcessGraphWindowProps) {
	const [schema, setSchema] = useState<DataLineageSchema | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!open) return;
		if (!featureFlags.newJsonDataV2Enabled) {
			setSchema(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);

		jsonDataService
			.getById(process.id)
			.then((item) => {
				if (cancelled) return;
				setSchema(item.data as DataLineageSchema);
			})
			.catch((e) => {
				if (cancelled) return;
				setError(
					e instanceof Error ? e : new Error("Ошибка загрузки графа процесса"),
				);
				setSchema(null);
			})
			.finally(() => {
				if (cancelled) return;
				setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, process.id]);

	let content: ReactNode;

	if (isLoading) {
		content = (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
				}}
			>
				<CircularProgress />
			</Box>
		);
	} else if (error) {
		content = (
			<Box sx={{ p: 2 }}>
				<Alert severity="error">
					Ошибка загрузки графа процесса: {error.message}
				</Alert>
			</Box>
		);
	} else if (!schema) {
		content = (
			<Box sx={{ p: 2 }}>
				<Alert severity="info">
					Данные о линии данных для этого процесса недоступны
				</Alert>
			</Box>
		);
	} else {
		content = <DataLineageGraph data={schema} />;
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xl"
			fullWidth
			PaperProps={{
				sx: { height: "90vh" },
			}}
		>
			<DialogTitle>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">Граф объектов {process.name}</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>
			<DialogContent sx={{ p: 0, height: "100%" }}>
				<Box sx={{ height: "100%", width: "100%" }}>{content}</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
}
