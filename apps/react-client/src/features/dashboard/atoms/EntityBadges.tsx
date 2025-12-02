import { memo } from "react";
import { Box, Chip } from "@mui/material";

interface EntityBadgesProps {
	isDataMart?: boolean;
	isSource?: boolean;
	modified?: boolean;
}

export const EntityBadges = memo(
	({ isDataMart, isSource, modified }: EntityBadgesProps) => {
		if (!isDataMart && !isSource && !modified) return null;

		return (
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
				{isDataMart && (
					<Chip
						label="витрина"
						size="small"
						sx={{
							bgcolor: "#9c27b0",
							color: "#fff",
							height: 18,
							fontSize: 10,
						}}
					/>
				)}
				{isSource && (
					<Chip
						label="источник"
						size="small"
						sx={{
							bgcolor: "#00897b",
							color: "#fff",
							height: 18,
							fontSize: 10,
						}}
					/>
				)}
				{modified && (
					<Chip
						label="изм."
						size="small"
						sx={{
							bgcolor: "#ff9800",
							color: "#fff",
							height: 18,
							fontSize: 10,
						}}
					/>
				)}
			</Box>
		);
	},
);

EntityBadges.displayName = "EntityBadges";
