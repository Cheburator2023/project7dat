import { memo, useCallback, useState } from "react";
import {
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
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
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useDashboardStore } from "../stores";
import {
	EntityDetailsDialog,
	MappingDetailsDialog,
} from "@react-client/features/entityPreview";
import type { EntityConnection } from "../types";

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
	({ contextMenu, onClose, entity, connections = [] }) => {
		const navigate = useNavigate();
		const { setRevealPosition } = useDataLineageStore();
		const { setZoomToNode, selectEntity } = useDashboardStore();

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
				window.open(`/entity/${encodedId}`, "_blank");
			}
			onClose();
		}, [contextMenu?.entityId, onClose]);

		const handleShowInEditor = useCallback(() => {
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
					<MenuItem onClick={handleZoomToNode}>
						<ListItemIcon>
							<CenterFocusStrong fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в графе" />
					</MenuItem>
					<MenuItem onClick={handleShowInEditor}>
						<ListItemIcon>
							<Code fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Показать в редакторе" />
					</MenuItem>
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
