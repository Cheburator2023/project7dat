import { cn } from "@react-client/features/json4u/lib/utils";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { LoaderCircle } from "lucide-react";

interface LoadingProps {
	className?: string;
}
export function Loading({ className }: LoadingProps) {
	const t = useTranslations();
	return (
		<div
			className={cn(
				"z-10 h-screen flex items-center justify-center",
				className,
			)}
		>
			<LoaderCircle className="animate-spin icon mr-2" />
			{`${t("Loading")}...`}
		</div>
	);
}
