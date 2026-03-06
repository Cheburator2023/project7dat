import { memo, useCallback, useMemo, useState } from "react";
import {
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	CircularProgress,
} from "@mui/material";
import {
	Code,
	ContentCopy,
	OpenInNew,
	Link as LinkIcon,
	CenterFocusStrong,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";
import { toast } from "sonner";
import {
	usePaginatedEntityRelations,
	useDownloadS2tReport,
	useDownloadJsonReport,
} from "@react-client/api/hooks";
import { useEntitiesStore } from "../stores";
import type { EntityConnection } from "../types";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";

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

export interface EntityContextMenuState {
	entityId: string;
	entityName: string;
	entityType: string;
	x: number;
	y: number;
}

interface EntityContextMenuProps {
	contextMenu: EntityContextMenuState | null;
	onClose: () => void;
	entity?: DataLineageEntity | null;
	connections?: EntityConnection[];
}

export const EntityContextMenu = memo<EntityContextMenuProps>(
	({ contextMenu, onClose, entity: externalEntity, connections = [] }) => {
		const navigate = useNavigate();
		const { setRevealPosition } = useDataLineageStore();
		const { setZoomToNode, selectEntity } = useEntitiesStore();
		const downloadS2tReport = useDownloadS2tReport();
		const downloadJsonReport = useDownloadJsonReport();

		const { data: relationsData, isLoading: isRelationsLoading } =
			usePaginatedEntityRelations({
				entityId: contextMenu?.entityId ?? "",
				page: 1,
				limit: 500,
				enabled: !!contextMenu?.entityId,
			});

		const entity =
			externalEntity ??
			(relationsData?.entity as DataLineageEntity | null) ??
			null;

		// Dialog state
		const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
		const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
		const [selectedConnection, setSelectedConnection] =
			useState<EntityConnection | null>(null);

		const _handleViewDetails = useCallback(() => {
			if (entity) {
				setIsEntityDialogOpen(true);
			}
			onClose();
		}, [entity, onClose]);

		const handleGoToEntity = useCallback(() => {
			if (contextMenu?.entityId) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				navigate(`/entity/${encodedId}`);
			}
			onClose();
		}, [contextMenu?.entityId, navigate, onClose]);

		const handleOpenInNewTab = useCallback(() => {
			if (contextMenu?.entityId) {
				const encodedId = encodeURIComponent(contextMenu.entityId);
				const url = new URL(`/entity/${encodedId}`, window.location.href);
				window.open(url.toString(), "_blank", "noopener,noreferrer");
			}
			onClose();
		}, [contextMenu?.entityId, onClose]);

		const _handleShowInEditor = useCallback(() => {
			if (contextMenu?.entityId) {
				setRevealPosition({ nodeId: contextMenu.entityId, from: "search" });
			}
			onClose();
		}, [contextMenu?.entityId, setRevealPosition, onClose]);

		const handleCopyId = useCallback(() => {
			if (contextMenu?.entityId) {
				navigator.clipboard.writeText(contextMenu.entityId);
			}
			onClose();
		}, [contextMenu?.entityId, onClose]);

		const handleShowConnections = useCallback(() => {
			if (connections.length > 0) {
				setSelectedConnection(connections[0]);
				setIsMappingDialogOpen(true);
			}
			onClose();
		}, [connections, onClose]);

		const handleZoomToNode = useCallback(() => {
			if (contextMenu?.entityId) {
				// Select the entity first to ensure it's visible
				selectEntity(contextMenu.entityId);
				// Then zoom to it
				setZoomToNode(contextMenu.entityId);
			}
			onClose();
		}, [contextMenu?.entityId, selectEntity, setZoomToNode, onClose]);

		const handleOpenEntity = useCallback(
			(entityId: string) => {
				const encodedId = encodeURIComponent(entityId);
				navigate(`/entity/${encodedId}`);
			},
			[navigate],
		);

		const handleOpenConnection = useCallback((connection: EntityConnection) => {
			setSelectedConnection(connection);
			setIsMappingDialogOpen(true);
		}, []);

		const entityConnections = connections.filter(
			(c) =>
				c.sourceId === contextMenu?.entityId ||
				c.targetId === contextMenu?.entityId,
		);

		const isAllowedReportEntityType = useMemo(() => {
			return entity?.type === "table" || entity?.type === "view";
		}, [entity?.type]);

		const relatedMappingsCount = useMemo(() => {
			if (!relationsData || !contextMenu?.entityId) return 0;
			return (relationsData.mappings ?? []).length;
		}, [contextMenu?.entityId, relationsData]);

		const reportMenuDisabledReason = useMemo(() => {
			if (!contextMenu?.entityId) return "Сущность не выбрана";
			if (isRelationsLoading) return "Загрузка...";
			if (!entity) return "Не удалось определить сущность";
			if (!isAllowedReportEntityType)
				return "Отчёт доступен только для сущностей типа table или view";
			if (relatedMappingsCount === 0)
				return "Нет маппингов для выбранной витрины";
			return null;
		}, [
			contextMenu?.entityId,
			entity,
			isAllowedReportEntityType,
			isRelationsLoading,
			relatedMappingsCount,
		]);

		const handleDownloadJsonReport = useCallback(async () => {
			if (!contextMenu?.entityId) return;
			if (!relationsData) {
				toast.error("Нет текущих данных для формирования отчёта");
				return;
			}
			if (!entity) {
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

			const selectedEntityId = contextMenu.entityId;
			const mappings = relationsData.mappings ?? [];
			const relatedEntities = relationsData.relatedEntities ?? [];
			const entities = entity ? [entity, ...relatedEntities] : relatedEntities;

			const report = {
				generatedAt: new Date().toISOString(),
				format: "DATA_LINEAGE_REPORT_JSON",
				selectedEntityId,
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
		}, [
			contextMenu?.entityId,
			relationsData,
			entity,
			isAllowedReportEntityType,
			relatedMappingsCount,
			downloadJsonReport,
		]);

		const handleDownloadS2tReport = useCallback(async () => {
			if (!contextMenu?.entityId) return;
			if (!entity) {
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

			try {
				const fallbackName = buildDefaultFileName({
					entityName: entity.name ?? entity.id,
					schemaName: entity.namespace,
					extension: "xlsx",
				});
				await downloadS2tReport({
					entityId: contextMenu.entityId,
					fallbackFileName: fallbackName,
				});
			} catch {
				// Error already handled in hook
			}
		}, [
			contextMenu?.entityId,
			entity,
			isAllowedReportEntityType,
			relatedMappingsCount,
			downloadS2tReport,
		]);

		return (
			<>
				<Menu
					open={contextMenu !== null}
					onClose={onClose}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null
							? { top: contextMenu.y, left: contextMenu.x }
							: undefined
					}
				>
					{contextMenu && (
						<MenuItem disabled sx={{ opacity: "1 !important" }}>
							<ListItemText
								primary={contextMenu.entityName}
								secondary={contextMenu.entityType}
								primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
								secondaryTypographyProps={{ fontSize: 11 }}
							/>
						</MenuItem>
					)}
					<Divider />
					<MenuItem onClick={handleGoToEntity}>
						<ListItemIcon>
							<OpenInNew fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Открыть страницу" />
					</MenuItem>
					<MenuItem onClick={handleOpenInNewTab}>
						<ListItemIcon>
							<OpenInNew fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Открыть в новой вкладке" />
					</MenuItem>
					<Divider />
					<span title={reportMenuDisabledReason ?? undefined}>
						<MenuItem
							onClick={() => {
								handleDownloadJsonReport();
								onClose();
							}}
							disabled={Boolean(reportMenuDisabledReason)}
						>
							<ListItemIcon>
								{isRelationsLoading ? (
									<CircularProgress size={16} />
								) : (
									<Code fontSize="small" />
								)}
							</ListItemIcon>
							<ListItemText primary="Выгрузить JSON отчёт" />
						</MenuItem>
					</span>
					<span title={reportMenuDisabledReason ?? undefined}>
						<MenuItem
							onClick={() => {
								handleDownloadS2tReport();
								onClose();
							}}
							disabled={Boolean(reportMenuDisabledReason)}
						>
							<ListItemIcon>
								{isRelationsLoading ? (
									<CircularProgress size={16} />
								) : (
									<LinkIcon fontSize="small" />
								)}
							</ListItemIcon>
							<ListItemText primary="Скачать S2T отчёт (.xlsx)" />
						</MenuItem>
					</span>
					<Divider />
					<MenuItem onClick={handleZoomToNode}>
						<ListItemIcon>
							<CenterFocusStrong fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в графе" />
					</MenuItem>
					{/* <MenuItem onClick={handleShowInEditor}>
						<ListItemIcon>
							<Code fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в редакторе" />
					</MenuItem> */}
					<MenuItem onClick={handleCopyId}>
						<ListItemIcon>
							<ContentCopy fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Копировать ID" />
					</MenuItem>
					{entityConnections.length > 0 && (
						<MenuItem onClick={handleShowConnections}>
							<ListItemIcon>
								<LinkIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText primary="Показать маппинги" />
						</MenuItem>
					)}
				</Menu>

				{/* Entity Details Dialog */}
				{entity && (
					<EntityDetailsDialog
						open={isEntityDialogOpen}
						onClose={() => setIsEntityDialogOpen(false)}
						entity={entity}
						connections={entityConnections}
						onOpenEntity={handleOpenEntity}
						onOpenConnection={handleOpenConnection}
					/>
				)}

				{/* Mapping Details Dialog */}
				{selectedConnection && (
					<MappingDetailsDialog
						open={isMappingDialogOpen}
						onClose={() => {
							setIsMappingDialogOpen(false);
							setSelectedConnection(null);
						}}
						connection={selectedConnection}
					/>
				)}
			</>
		);
	},
);

EntityContextMenu.displayName = "EntityContextMenu";
