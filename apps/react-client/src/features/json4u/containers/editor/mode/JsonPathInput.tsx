import type { Input } from "@react-client/features/json4u/components/ui/input";
import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import { toastErr, toastSucc } from "@react-client/features/json4u/lib/utils";
import { useEditorStore } from "@react-client/features/json4u/stores/editorStore";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	type FC,
	forwardRef,
} from "react";
import { useShallow } from "zustand/react/shallow";
import InputBox from "./InputBox";

function useFilter() {
	const t = useTranslations();
	const secondary = useEditorStore((state) => state.secondary);
	const { viewMode, setViewMode } = useStatusStore(
		useShallow((state) => ({
			viewMode: state.viewMode,
			setViewMode: state.setViewMode,
			setCommandMode: state.setCommandMode,
		})),
	);

	return async (filter: string) => {
		filter = filter.trim();

		if (!filter) {
			toastSucc(t("cmd_exec_succ", { name: t("json_path_filter") }));
			return;
		} else if (!window.worker) {
			toastErr(t("cmd_exec_fail", { name: t("json_path_filter") }));
			return;
		}

		if (viewMode != ViewMode.Text) {
			setViewMode(ViewMode.Text);
		}

		const { output, error } = await window.worker.jsonPath(filter);

		if (error) {
			toastErr(
				t("cmd_exec_fail", { name: t("json_path_filter") }) + ": " + filter,
			);
		} else {
			await secondary!.parseAndSet(output ?? "", {}, false);
			toastSucc(t("cmd_exec_succ", { name: t("json_path_filter") }));
		}
	};
}

const JsonPathInput: FC = forwardRef<
	ElementRef<typeof Input>,
	ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
	const t = useTranslations();
	const filter = useFilter();

	return (
		<InputBox
			id="json-path-input"
			run={filter}
			placeholder={t("json_path_placeholder")}
			{...props}
		/>
	);
});

JsonPathInput.displayName = "JsonPathInput";
export default JsonPathInput;
