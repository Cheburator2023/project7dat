import { memo } from "react";
import { Typography } from "@mui/material";
import { HIGHLIGHT_COLORS } from "../constants";
import { Flex } from "@react-client/common/primitives/Flex";

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

		return (
			<Flex
				justifyContent="center"
				alignItems="center"
				width="100%"
				height="100%"
			>
				<Typography sx={{ color, fontWeight: 500, fontSize: "11px" }}>
					{count}
				</Typography>
			</Flex>
		);
	},
);

ConnectionCount.displayName = "ConnectionCount";
