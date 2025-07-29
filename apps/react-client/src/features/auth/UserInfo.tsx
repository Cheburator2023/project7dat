import { Avatar, Box, Chip, Typography } from "@mui/material";
import { useAuthStore } from "../../common/store/authStore";

interface UserInfoProps {
	variant?: "compact" | "detailed";
}

export const UserInfo = ({ variant = "compact" }: UserInfoProps) => {
	const { userInfo, isAuthenticated } = useAuthStore();

	if (!isAuthenticated || !userInfo) {
		return null;
	}

	const getInitials = (firstName: string, lastName: string) => {
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	};

	if (variant === "compact") {
		return (
			<Box display="flex" alignItems="center" gap={1}>
				<Avatar title={`${userInfo.firstName} ${userInfo.lastName}`}>
					{getInitials(userInfo.firstName, userInfo.lastName)}
				</Avatar>
				<Typography variant="body2" title={userInfo.email}>
					{userInfo.username}
				</Typography>
			</Box>
		);
	}

	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<Box display="flex" alignItems="center" gap={2}>
				<Avatar title={`${userInfo.firstName} ${userInfo.lastName}`}>
					{getInitials(userInfo.firstName, userInfo.lastName)}
				</Avatar>
				<Box>
					<Typography variant="h6">
						{userInfo.firstName} {userInfo.lastName}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{userInfo.email}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						@{userInfo.username}
					</Typography>
				</Box>
			</Box>

			{userInfo.roles.length > 0 && (
				<Box>
					<Typography variant="subtitle2" gutterBottom>
						Roles
					</Typography>
					<Box display="flex" gap={1} flexWrap="wrap">
						{userInfo.roles.map((role) => (
							<Chip key={role} label={role} size="small" variant="outlined" />
						))}
					</Box>
				</Box>
			)}

			{userInfo.groups.length > 0 && (
				<Box>
					<Typography variant="subtitle2" gutterBottom>
						Groups
					</Typography>
					<Box display="flex" gap={1} flexWrap="wrap">
						{userInfo.groups.map((group) => (
							<Chip key={group} label={group} size="small" />
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
};
