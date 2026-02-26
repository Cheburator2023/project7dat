import { memo } from "react";
import { Box } from "@mui/material";
import {
	alpha,
	keyframes,
	styled,
	useTheme,
	type SxProps,
	type Theme,
} from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

const shimmer = keyframes`
	0% { transform: translateX(-120%); }
	100% { transform: translateX(120%); }
`;

const Root = styled(Box, {
	shouldForwardProp: (prop) =>
		prop !== "borderRadius" && prop !== "disableAnimation" && prop !== "tint",
})<{
	borderRadius: number | string;
	disableAnimation: boolean;
	tint: "default" | "subtle";
}>(({ theme, borderRadius, disableAnimation, tint }) => {
	const textPrimary = theme.palette.text.primary;
	const base =
		tint === "subtle" ? alpha(textPrimary, 0.06) : alpha(textPrimary, 0.08);
	const highlight =
		tint === "subtle" ? alpha(textPrimary, 0.12) : alpha(textPrimary, 0.16);

	return {
		position: "relative",
		overflow: "hidden",
		borderRadius,
		backgroundColor: base,
		"&::after": disableAnimation
			? undefined
			: {
					content: '""',
					position: "absolute",
					inset: 0,
					transform: "translateX(-120%)",
					backgroundImage: `linear-gradient(90deg, transparent, ${highlight}, transparent)`,
					animation: `${shimmer} 1.25s ease-in-out infinite`,
				},
	};
});

export type SkeletonBlockProps = {
	width?: number | string;
	height?: number | string;
	borderRadius?: number | string;
	sx?: SxProps<Theme>;
	tint?: "default" | "subtle";
	"data-testid"?: string;
};

export const SkeletonBlock = memo(
	({
		width = "100%",
		height = 16,
		borderRadius = 10,
		sx,
		tint = "default",
		"data-testid": dataTestId,
	}: SkeletonBlockProps) => {
		const theme = useTheme();
		const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
			defaultMatches: false,
			noSsr: true,
		});

		return (
			<div
				style={{
					padding: "8px",
					height: "100%",
					width: "100%",
				}}
			>
				<Root
					data-testid={dataTestId}
					borderRadius={borderRadius}
					disableAnimation={reduceMotion}
					tint={tint}
					sx={{
						width,
						height,
						boxShadow:
							theme.palette.mode === "dark"
								? "0 0 0 1px rgba(255,255,255,0.04) inset"
								: "0 0 0 1px rgba(0,0,0,0.04) inset",
						...sx,
					}}
				/>
			</div>
		);
	},
);

SkeletonBlock.displayName = "SkeletonBlock";
