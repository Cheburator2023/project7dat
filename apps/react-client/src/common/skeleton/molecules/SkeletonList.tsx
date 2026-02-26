import { memo } from "react";
import { Box } from "@mui/material";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";

export type SkeletonListProps = {
	rows?: number;
	rowHeight?: number;
	showLeadingIcon?: boolean;
};

export const SkeletonList = memo(
	({
		rows = 8,
		rowHeight = 18,
		showLeadingIcon = false,
	}: SkeletonListProps) => {
		return (
			<Box
				data-testid="skeleton-list"
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					padding: "8px",
				}}
			>
				{Array.from({ length: rows }).map((_, idx) => (
					<Box
						key={idx}
						data-testid={`skeleton-list-row-${idx}`}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0,
						}}
					>
						{showLeadingIcon ? (
							<SkeletonBlock
								height={rowHeight}
								width={rowHeight}
								borderRadius={8}
							/>
						) : null}
						<SkeletonBlock
							height={rowHeight}
							width={`${Math.max(1, 92 - Math.random() * 4 * 10)}%`}
							tint={idx % 2 === 0 ? "default" : "subtle"}
						/>
					</Box>
				))}
			</Box>
		);
	},
);

SkeletonList.displayName = "SkeletonList";
