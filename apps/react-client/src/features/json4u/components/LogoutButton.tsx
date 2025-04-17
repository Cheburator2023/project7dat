import { LoadingButton } from "@react-client/features/json4u/components/LoadingButton";
import {
	cn,
	toastErr,
	toastSucc,
} from "@react-client/features/json4u/lib/utils";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useRouter } from "next/navigation";
import { forwardRef, useState } from "react";
import type { ButtonProps } from "./ui/button";

export const LogoutButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, ...props }, ref) => {
		const t = useTranslations("Home");
		const router = useRouter();
		const [loading, setLoading] = useState(false);

		return (
			<LoadingButton
				ref={ref}
				className={cn("justify-start text-rose-600", className)}
				loading={loading}
				onClick={async () => {
					setLoading(true);

					setLoading(false);
					router.refresh();
				}}
			>
				{t("logout")}
			</LoadingButton>
		);
	},
);
