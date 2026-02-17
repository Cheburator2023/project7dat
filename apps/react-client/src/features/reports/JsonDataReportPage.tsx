import { useCallback, useMemo } from "react";
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
import { usePaginatedEntityRelations } from "@react-client/api/hooks";

const sanitizeFilePart = (value: string) =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const buildDefaultFileName = (params: {
	schemaName?: string;
	entityName: string;
	extension: "json";
}) => {
	const timestamp = format(new Date(), "yyMMddHHmm");
	const schemaPart = params.schemaName
		? sanitizeFilePart(params.schemaName)
		: "";
	const entityPart = sanitizeFilePart(params.entityName);
	const base = schemaPart ? `${schemaPart}.${entityPart}` : entityPart;
	return `${base}${timestamp}.${params.extension}`;
};

const downloadJson = (params: { data: unknown; fileName: string }) => {
	const dataStr = JSON.stringify(params.data, null, 2);
	const dataBlob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(dataBlob);

	const link = document.createElement("a");
	link.href = url;
	link.download = params.fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export const JsonDataReportPage = () => {
	const { selectedEntityId } = useEntitiesStore();

	const { data: relationsData, isLoading } = usePaginatedEntityRelations({
		entityId: selectedEntityId ?? "",
		page: 1,
		limit: 500,
		enabled: !!selectedEntityId,
	});

	const derived = useMemo(() => {
		if (!relationsData || !selectedEntityId) {
			return {
				entity: null,
				fileName: null,
				isAllowedEntityType: false,
				report: null as Record<string, unknown> | null,
			};
		}

		const entity = relationsData.entity ?? null;
		const mappings = relationsData.mappings ?? [];
		const relatedEntities = relationsData.relatedEntities ?? [];

		const entityIds = new Set<string>([selectedEntityId]);
		for (const mapping of mappings) {
			entityIds.add(mapping.entityId);
			for (const dep of mapping.deps ?? []) {
				entityIds.add(dep.entityId);
			}
		}

		const entities = entity ? [entity, ...relatedEntities] : relatedEntities;

		const report = {
			generatedAt: new Date().toISOString(),
			format: "DATA_LINEAGE_REPORT_JSON",
			selectedEntityId,
			desc: relationsData.desc,
			entities,
			mappings,
		};

		const isAllowedEntityType =
			entity?.type === "table" || entity?.type === "view";
		const fileName = entity
			? buildDefaultFileName({
					entityName: entity.name ?? entity.id,
					schemaName: entity.namespace,
					extension: "json",
				})
			: null;

		return { entity, fileName, isAllowedEntityType, report };
	}, [relationsData, selectedEntityId]);

	const handleDownload = useCallback(() => {
		if (!selectedEntityId) {
			toast.error("Сначала выбери витрину (таблицу/view) на главной");
			return;
		}
		if (!derived.entity || !derived.fileName || !derived.report) {
			toast.error("Не удалось сформировать отчёт");
			return;
		}
		if (!derived.isAllowedEntityType) {
			toast.error("Отчёт доступен только для сущностей типа table или view");
			return;
		}

		downloadJson({ data: derived.report, fileName: derived.fileName });
	}, [derived, selectedEntityId]);

	return (
		<Box>
			<Header title={"Отчёт: Формат JSON"} />

			<Card>
				<Stack spacing={2}>
					<Typography variant="body1">
						Выгрузка файла отчёта для выбранной витрины в формате JSON.
					</Typography>

					{!selectedEntityId && (
						<Alert severity="warning">
							Сначала выбери витрину (таблицу или view) на главной странице.
						</Alert>
					)}

					{selectedEntityId && isLoading && (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					)}

					{selectedEntityId && !isLoading && !derived.entity && (
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
							!derived.entity || !derived.isAllowedEntityType || isLoading
						}
					>
						Скачать отчёт (.json)
					</Button>
				</Stack>
			</Card>
		</Box>
	);
};
