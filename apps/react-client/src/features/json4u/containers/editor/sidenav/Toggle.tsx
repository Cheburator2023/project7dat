import { Toggle as RToggle } from "@react-client/features/json4u/components/ui/toggle";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@react-client/features/json4u/components/ui/tooltip";
import { cn } from "@react-client/features/json4u/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { type ComponentRef, forwardRef } from "react";
import { btnVariants } from "./Button";
import { IconLabel } from "./IconLabel";

interface ToggleProps extends VariantProps<typeof btnVariants> {
	icon: React.ReactNode;
	title: string;
	description: string;
	isPressed: boolean;
	onPressedChange: (pressed: boolean) => void;
	className?: string;
}

export const Toggle = forwardRef<ComponentRef<typeof RToggle>, ToggleProps>(
	(
		{
			title,
			description,
			isPressed,
			onPressedChange,
			icon,
			className,
			...props
		},
		ref,
	) => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					{/* https://github.com/radix-ui/primitives/discussions/560#discussioncomment-3477536 */}
					<span>
						<RToggle
							className={cn(
								btnVariants({}),
								"text-btn hover:bg-muted",
								className,
							)}
							ref={ref}
							defaultPressed={isPressed}
							pressed={isPressed}
							onPressedChange={onPressedChange}
							{...props}
						>
							<IconLabel icon={icon} title={title} />
						</RToggle>
					</span>
				</TooltipTrigger>
				<TooltipContent side="right" className="max-w-72">
					<p>{description}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
);
