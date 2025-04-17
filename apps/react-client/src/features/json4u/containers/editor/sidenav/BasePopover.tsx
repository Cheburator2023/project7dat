import { cn } from "@react-client/features/json4u/lib/utils";
import { useTranslations } from "@react-client/features/json4u/useTranslations";

export interface BasePopoverProps {
	title: any;
	children: React.ReactNode;
	optionsNode?: React.ReactNode;
	extraNode?: React.ReactNode;
	className?: string;
}

export function BasePopover({
	title,
	className,
	children,
	optionsNode,
	extraNode,
}: BasePopoverProps) {
	const t = useTranslations();

	return (
		<div className={cn("w-fit text-sm space-y-2", className)}>
			<div className="flex flex-col text-center sm:text-left">
				<h3 className="text-lg font-semibold mb-2">{t(title)}</h3>
				<div className="flex items-center gap-1">{children}</div>
			</div>
			{optionsNode && (
				<div className="flex flex-col text-center sm:text-left">
					{optionsNode}
				</div>
			)}
			{extraNode}
		</div>
	);
}
