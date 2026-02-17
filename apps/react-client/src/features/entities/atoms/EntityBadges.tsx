import { memo } from "react";
import { Chip } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";

interface EntityBadgesProps {
	isDataMart?: boolean;
	isSource?: boolean;
	modified?: boolean;
}

export const EntityBadges = memo(
	({ isDataMart, isSource, modified }: EntityBadgesProps) => {
		if (!isDataMart && !isSource && !modified) return null;

		return (
			<Flex
				justifyContent="center"
				alignItems="center"
				width="100%"
				height="100%"
			>
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
			</Flex>
		);
	},
);

EntityBadges.displayName = "EntityBadges";
