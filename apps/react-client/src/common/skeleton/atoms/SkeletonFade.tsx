import { memo, type ReactNode } from "react";
import { Box } from "@mui/material";
import { usePresence } from "@react-client/common/hooks/usePresence";

export type SkeletonFadeProps = {
	loading: boolean;
	skeleton: ReactNode;
	children: ReactNode;
	exitDelayMs?: number;
	transitionMs?: number;
};

export const SkeletonFade = memo(
	({
		loading,
		skeleton,
		children,
		exitDelayMs = 180,
		transitionMs = 160,
	}: SkeletonFadeProps) => {
		const { isMounted: isSkeletonMounted } = usePresence({
			visible: loading,
			exitDelayMs,
		});
		const { isMounted: isContentMounted } = usePresence({
			visible: !loading,
			exitDelayMs,
		});

		if (!isSkeletonMounted && !isContentMounted) return null;

		return (
			<Box
				data-testid="skeleton-fade"
				sx={{
					position: "relative",
					display: "grid",
					gridTemplateColumns: "minmax(0, 1fr)",
					gridTemplateRows: "minmax(0, 1fr)",
					minHeight: 0,
					height: "100%",
					width: "100%",
					padding: 0,
				}}
			>
				{isSkeletonMounted ? (
					<Box
						data-testid="skeleton-fade-skeleton"
						sx={{
							gridArea: "1 / 1",
							opacity: loading ? 1 : 0,
							transition: `opacity ${transitionMs}ms ease`,
							willChange: "opacity",
							pointerEvents: "none",
							minHeight: 0,
						}}
					>
						{skeleton}
					</Box>
				) : null}
				{isContentMounted ? (
					<Box
						data-testid="skeleton-fade-content"
						sx={{
							gridArea: "1 / 1",
							opacity: loading ? 0 : 1,
							transition: `opacity ${transitionMs}ms ease`,
							willChange: "opacity",
							pointerEvents: loading ? "none" : "auto",
							minHeight: 0,
						}}
					>
						{children}
					</Box>
				) : null}
			</Box>
		);
	},
);

SkeletonFade.displayName = "SkeletonFade";
