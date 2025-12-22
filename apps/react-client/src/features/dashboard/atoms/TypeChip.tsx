import { memo } from "react";
import { Chip } from "@mui/material";
import { TYPE_COLORS } from "../constants";

interface TypeChipProps {
	type: string;
	size?: "small" | "medium";
}

export const TypeChip = memo(({ type, size = "small" }: TypeChipProps) => {
	const colors = TYPE_COLORS[type] || TYPE_COLORS.table;
	return (
		<Chip
			label={type}
			size={size}
			sx={{
				bgcolor: colors.bg,
				color: colors.text,
				border: `1px solid ${colors.border}`,
			}}
		/>
	);
});

TypeChip.displayName = "TypeChip";
