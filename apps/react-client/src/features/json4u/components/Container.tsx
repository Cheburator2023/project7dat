import { Separator } from "@react-client/features/json4u/components/ui/separator";
import type { CommandMode } from "@react-client/features/json4u/stores/statusStore";
import type { HTMLAttributes, ReactNode } from "react";

export function Container({
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className="relative w-full h-full flex flex-col" {...props}>
			{children}
		</div>
	);
}

interface ContainerHeaderProps extends HTMLAttributes<HTMLDivElement> {
	mode?: CommandMode;
	modeHeaders?: Record<CommandMode, ReactNode>;
}

export function ContainerHeader({
	children,
	mode,
	modeHeaders,
	...props
}: ContainerHeaderProps) {
	return (
		<>
			<div className="flex items-center w-full min-h-header px-4" {...props}>
				{children}
			</div>
		</>
	);
}

export function ContainerContent({
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className="w-full max-h-full flex-grow" {...props}>
			{children}
		</div>
	);
}
