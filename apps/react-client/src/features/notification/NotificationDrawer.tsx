import {
	Drawer,
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Chip,
	Divider,
	Button,
	Stack,
} from "@mui/material";
import {
	Close as CloseIcon,
	Delete as DeleteIcon,
	MarkEmailRead as MarkReadIcon,
} from "@mui/icons-material";
import { useNotificationStore } from "../../stores/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { Flex } from "@react-client/common/primitives/Flex";

const DRAWER_WIDTH = 400;

export const NotificationDrawer = () => {
	const {
		notifications,
		isDrawerOpen,
		setDrawerOpen,
		markAsRead,
		markAllAsRead,
		clearNotifications,
		removeNotification,
	} = useNotificationStore();

	const handleClose = () => {
		setDrawerOpen(false);
	};

	const formatTime = (timestamp: number) => {
		return formatDistanceToNow(new Date(timestamp), {
			addSuffix: true,
		});
	};

	const getMethodColor = (method: string) => {
		switch (method) {
			case "GET":
				return "primary";
			case "POST":
				return "success";
			case "PUT":
				return "warning";
			case "DELETE":
				return "error";
			default:
				return "default";
		}
	};

	return (
		<Drawer
			anchor="right"
			open={isDrawerOpen}
			onClose={handleClose}
			PaperProps={{
				sx: {
					width: DRAWER_WIDTH,
					maxWidth: "90vw",
				},
			}}
		>
			<Box sx={{ p: 2 }}>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					mb={2}
				>
					<Typography variant="h6">Уведомления</Typography>
					<IconButton onClick={handleClose} size="small">
						<CloseIcon />
					</IconButton>
				</Stack>

				{notifications.length > 0 && (
					<Stack width={"100%"} direction="row" spacing={1} mb={2}>
						<Button
							size="small"
							variant="outlined"
							fullWidth
							startIcon={<MarkReadIcon />}
							onClick={markAllAsRead}
						>
							Отметить все
						</Button>
						<Button
							size="small"
							variant="outlined"
							fullWidth
							color="error"
							startIcon={<DeleteIcon />}
							onClick={clearNotifications}
						>
							Очистить
						</Button>
					</Stack>
				)}

				<Divider />
			</Box>

			{notifications.length === 0 ? (
				<Box sx={{ p: 3, textAlign: "center" }}>
					<Typography variant="body2" color="text.secondary">
						Нет уведомлений
					</Typography>
				</Box>
			) : (
				<List sx={{ pt: 0 }}>
					{notifications.map((notification, index) => (
						<Box key={notification.id}>
							<ListItem
								secondaryAction={
									<Stack direction="column" spacing={1}>
										{!notification.read && (
											<IconButton
												size="small"
												onClick={() => markAsRead(notification.id)}
												title="Отметить как прочитанное"
											>
												<MarkReadIcon fontSize="small" />
											</IconButton>
										)}
										<IconButton
											size="small"
											onClick={() => removeNotification(notification.id)}
											title="Удалить уведомление"
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Stack>
								}
								sx={{
									backgroundColor: notification.read
										? "transparent"
										: "action.hover",
									borderRadius: 1,
									mx: 1,
									mb: 1,
								}}
							>
								{/* <ListItemIcon>
									{notification.type === "success" ? (
										<SuccessIcon color="success" />
									) : (
										<ErrorIcon color="error" />
									)}
								</ListItemIcon> */}
								<ListItemText
									primary={
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography
												variant="body2"
												fontWeight={notification.read ? "normal" : "medium"}
											>
												{notification.message}
											</Typography>
											<Chip
												label={notification.method}
												size="small"
												color={getMethodColor(notification.method) as any}
												variant="outlined"
											/>
										</Stack>
									}
									secondary={
										<Flex flexDirection="column" gap={0.5}>
											<Typography variant="caption" color="text.secondary">
												{notification.url}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{formatTime(notification.timestamp)}
											</Typography>
										</Flex>
									}
								/>
							</ListItem>
							{index < notifications.length - 1 && <Divider />}
						</Box>
					))}
				</List>
			)}
		</Drawer>
	);
};
