import { useCallback, useMemo } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { format } from "date-fns/esm";
import { toast } from "sonner";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Card } from "@react-client/common/muiCustom/Card";
import { useDashboardStore } from "@react-client/features/dashboard/stores";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type {
	DataLineageEntity,
	DataLineageGraph,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

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

const buildEntityReport = (params: {
	graph: DataLineageGraph;
	selectedEntityId: string;
}): {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
	entities: DataLineageEntity[];
	report: Record<string, unknown>;
} => {
	const entity =
		params.graph.entities.find((e) => e.id === params.selectedEntityId) ?? null;

	const mappings = params.graph.mappings.filter(
		(m) =>
			m.entityId === params.selectedEntityId ||
			(m.deps ?? []).some((d) => d.entityId === params.selectedEntityId),
	);

	const entityIds = new Set<string>([params.selectedEntityId]);
	for (const mapping of mappings) {
		entityIds.add(mapping.entityId);
		for (const dep of mapping.deps ?? []) {
			entityIds.add(dep.entityId);
		}
	}

	const entities = params.graph.entities.filter((e) => entityIds.has(e.id));

	const report = {
		generatedAt: new Date().toISOString(),
		format: "DATA_LINEAGE_REPORT_JSON",
		selectedEntityId: params.selectedEntityId,
		desc: params.graph.desc,
		entities,
		mappings,
	};

	return { entity, mappings, entities, report };
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
	const { selectedEntityId } = useDashboardStore();
	const { currentGraph } = useDataLineageStore();

	const derived = useMemo(() => {
		if (!currentGraph || !selectedEntityId) {
			return {
				entity: null,
				fileName: null,
				isAllowedEntityType: false,
				report: null as Record<string, unknown> | null,
			};
		}

		const { entity, report } = buildEntityReport({
			graph: currentGraph,
			selectedEntityId,
		});

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
	}, [currentGraph, selectedEntityId]);

	const handleDownload = useCallback(() => {
		if (!currentGraph) {
			toast.error("Нет текущих данных для формирования отчёта");
			return;
		}
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
	}, [currentGraph, derived, selectedEntityId]);

	return (
		<Box>
			<Header title={"Отчёт: Формат JSON"} />
			<Box sx={{ p: 2 }}>
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

						{selectedEntityId && !derived.entity && (
							<Alert severity="error">
								Не удалось найти выбранную сущность в текущем графе.
							</Alert>
						)}

						{derived.entity && (
							<Alert
								severity={derived.isAllowedEntityType ? "info" : "warning"}
							>
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
								>
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
							disabled={!derived.entity || !derived.isAllowedEntityType}
						>
							Скачать отчёт (.json)
						</Button>
					</Stack>
				</Card>
			</Box>
		</Box>
	);
};
