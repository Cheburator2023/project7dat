import { Box, LinearProgress, Typography } from "@mui/material";

export const LoadingOverlay = ({
	open,
	progress,
	title,
}: {
	open: boolean;
	progress: number;
	title?: string;
}) => {
	if (!open) return null;

	return (
		<Box
			id="main_data_loader"
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				backdropFilter: "blur(2px)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 9999,
			}}
		>
			<Box
				sx={{
					width: "400px",
					backgroundColor: "background.paper",
					borderRadius: "12px",
					padding: "32px",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
				}}
			>
				<Typography
					variant="h6"
					sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}
				>
					{title ?? "Загрузка данных..."}
				</Typography>
				<LinearProgress
					variant="determinate"
					value={progress}
					sx={{
						height: "8px",
						borderRadius: "4px",
						mb: 2,
					}}
				/>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ textAlign: "center" }}
				>
					{Math.round(progress)}%
				</Typography>
			</Box>
		</Box>
	);
};
