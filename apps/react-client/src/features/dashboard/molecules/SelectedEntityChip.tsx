import { memo } from "react";
import { Chip } from "@mui/material";
import { useDashboardStore } from "../stores";

export const SelectedEntityChip = memo(() => {
	const { selectedEntityId, clearHighlights } = useDashboardStore();

	if (!selectedEntityId) return null;

	return (
		<Chip
			label={`Выбрано: ${selectedEntityId}`}
			onDelete={clearHighlights}
			color="default"
		/>
	);
});

SelectedEntityChip.displayName = "SelectedEntityChip";
