import { Typography } from "@mui/material";
import { LogoutButton } from "@react-client/features/json4u/components/LogoutButton";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useShallow } from "zustand/react/shallow";

import { UserAvatar } from "./UserAvatar";

export function AccountPanel() {
	const t = useTranslations("Pricing");
	const { user } = useUserStore(
		useShallow((state) => ({
			user: state.user,
		})),
	);

	if (!user) {
		return null;
	}

	const name = user.user_metadata?.name;
	const email = user.email;

	return (
		<div className="flex flex-col text-left px-3 pt-4 pb-2">
			<div className="flex items-center gap-2 px-3 mb-3">
				<UserAvatar name={name || email} url={user.user_metadata.avatar_url} />
				{name ? (
					<div className="flex flex-col gap-1">
						<Typography>{name}</Typography>
						<Typography>{email}</Typography>
					</div>
				) : (
					<Typography>{email}</Typography>
				)}
			</div>
			<LogoutButton />
		</div>
	);
}
