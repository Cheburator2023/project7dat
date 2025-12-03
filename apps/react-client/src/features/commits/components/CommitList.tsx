import React, { memo } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	CircularProgress,
} from "@mui/material";
import type { JsonCommitItem } from "@react-client/api/hooks/jsonDataApi";
import { CommitCard } from "./CommitCard";

interface CommitListProps {
	commits: JsonCommitItem[];
	isLoading?: boolean;
	emptyMessage?: string;
	onCommitClick?: (commitId: string) => void;
	showDiff?: boolean;
	compact?: boolean;
}

/**
 * Список коммитов
 */
export const CommitList: React.FC<CommitListProps> = memo(
	({
		commits,
		isLoading = false,
		emptyMessage = "Нет коммитов",
		onCommitClick,
		showDiff = true,
		compact = false,
	}) => {
		if (isLoading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			);
		}

		if (!commits || commits.length === 0) {
			return (
				<Box sx={{ py: 4, textAlign: "center" }}>
					<Typography color="text.secondary">{emptyMessage}</Typography>
				</Box>
			);
		}

		return (
			<List sx={{ p: 0 }}>
				{commits.map((commit) => (
					<ListItem key={commit.id} sx={{ px: 0, p: 0, mb: 1 }}>
						<CommitCard
							commit={commit}
							onClick={onCommitClick}
							showDiff={showDiff}
							compact={compact}
						/>
					</ListItem>
				))}
			</List>
		);
	},
);

CommitList.displayName = "CommitList";
