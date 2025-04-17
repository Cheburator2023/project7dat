import {
	Button,
	type ButtonProps,
} from "@react-client/features/json4u/components/ui/button";
import { useEditorStore } from "@react-client/features/json4u/stores/editorStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { ArrowRightLeft } from "lucide-react";
import { forwardRef, useEffect } from "react";

export const SwapButton = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const t = useTranslations();
		const runCommand = useEditorStore((state) => state.runCommand);

		useEffect(() => {
			if (!runCommand) return;

			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
					e.preventDefault();
					e.stopPropagation();
					runCommand("swapLeftRight");
				}
			};

			document.addEventListener("keydown", onKeyDown);
			return () => document.removeEventListener("keydown", onKeyDown);
		}, [runCommand]);

		return (
			<Button
				title={t("swap_left_right")}
				size={size}
				variant={variant}
				className={className}
				onClick={() => runCommand("swapLeftRight")}
			>
				<ArrowRightLeft className="icon" />
			</Button>
		);
	},
);
