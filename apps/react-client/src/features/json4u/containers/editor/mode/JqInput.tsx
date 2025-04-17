import type { Input } from "@react-client/features/json4u/components/ui/input";
import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import { jq } from "@react-client/features/json4u/lib/jq";
import { init as jqInit } from "@react-client/features/json4u/lib/jq";
import { toastErr, toastSucc } from "@react-client/features/json4u/lib/utils";
import { useEditorStore } from "@react-client/features/json4u/stores/editorStore";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	type FC,
	forwardRef,
} from "react";
import { useShallow } from "zustand/react/shallow";
import InputBox from "./InputBox";

function useExecJq() {
	const t = useTranslations();
	const { main, secondary } = useEditorStore(
		useShallow((state) => ({
			main: state.main,
			secondary: state.secondary,
		})),
	);
	const { viewMode, setViewMode } = useStatusStore(
		useShallow((state) => ({
			viewMode: state.viewMode,
			setViewMode: state.setViewMode,
			setCommandMode: state.setCommandMode,
		})),
	);
	const count = useUserStore((state) => state.count);

	return async (filter: string) => {
		if (!filter) {
			toastSucc(t("cmd_exec_succ", { name: "jq" }));
			return;
		}

		if (viewMode != ViewMode.Text) {
			setViewMode(ViewMode.Text);
		}

		const { output, error } = await jq(main!.text(), filter);

		if (error) {
			toastErr(t("cmd_exec_fail", { name: "jq" }) + ": " + filter);
		} else {
			await secondary!.parseAndSet(output, {}, false);
			toastSucc(t("cmd_exec_succ", { name: "jq" }));
			count("jqExecutions");
		}
	};
}

const JqInput: FC = forwardRef<
	ElementRef<typeof Input>,
	ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
	const t = useTranslations();
	const usable = useUserStore((state) => state.usable("jqExecutions"));
	const execJq = useExecJq();

	return (
		<InputBox
			id="jq-input"
			initial={jqInit}
			run={execJq}
			placeholderFn={(loading) =>
				loading
					? t("jq_loading")
					: usable
						? t("jq_placeholder")
						: t("jq_disabled")
			}
			{...props}
		/>
	);
});

JqInput.displayName = "JqInput";
export default JqInput;
