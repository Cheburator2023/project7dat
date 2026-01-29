import React from "react";
import { Button, Menu, MenuItem, ListItemText } from "@mui/material";
import PreviewIcon from "@mui/icons-material/Preview";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useEntityPreviewStore } from "@react-client/stores/entityPreviewStore";
import { useShallow } from "zustand/react/shallow";

export const EntityPreviewButton: React.FC = () => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);

	const { openPreview } = useEntityPreviewStore(
		useShallow((state) => ({
			openPreview: state.openPreview,
		})),
	);

	const entities = currentGraph?.entities || [];

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (entities.length === 0) return;

		if (entities.length === 1) {
			// If there's only one entity, open it directly
			openPreview(entities[0].id);
		} else {
			// If there are multiple entities, show a menu
			setAnchorEl(event.currentTarget);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleEntitySelect = (entityId: string) => {
		openPreview(entityId);
		handleClose();
	};

	const hasEntities = entities.length > 0;

	return (
		<>
			<Button
				variant="outlined"
				size="small"
				startIcon={<PreviewIcon />}
				onClick={handleClick}
				disabled={!hasEntities}
				title={hasEntities ? "Просмотр сущности" : "Нет доступных сущностей"}
			>
				Просмотр сущности
			</Button>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					"aria-labelledby": "entity-preview-button",
				}}
			>
				{entities.map((entity) => (
					<MenuItem
						key={entity.id}
						onClick={() => handleEntitySelect(entity.id)}
					>
						<ListItemText
							primary={entity.name || entity.id}
							secondary={
								entity.namespace
									? `${entity.namespace} • ${entity.type}`
									: entity.type
							}
						/>
					</MenuItem>
				))}
			</Menu>
		</>
	);
};
