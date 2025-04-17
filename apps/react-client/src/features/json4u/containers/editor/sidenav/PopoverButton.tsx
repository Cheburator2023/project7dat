import { Button } from "@mui/material";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@react-client/features/json4u/components/ui/popover";
import { cn } from "@react-client/features/json4u/lib/utils";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";

export const popoverBtnClass = "popover-btn";

interface PopoverBtnProps {
	title: string;
	icon: React.ReactNode;
	content: React.ReactNode;
	className?: string;
	contentClassName?: string;
	asChild?: boolean;
	notOnSideNav?: boolean;
}

export function PopoverBtn({
	icon,
	title,
	notOnSideNav,
	className,
	contentClassName,
	asChild,
	content,
}: PopoverBtnProps) {
	const setSideNavExpanded = useStatusStore(
		(state) => state.setSideNavExpanded,
	);

	return (
		<Popover
			onOpenChange={
				notOnSideNav ? undefined : (open) => open && setSideNavExpanded(false)
			}
		>
			<PopoverTrigger asChild>
				<Button
					size="small"
					variant="outlined"
					className={cn(className, notOnSideNav && "w-10")}
					title={title}
				>
					{icon}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				asChild={asChild}
				side={notOnSideNav ? "bottom" : "right"}
				sideOffset={notOnSideNav ? 10 : 5}
				className={cn("w-fit", popoverBtnClass, contentClassName)}
			>
				{content}
			</PopoverContent>
		</Popover>
	);
}
