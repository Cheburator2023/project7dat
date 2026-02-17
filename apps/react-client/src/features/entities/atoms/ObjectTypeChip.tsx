import { memo } from "react";
import { Chip } from "@mui/material";

type ObjectType = "Источник" | "Витрина" | "Признак";

interface ObjectTypeChipProps {
	type: ObjectType;
	size?: "small" | "medium";
}

const OBJECT_TYPE_COLORS: Record<ObjectType, { bg: string; color: string }> = {
	Источник: { bg: "#e0f2f1", color: "#00897b" },
	Витрина: { bg: "#f3e5f5", color: "#9c27b0" },
	Признак: { bg: "#e3f2fd", color: "#1976d2" },
};

export const ObjectTypeChip = memo(
	({ type, size = "small" }: ObjectTypeChipProps) => {
		const colors = OBJECT_TYPE_COLORS[type];
		return (
			<Chip
				label={type}
				size={size}
				sx={{ bgcolor: colors.bg, color: colors.color }}
			/>
		);
	},
);

ObjectTypeChip.displayName = "ObjectTypeChip";
