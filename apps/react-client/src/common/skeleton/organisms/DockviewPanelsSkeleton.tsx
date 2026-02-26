import { memo } from "react";
import { Box } from "@mui/material";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";
import { SkeletonList } from "@react-client/common/skeleton/molecules/SkeletonList";

export type DockviewPanelsSkeletonProps = {
	panels?: number;
};

export const DockviewPanelsSkeleton = memo(
	({ panels = 1 }: DockviewPanelsSkeletonProps) => {
		return (
			<Box
				data-testid="skeleton-dockview"
				sx={{
					height: "100%",
					width: "100%",
					display: "grid",
					gridTemplateColumns:
						panels === 1 ? "1fr" : `repeat(${panels}, minmax(0, 1fr))`,
					gap: 1.5,
				}}
			>
				{Array.from({ length: panels }).map((_, idx) => (
					<Box
						key={idx}
						data-testid={`skeleton-dockview-panel-${idx}`}
						sx={{
							borderRadius: 1,
							border: "1px solid rgba(127,127,127,0.18)",
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
							minHeight: 0,
						}}
					>
						<Box
							data-testid={`skeleton-dockview-panel-${idx}-header`}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								px: 1,
								py: 0.75,
								borderBottom: "1px solid rgba(127,127,127,0.18)",
							}}
						>
							<SkeletonBlock height={20} width={120} borderRadius={10} />
							<SkeletonBlock
								height={20}
								width={72}
								borderRadius={10}
								tint="subtle"
							/>
							<Box sx={{ flex: 1 }} />
							<SkeletonBlock
								height={20}
								width={28}
								borderRadius={8}
								tint="subtle"
							/>
						</Box>
						<Box
							data-testid={`skeleton-dockview-panel-${idx}-content`}
							sx={{ flex: 1, minHeight: 0, p: 1 }}
						>
							<SkeletonList rows={24} rowHeight={16} />
						</Box>
					</Box>
				))}
			</Box>
		);
	},
);

DockviewPanelsSkeleton.displayName = "DockviewPanelsSkeleton";
