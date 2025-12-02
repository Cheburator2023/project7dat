import { memo } from "react";
import { Box, Typography, Chip, Divider } from "@mui/material";
import { Hub as HubIcon } from "@mui/icons-material";

import { useDashboardStore } from "../stores";
import { HIGHLIGHT_COLORS } from "../constants";

export const SelectionInfoPanel = memo(() => {
	const {
		selectedEntityId,
		selectedAttributeName,
		upstreamEntities,
		downstreamEntities,
		clearHighlights,
	} = useDashboardStore();

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
			<Typography variant="h6" gutterBottom>
				Информация о выборе
			</Typography>

			{selectedEntityId ? (
				<Box>
					<Box sx={{ mb: 2 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Выбранная сущность
						</Typography>
						<Chip
							label={selectedEntityId}
							color="primary"
							onDelete={clearHighlights}
							sx={{ mt: 0.5 }}
						/>
					</Box>

					{selectedAttributeName && (
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle2" color="text.secondary">
								Выбранный атрибут
							</Typography>
							<Chip
								label={selectedAttributeName}
								color="secondary"
								sx={{ mt: 0.5 }}
							/>
						</Box>
					)}

					<Divider sx={{ my: 2 }} />

					<Box sx={{ mb: 2 }}>
						<Typography
							variant="subtitle2"
							sx={{ color: HIGHLIGHT_COLORS.upstream }}
						>
							↑ Upstream ({upstreamEntities.size})
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
							{Array.from(upstreamEntities)
								.slice(0, 10)
								.map((id) => (
									<Chip key={id} label={id} size="small" variant="outlined" />
								))}
							{upstreamEntities.size > 10 && (
								<Chip label={`+${upstreamEntities.size - 10}`} size="small" />
							)}
						</Box>
					</Box>

					<Box>
						<Typography
							variant="subtitle2"
							sx={{ color: HIGHLIGHT_COLORS.downstream }}
						>
							↓ Downstream ({downstreamEntities.size})
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
							{Array.from(downstreamEntities)
								.slice(0, 10)
								.map((id) => (
									<Chip key={id} label={id} size="small" variant="outlined" />
								))}
							{downstreamEntities.size > 10 && (
								<Chip label={`+${downstreamEntities.size - 10}`} size="small" />
							)}
						</Box>
					</Box>
				</Box>
			) : (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<HubIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
					<Typography color="text.secondary">
						Выберите сущность для просмотра информации о связях
					</Typography>
				</Box>
			)}
		</Box>
	);
});

SelectionInfoPanel.displayName = "SelectionInfoPanel";
