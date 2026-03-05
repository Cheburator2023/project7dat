import { memo, useCallback, useMemo, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	CircularProgress,
	Alert,
} from "@mui/material";
import { Code, Link as LinkIcon } from "@mui/icons-material";
import { toast } from "sonner";
import {
	useDownloadS2tReport,
	useDownloadJsonReport,
	usePaginatedEntityRelations,
} from "@react-client/api/hooks";

const sanitizeFilePart = (value: string) =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const buildDefaultFileName = (params: {
	schemaName?: string;
	entityName: string;
	extension: "json" | "xlsx";
}) => {
	const date = new Date();
	const yy = String(date.getFullYear() % 100).padStart(2, "0");
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const hh = String(date.getHours()).padStart(2, "0");
	const min = String(date.getMinutes()).padStart(2, "0");
	const timestamp = `${yy}${mm}${dd}${hh}${min}`;
	const schemaPart = params.schemaName
		? sanitizeFilePart(params.schemaName)
		: "";
	const entityPart = sanitizeFilePart(params.entityName);
	const base = schemaPart ? `${schemaPart}.${entityPart}` : entityPart;
	return `${base}${timestamp}.${params.extension}`;
};

interface ExportDialogProps {
	open: boolean;
	onClose: () => void;
	entityId: string | null;
}

export const ExportDialog = memo<ExportDialogProps>(
	({ open, onClose, entityId }) => {
		const [loading, setLoading] = useState(false);
		const downloadS2tReport = useDownloadS2tReport();
		const downloadJsonReport = useDownloadJsonReport();

		const { data: relationsData, isLoading: isRelationsLoading } =
			usePaginatedEntityRelations({
				entityId: entityId ?? "",
				page: 1,
				limit: 500,
				enabled: !!entityId && open,
			});

		const entity = relationsData?.entity ?? null;

		const isAllowedReportEntityType = useMemo(() => {
			return entity?.type === "table" || entity?.type === "view";
		}, [entity?.type]);

		const relatedMappingsCount = useMemo(() => {
			if (!relationsData || !entityId) return 0;
			return (relationsData.mappings ?? []).length;
		}, [entityId, relationsData]);

		const reportMenuDisabledReason = useMemo(() => {
			if (!entityId) return "Сущность не выбрана";
			if (isRelationsLoading) return "Загрузка...";
			if (!entity) return "Не удалось определить сущность";
			if (!isAllowedReportEntityType)
				return "Отчёт доступен только для сущностей типа table или view";
			if (relatedMappingsCount === 0)
				return "Нет маппингов для выбранной витрины";
			return null;
		}, [
			entityId,
			entity,
			isAllowedReportEntityType,
			isRelationsLoading,
			relatedMappingsCount,
		]);

		const handleDownloadJsonReport = useCallback(async () => {
			if (!entityId || !relationsData || !entity) {
				toast.error("Нет данных для формирования отчёта");
				return;
			}
			if (!isAllowedReportEntityType) {
				toast.error("Отчёт доступен только для сущностей типа table или view");
				return;
			}
			if (relatedMappingsCount === 0) {
				toast.error("Нет маппингов для выбранной витрины");
				return;
			}

			const mappings = relationsData.mappings ?? [];
			const relatedEntities = relationsData.relatedEntities ?? [];
			const entities = entity ? [entity, ...relatedEntities] : relatedEntities;

			const report = {
				generatedAt: new Date().toISOString(),
				format: "DATA_LINEAGE_REPORT_JSON",
				selectedEntityId: entityId,
				desc: relationsData.desc,
				entities,
				mappings,
			};
			const fileName = buildDefaultFileName({
				entityName: entity.name ?? entity.id,
				schemaName: entity.namespace,
				extension: "json",
			});

			downloadJsonReport({ data: report, fileName });
			onClose();
		}, [
			entityId,
			relationsData,
			entity,
			isAllowedReportEntityType,
			relatedMappingsCount,
			downloadJsonReport,
			onClose,
		]);

		const handleDownloadS2tReport = useCallback(async () => {
			if (!entityId || !entity) {
				toast.error("Не удалось определить сущность");
				return;
			}
			if (!isAllowedReportEntityType) {
				toast.error("Отчёт доступен только для сущностей типа table или view");
				return;
			}
			if (relatedMappingsCount === 0) {
				toast.error("Нет маппингов для выбранной витрины");
				return;
			}

			setLoading(true);
			try {
				const fallbackName = buildDefaultFileName({
					entityName: entity.name ?? entity.id,
					schemaName: entity.namespace,
					extension: "xlsx",
				});
				await downloadS2tReport({ entityId, fallbackFileName: fallbackName });
				onClose();
			} catch {
				// Error already handled in hook
			} finally {
				setLoading(false);
			}
		}, [
			entityId,
			entity,
			isAllowedReportEntityType,
			relatedMappingsCount,
			downloadS2tReport,
			onClose,
		]);

		return (
			<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
				<DialogTitle>Экспорт отчёта</DialogTitle>
				<DialogContent>
					{reportMenuDisabledReason && (
						<Alert severity="warning" sx={{ mb: 2 }}>
							{reportMenuDisabledReason}
						</Alert>
					)}

					{entity && !reportMenuDisabledReason && (
						<Alert severity="info" sx={{ mb: 2 }}>
							Выбрана сущность: {entity.namespace ? `${entity.namespace}.` : ""}
							{entity.name ?? entity.id}
						</Alert>
					)}

					<List disablePadding>
						<ListItem disablePadding>
							<ListItemButton
								onClick={handleDownloadJsonReport}
								disabled={Boolean(reportMenuDisabledReason) || loading}
							>
								<ListItemIcon>
									{isRelationsLoading ? (
										<CircularProgress size={20} />
									) : (
										<Code />
									)}
								</ListItemIcon>
								<ListItemText
									primary="Выгрузить JSON отчёт"
									secondary="Формат Data Lineage JSON"
								/>
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton
								onClick={handleDownloadS2tReport}
								disabled={Boolean(reportMenuDisabledReason) || loading}
							>
								<ListItemIcon>
									{loading ? <CircularProgress size={20} /> : <LinkIcon />}
								</ListItemIcon>
								<ListItemText
									primary="Скачать S2T отчёт"
									secondary="Формат .xlsx"
								/>
							</ListItemButton>
						</ListItem>
					</List>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose} disabled={loading}>
						Закрыть
					</Button>
				</DialogActions>
			</Dialog>
		);
	},
);

ExportDialog.displayName = "ExportDialog";
