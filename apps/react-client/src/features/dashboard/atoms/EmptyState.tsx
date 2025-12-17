import { memo, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
	icon: ReactNode;
	message: string;
}

export const EmptyState = memo(({ icon, message }: EmptyStateProps) => (
	<Box sx={{ p: 4, textAlign: "center" }}>
		<Box sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}>{icon}</Box>
		<Typography color="text.secondary">{message}</Typography>
	</Box>
));

EmptyState.displayName = "EmptyState";
