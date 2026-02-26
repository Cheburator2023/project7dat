import { memo } from "react";
import { Box } from "@mui/material";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";

export type SkeletonCardProps = {
	height?: number;
};

export const SkeletonCard = memo(({ height = 140 }: SkeletonCardProps) => {
	return (
		<Box
			data-testid="skeleton-card"
			sx={{
				borderRadius: 1,
				p: 1,
				display: "flex",
				flexDirection: "column",
				gap: 2,
				height,
			}}
		>
			<SkeletonBlock height={22} width="62%" borderRadius={12} />
			<SkeletonBlock height={14} width="88%" tint="subtle" />
			<SkeletonBlock height={14} width="74%" tint="subtle" />
			<Box sx={{ flex: 1 }} />
			<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
				<SkeletonBlock height={28} width={96} borderRadius={999} />
				<SkeletonBlock
					height={28}
					width={72}
					borderRadius={999}
					tint="subtle"
				/>
			</Box>
		</Box>
	);
});

SkeletonCard.displayName = "SkeletonCard";
