import { memo } from "react";
import { Box, CircularProgress } from "@mui/material";

interface LoadingSpinnerProps {
	size?: number;
}

export const LoadingSpinner = memo(({ size = 24 }: LoadingSpinnerProps) => (
	<Box
		sx={{
			height: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			p: 4,
		}}
	>
		<CircularProgress size={size} />
	</Box>
));

LoadingSpinner.displayName = "LoadingSpinner";
