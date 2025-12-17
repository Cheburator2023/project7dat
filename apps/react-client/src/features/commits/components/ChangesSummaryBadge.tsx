import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	Edit as EditIcon,
} from "@mui/icons-material";
import type { CommitChanges } from "@react-client/api/hooks/jsonDataApi";

interface ChangesSummaryBadgeProps {
	changes: CommitChanges | null | undefined;
	compact?: boolean;
}

/**
 * Компонент для отображения сводки изменений коммита
 */
export const ChangesSummaryBadge: React.FC<ChangesSummaryBadgeProps> = ({
	changes,
	compact = false,
}) => {
	if (!changes) {
		return null;
	}

	const { summary } = changes;
	const hasEntityChanges =
		summary.entities.added > 0 ||
		summary.entities.removed > 0 ||
		summary.entities.modified > 0;
	const hasMappingChanges =
		summary.mappings.added > 0 ||
		summary.mappings.removed > 0 ||
		summary.mappings.modified > 0;

	if (!hasEntityChanges && !hasMappingChanges) {
		return null;
	}

	if (compact) {
		return (
			<Tooltip
				title={
					<Box>
						<Typography variant="caption" display="block">
							Сущности: +{summary.entities.added} -{summary.entities.removed} ~
							{summary.entities.modified}
						</Typography>
						<Typography variant="caption" display="block">
							Маппинги: +{summary.mappings.added} -{summary.mappings.removed} ~
							{summary.mappings.modified}
						</Typography>
					</Box>
				}
			>
				<Chip
					size="small"
					label={`${summary.totalChanges} изм.`}
					color="info"
					variant="outlined"
				/>
			</Tooltip>
		);
	}

	return (
		<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
			{summary.entities.added > 0 && (
				<Chip
					size="small"
					icon={<AddIcon sx={{ fontSize: 14 }} />}
					label={`${summary.entities.added} сущн.`}
					color="success"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
			{summary.entities.removed > 0 && (
				<Chip
					size="small"
					icon={<RemoveIcon sx={{ fontSize: 14 }} />}
					label={`${summary.entities.removed} сущн.`}
					color="error"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
			{summary.entities.modified > 0 && (
				<Chip
					size="small"
					icon={<EditIcon sx={{ fontSize: 14 }} />}
					label={`${summary.entities.modified} сущн.`}
					color="warning"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
			{summary.mappings.added > 0 && (
				<Chip
					size="small"
					icon={<AddIcon sx={{ fontSize: 14 }} />}
					label={`${summary.mappings.added} связ.`}
					color="success"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
			{summary.mappings.removed > 0 && (
				<Chip
					size="small"
					icon={<RemoveIcon sx={{ fontSize: 14 }} />}
					label={`${summary.mappings.removed} связ.`}
					color="error"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
			{summary.mappings.modified > 0 && (
				<Chip
					size="small"
					icon={<EditIcon sx={{ fontSize: 14 }} />}
					label={`${summary.mappings.modified} связ.`}
					color="warning"
					variant="outlined"
					sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 11 } }}
				/>
			)}
		</Box>
	);
};
