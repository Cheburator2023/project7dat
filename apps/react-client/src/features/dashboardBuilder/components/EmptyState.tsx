import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";

interface EmptyStateProps {
	onAddClick: () => void;
}

export const EmptyState = ({ onAddClick }: EmptyStateProps) => {
	return (
		<EmptyContainer>
			<ContentWrapper>
				<Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
					Дашборд пуст
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
					Нажмите кнопку ниже, чтобы начать создание дашборда
				</Typography>
				<Tooltip title="Создать дашборд" arrow>
					<AddButton onClick={onAddClick}>
						<AddIcon sx={{ fontSize: 48 }} />
					</AddButton>
				</Tooltip>
			</ContentWrapper>
		</EmptyContainer>
	);
};

const EmptyContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: theme.palette.background.default,
	border: `2px dashed ${theme.palette.divider}`,
	borderRadius: 16,
	margin: theme.spacing(2),
}));

const ContentWrapper = styled(Box)({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	textAlign: "center",
});

const AddButton = styled(IconButton)(({ theme }) => ({
	width: 80,
	height: 80,
	backgroundColor: theme.palette.primary.main,
	color: theme.palette.primary.contrastText,
	"&:hover": {
		backgroundColor: theme.palette.primary.dark,
		transform: "scale(1.1)",
	},
	transition: "all 0.2s ease",
}));
