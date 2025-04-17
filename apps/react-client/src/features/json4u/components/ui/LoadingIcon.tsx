import { cn } from "@react-client/features/json4u/lib/utils";
import { LoaderCircle } from "lucide-react";

export interface LoadingIconProps {
	loading?: boolean;
	className?: string;
}

export const LoadingIcon = ({
	loading = true,
	className,
}: LoadingIconProps) => (
	<LoaderCircle
		className={cn("animate-spin mr-2", className, !loading && "hidden")}
	/>
);
