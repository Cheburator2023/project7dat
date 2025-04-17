"use client";

import { Typography } from "@mui/material";
import AccountPanel from "@react-client/features/json4u/components/AccountPanel";
import RLinkButton from "@react-client/features/json4u/components/LinkButton";
import UserAvatar from "@react-client/features/json4u/components/UserAvatar";
import { env } from "@react-client/features/json4u/lib/env";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { CircleUserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import LinkButton from "./LinkButton";
import PopoverBtn from "./PopoverButton";

interface AccountButtonProps {
	avatarClassName: string;
	buttonClassName?: string;
	notOnSideNav?: boolean;
}

export default function AccountButton({
	notOnSideNav,
	avatarClassName,
	buttonClassName,
}: AccountButtonProps) {
	const path = usePathname();
	const t = useTranslations("Home");
	const user = useUserStore((state) => state.user);
	const setUser = useUserStore((state) => state.setUser);
	const nameOrEmail = user?.user_metadata?.name || user?.email;
	const loginHref = {
		pathname: "/login",
		query: {
			redirectTo: `${env.NEXT_PUBLIC_APP_URL}${path}`,
		},
	};

	if (user) {
		return (
			<PopoverBtn
				icon={
					<UserAvatar
						className={avatarClassName}
						name={nameOrEmail}
						url={user.user_metadata.avatar_url}
					/>
				}
				title={nameOrEmail}
				notOnSideNav={notOnSideNav}
				className={buttonClassName}
				content={<AccountPanel />}
				contentClassName="p-0"
			/>
		);
	} else if (notOnSideNav) {
		return (
			<RLinkButton
				variant="outline"
				className={buttonClassName}
				href={loginHref}
			>
				<Typography className="text-primary">{t("login")}</Typography>
			</RLinkButton>
		);
	} else {
		return (
			<LinkButton
				icon={<CircleUserRound className="icon" />}
				title={t("login")}
				className={buttonClassName}
				href={loginHref}
			/>
		);
	}
}
