import { memo } from "react";
import { Box } from "@mui/material";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";

export type AgGridLikeSkeletonProps = {
	rows?: number;
	columns?: number;
	headerHeight?: number;
	rowHeight?: number;
};

export const AgGridLikeSkeleton = memo(
	({
		rows = 10,
		columns = 5,
		headerHeight = 32,
		rowHeight = 28,
	}: AgGridLikeSkeletonProps) => {
		return (
			<Box
				data-testid="skeleton-ag-grid"
				sx={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					borderRadius: 0.75,
					overflow: "hidden",
				}}
			>
				<Box
					data-testid="skeleton-ag-grid-header"
					sx={{
						display: "grid",
						gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
						gap: 1,
						borderBottom: "1px solid rgba(127,127,127,0.18)",
					}}
				>
					{Array.from({ length: columns }).map((_, idx) => (
						<SkeletonBlock
							key={idx}
							height={headerHeight - 12}
							width={`${70 - idx * 6}%`}
							borderRadius={8}
						/>
					))}
				</Box>
				<Box
					data-testid="skeleton-ag-grid-body"
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 0.75,
					}}
				>
					{Array.from({ length: rows }).map((_, rIdx) => (
						<Box
							key={rIdx}
							sx={{
								display: "grid",
								gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
								gap: 1,
								alignItems: "center",
							}}
						>
							{Array.from({ length: columns }).map((_, cIdx) => (
								<SkeletonBlock
									key={cIdx}
									height={rowHeight - 10}
									width={`${Math.max(42, 92 - cIdx * 10 - (rIdx % 3) * 6)}%`}
									tint={(rIdx + cIdx) % 3 === 0 ? "subtle" : "default"}
								/>
							))}
						</Box>
					))}
				</Box>
			</Box>
		);
	},
);

AgGridLikeSkeleton.displayName = "AgGridLikeSkeleton";
