import { Button } from "@mui/material";
import { Input } from "@react-client/features/json4u/components/ui/input";
import { Label } from "@react-client/features/json4u/components/ui/label";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { CopyIcon } from "lucide-react";

export function SharePopover() {
	const t = useTranslations();

	return (
		<div className={"w-[360px]"}>
			<div className="flex flex-col space-y-2 text-center sm:text-left">
				<h3 className="text-lg font-semibold">{t("Share")}</h3>
				<p className="text-sm text-muted-foreground">{t("share_desc")}</p>
			</div>
			<div className="flex items-center space-x-2 pt-4">
				<div className="grid flex-1 gap-2">
					<Label htmlFor="link" className="sr-only">
						{t("Link")}
					</Label>
					<Input
						id="link"
						defaultValue="https://json4u.com/en/editor?share=aUuXS"
						readOnly
						className="h-9"
					/>
				</div>
				<Button type="submit" size="small" className="px-3">
					<span className="sr-only">{t("Copy")}</span>
					<CopyIcon />
				</Button>
			</div>
		</div>
	);
}
