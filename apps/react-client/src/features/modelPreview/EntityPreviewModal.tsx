import React from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	styled,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEntityPreviewStore } from "@react-client/stores/entityPreviewStore";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { ModelPreviewPage } from "./ModelPreviewPage";

export const EntityPreviewModal: React.FC = () => {
	const { isPreviewOpen, selectedEntityId, closePreview } =
		useEntityPreviewStore(
			useShallow((state) => ({
				isPreviewOpen: state.isPreviewOpen,
				selectedEntityId: state.selectedEntityId,
				closePreview: state.closePreview,
			})),
		);

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);

	const entity = React.useMemo(() => {
		if (!currentGraph?.entities || !selectedEntityId) return null;
		return currentGraph.entities.find((e) => e.id === selectedEntityId) || null;
	}, [currentGraph?.entities, selectedEntityId]);

	const handleClose = () => {
		closePreview();
	};

	if (!isPreviewOpen || !selectedEntityId) {
		return null;
	}

	return (
		<StyledDialog
			open={isPreviewOpen}
			onClose={handleClose}
			maxWidth="xl"
			fullWidth
			PaperProps={{
				sx: {
					height: "90vh",
					maxHeight: "90vh",
				},
			}}
		>
			<DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center" }}>
				<span style={{ flex: 1 }}>
					Просмотр сущности: {entity?.namespace ? `${entity.namespace}.` : ""}
					{entity?.name || selectedEntityId}
				</span>
				<IconButton
					aria-label="close"
					onClick={handleClose}
					sx={{
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers sx={{ p: 0, height: "100%" }}>
				<ModelPreviewPage entityId={selectedEntityId} />
			</DialogContent>
		</StyledDialog>
	);
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
	"& .MuiDialogContent-root": {
		padding: 0,
		overflow: "hidden",
	},
	"& .MuiDialogTitle-root": {
		borderBottom: `1px solid ${theme.palette.divider}`,
	},
}));
