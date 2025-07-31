import { IconButton, Badge } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/NotificationsNone";
import { useNotificationStore } from "../../stores/notificationStore";

export const NotificationButton = () => {
	const { unreadCount, setDrawerOpen } = useNotificationStore();

	const handleClick = () => {
		setDrawerOpen(true);
	};

	return (
		<Badge
			variant="dot"
			badgeContent={unreadCount}
			color="error"
			max={99}
			showZero={false}
		>
			<IconButton onClick={handleClick} size="small" title="Уведомления">
				<NotificationsIcon />
			</IconButton>
		</Badge>
	);
};
