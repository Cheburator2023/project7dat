import { memo } from "react";
import { Chip } from "@mui/material";
import { useEntitiesStore } from "../stores";

export const SelectedEntityChip = memo(() => {
	const { selectedEntityId, clearHighlights } = useEntitiesStore();

	if (!selectedEntityId) return null;

	const truncatedLabel =
		selectedEntityId.length > 40
			? `${selectedEntityId.slice(0, 40)}...`
			: selectedEntityId;

	return (
		<div title={`Выбрано: ${selectedEntityId}`}>
			<Chip
				label={`Выбрано: ${truncatedLabel}`}
				onDelete={clearHighlights}
				color="default"
			/>
		</div>
	);
});

SelectedEntityChip.displayName = "SelectedEntityChip";
