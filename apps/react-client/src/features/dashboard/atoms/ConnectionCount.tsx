import { memo } from "react";
import { Typography } from "@mui/material";
import { HIGHLIGHT_COLORS } from "../constants";

interface ConnectionCountProps {
	count: number;
	direction: "upstream" | "downstream";
}

export const ConnectionCount = memo(
	({ count, direction }: ConnectionCountProps) => {
		if (count === 0) return null;

		const color =
			direction === "upstream"
				? HIGHLIGHT_COLORS.upstream
				: HIGHLIGHT_COLORS.downstream;

		return <Typography sx={{ color, fontWeight: 500 }}>{count}</Typography>;
	},
);

ConnectionCount.displayName = "ConnectionCount";
