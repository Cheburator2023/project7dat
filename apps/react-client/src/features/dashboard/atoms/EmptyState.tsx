import { memo } from "react";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
	message: string;
}

export const EmptyState = memo(({ message }: EmptyStateProps) => (
	<Box sx={{ p: 4, textAlign: "center" }}>
		<Typography color="text.secondary">{message}</Typography>
	</Box>
));
