import { cn } from "@react-client/features/json4u/lib/utils";
import type React from "react";
import { forwardRef } from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Section = forwardRef<HTMLDivElement, SectionProps>(
	({ className, children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				{...props}
				className={cn(
					"relative w-full flex flex-col items-center justify-center text-left",
					className,
				)}
			>
				{children}
			</div>
		);
	},
);
