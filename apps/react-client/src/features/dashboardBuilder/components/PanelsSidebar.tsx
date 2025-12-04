import { Box, Typography, Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AVAILABLE_PANELS } from "../constants";
import type { PanelDefinition } from "../types";

interface PanelsSidebarProps {
	onDragStart: (panel: PanelDefinition) => void;
}

export const PanelsSidebar = ({ onDragStart }: PanelsSidebarProps) => {
	return (
		<SidebarContainer>
			<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
				Доступные панели
			</Typography>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ mb: 2, display: "block" }}
			>
				Перетащите панель на лейаут
			</Typography>

			<PanelsList>
				{AVAILABLE_PANELS.map((panel) => (
					<Tooltip
						key={panel.id}
						title={panel.description}
						placement="left"
						arrow
					>
						<PanelCard
							draggable
							onDragStart={(e) => {
								e.dataTransfer.setData("panel", JSON.stringify(panel));
								onDragStart(panel);
							}}
						>
							<PanelIcon>{panel.icon}</PanelIcon>
							<PanelName>{panel.name}</PanelName>
						</PanelCard>
					</Tooltip>
				))}
			</PanelsList>
		</SidebarContainer>
	);
};

const SidebarContainer = styled(Box)(({ theme }) => ({
	width: 200,
	height: "100%",
	padding: theme.spacing(2),
	borderLeft: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
	display: "flex",
	flexDirection: "column",
}));

const PanelsList = styled(Box)({
	display: "flex",
	flexDirection: "column",
	gap: 8,
	overflowY: "auto",
	flex: 1,
});

const PanelCard = styled(Paper)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1.5),
	padding: theme.spacing(1.5),
	cursor: "grab",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	transition: "all 0.2s ease",
	"&:hover": {
		borderColor: theme.palette.primary.main,
		backgroundColor: theme.palette.action.hover,
		transform: "translateX(-2px)",
	},
	"&:active": {
		cursor: "grabbing",
	},
}));

const PanelIcon = styled("span")({
	fontSize: 18,
});

const PanelName = styled(Typography)({
	fontSize: 13,
	fontWeight: 500,
});
