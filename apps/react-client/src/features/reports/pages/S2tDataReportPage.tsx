import { useCallback, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Stack,
	Typography,
} from "@mui/material";
import { format } from "date-fns/esm";
import { toast } from "sonner";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Card } from "@react-client/common/muiCustom/Card";
import { useEntitiesStore } from "@react-client/features/entities/stores";
import {
	usePaginatedEntityRelations,
	useDownloadS2tReport,
} from "@react-client/api/hooks";

const sanitizeFilePart = (value: string) =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const buildDefaultFileName = (params: {
	schemaName?: string;
	entityName: string;
	extension: "xlsx";
}) => {
	const timestamp = format(new Date(), "yyMMddHHmm");
	const schemaPart = params.schemaName
		? sanitizeFilePart(params.schemaName)
		: "";
	const entityPart = sanitizeFilePart(params.entityName);
	const base = schemaPart ? `${schemaPart}.${entityPart}` : entityPart;
	return `${base}${timestamp}.${params.extension}`;
};

export const S2tDataReportPage = () => {
	const { selectedEntityId } = useEntitiesStore();
	const downloadS2tReport = useDownloadS2tReport();
	const [loading, setLoading] = useState(false);

	const { data: relationsData, isLoading: isEntityLoading } =
		usePaginatedEntityRelations({
			entityId: selectedEntityId ?? "",
			page: 1,
			limit: 1,
			enabled: !!selectedEntityId,
		});

	const derived = useMemo(() => {
		if (!relationsData || !selectedEntityId) {
			return {
				entity: null,
				fileName: null as string | null,
				isAllowedEntityType: false,
			};
		}

		const entity = relationsData.entity ?? null;
		const isAllowedEntityType =
			entity?.type === "table" || entity?.type === "view";
		const fileName = entity
			? buildDefaultFileName({
					entityName: entity.name ?? entity.id,
					schemaName: entity.namespace,
					extension: "xlsx",
				})
			: null;

		return { entity, fileName, isAllowedEntityType };
	}, [relationsData, selectedEntityId]);

	const handleDownload = useCallback(async () => {
		if (loading) return;
		if (!selectedEntityId) {
			toast.error("Сначала выбери витрину (таблицу или view) на главной");
			return;
		}
		if (!derived.entity || !derived.isAllowedEntityType) {
			toast.error("Отчёт доступен только для сущностей типа table или view");
			return;
		}

		setLoading(true);
		try {
			await downloadS2tReport({
				entityId: selectedEntityId,
				fallbackFileName: derived.fileName ?? "report.xlsx",
			});
		} catch {
			// Error already handled in hook
		} finally {
			setLoading(false);
		}
	}, [derived, loading, selectedEntityId, downloadS2tReport]);

	return (
		<Box>
			<Header title={"Отчёт: Формат S2T"} />

			<Card>
				<Stack spacing={2}>
					<Typography variant="body1">
						Выгрузка файла отчёта для выбранной витрины в формате S2T (.xlsx).
					</Typography>

					{!selectedEntityId && (
						<Alert severity="warning">
							Сначала выбери витрину (таблицу или view) на главной странице.
						</Alert>
					)}

					{selectedEntityId && isEntityLoading && (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					)}

					{selectedEntityId && !isEntityLoading && !derived.entity && (
						<Alert severity="error">Не удалось найти выбранную сущность.</Alert>
					)}

					{derived.entity && (
						<Alert severity={derived.isAllowedEntityType ? "info" : "warning"}>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
								<Typography variant="subtitle2">Выбранная витрина</Typography>
								<Typography variant="body2">
									Схема: {derived.entity.namespace || "—"}
								</Typography>
								<Typography variant="body2">
									Таблица/view: {derived.entity.name ?? derived.entity.id}
								</Typography>
								<Typography variant="body2">
									Тип: {derived.entity.type}
								</Typography>
								{derived.fileName && (
									<Typography variant="body2">
										Имя файла: {derived.fileName}
									</Typography>
								)}
							</Box>
						</Alert>
					)}

					<Button
						variant="contained"
						onClick={handleDownload}
						disabled={
							!derived.entity ||
							!derived.isAllowedEntityType ||
							loading ||
							isEntityLoading
						}
						startIcon={
							loading ? (
								<CircularProgress size={16} color="inherit" />
							) : undefined
						}
					>
						Скачать отчёт (.xlsx)
					</Button>
				</Stack>
			</Card>
		</Box>
	);
};
