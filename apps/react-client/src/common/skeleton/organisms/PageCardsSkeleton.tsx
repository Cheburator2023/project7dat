import { memo } from "react";
import { Box } from "@mui/material";
import { SkeletonCard } from "@react-client/common/skeleton/molecules/SkeletonCard";

export type PageCardsSkeletonProps = {
	cards?: number;
};

export const PageCardsSkeleton = memo(
	({ cards = 6 }: PageCardsSkeletonProps) => {
		return (
			<Box
				data-testid="skeleton-page-cards"
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "repeat(2, minmax(0, 1fr))",
						lg: "repeat(3, minmax(0, 1fr))",
					},
					gap: 2,
				}}
			>
				{Array.from({ length: cards }).map((_, idx) => (
					<SkeletonCard key={idx} />
				))}
			</Box>
		);
	},
);

PageCardsSkeleton.displayName = "PageCardsSkeleton";
