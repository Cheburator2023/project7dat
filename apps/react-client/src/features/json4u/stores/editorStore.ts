import { Comparer } from "@react-client/features/json4u/lib/editor/comparer";
// import { Comparer } from "@react-client/features/json4u/lib/editor/comparer";
import type {
	EditorWrapper,
	Kind,
} from "@react-client/features/json4u/lib/editor/editor";
import {
	toastErr,
	toastSucc,
	toastWarn,
} from "@react-client/features/json4u/lib/utils";
import {
	ArrowDownNarrowWide,
	ArrowDownWideNarrow,
	type LucideIcon,
} from "lucide-react";

import { create } from "zustand";
import { getStatusState } from "./statusStore";
import { getUserState } from "./userStore";

export interface Command {
	id: any;
	Icon?: LucideIcon;
	hidden?: boolean; // hidden in command bar?
	run: () => any | Promise<any | boolean>;
}

export interface EditorState {
	translations?: ReturnType<any>;
	main?: EditorWrapper;
	secondary?: EditorWrapper;
	comparer?: Comparer;
	commands: Command[];

	runCommand: (id: any) => void;
	setTranslations: (translations: ReturnType<any>) => void;
	getAnotherEditor: (kind: Kind) => EditorWrapper;
	setEditor: (editor: EditorWrapper) => void;
	isReady: () => boolean;
	compare: () => void;
	resetHighlight: () => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
	commands: [
		{
			id: "format",
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(main?.text(), { format: true });
				return result?.set;
			},
		},
		{
			id: "minify",
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(main?.text(), {
					format: "minify",
				});
				return result?.parse;
			},
		},
		{
			id: "escape",
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(
					await window.worker.escapeStr(main?.text()),
				);
				return result?.set;
			},
		},
		{
			id: "unescape",
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(
					await window.worker.unescapeStr(main?.text()),
				);
				return result?.set;
			},
		},
		{
			id: "sortAsc",
			Icon: ArrowDownNarrowWide,
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(main?.text(), {
					sort: "asc",
				});
				return result?.parse;
			},
		},
		{
			id: "sortDesc",
			Icon: ArrowDownWideNarrow,
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(main?.text(), {
					sort: "desc",
				});
				return result?.parse;
			},
		},
		{
			id: "pythonDictToJSON",
			run: async () => {
				const { main } = get();
				const result = await main?.parseAndSet(
					await window.worker.pythonDictToJSON(main?.text()),
				);
				return result?.parse;
			},
		},
		{
			id: "urlToJson",
			run: async () => {
				const { main } = get();

				const { text, parse } = await window.worker.urlToJSON(
					main?.text() || "",
				);
				if (!parse) return parse;
				const result = await main?.parseAndSet(text);
				return result?.set;
			},
		},
		{
			id: "compare",
			run: async () => await get().compare(),
		},
		{
			id: "swapLeftRight",
			hidden: true,
			run: async () => {
				const { main, secondary } = get();
				const left = main?.text();
				const right = secondary?.text();
				await main?.parseAndSet(right ?? "", {}, false);
				await secondary?.parseAndSet(left ?? "", {}, false);
				return true;
			},
		},
		{
			id: "show_jq",
			run: () => getStatusState().setCommandMode("jq"),
		},
		{
			id: "show_json_path",
			run: () => getStatusState().setCommandMode("json_path"),
		},
	],

	async runCommand(id: any) {
		const { translations: t, commands, isReady } = get();
		if (!isReady()) {
			console.log("editor is not ready!");
			return;
		}

		const r = await Promise.resolve(
			commands.find((item) => item.id === id)?.run(),
		);
		let isSucc = true;
		const name = t?.(id);

		if (r !== undefined) {
			if (r) {
				toastSucc(t?.("cmd_exec_succ", { name }));
			} else {
				toastErr(t?.(r ? r : "cmd_exec_fail", { name }));
				isSucc = false;
			}
		}
	},

	setTranslations(translations: any) {
		set({ translations });
	},

	getAnotherEditor(kind: Kind) {
		return (kind === "main" ? get().secondary : get().main)!;
	},

	setEditor(editor: EditorWrapper) {
		let { main, secondary } = get();

		if (editor.kind === "main") {
			main = editor;
		} else {
			secondary = editor;
		}

		set({
			[editor.kind]: editor,
			comparer: main && secondary ? new Comparer(main, secondary) : undefined,
		});
	},

	isReady() {
		const { main, secondary } = get();
		return !!(main && secondary);
	},

	async compare() {
		const { translations: t, comparer } = get();
		const { usable, count } = getUserState();
		const { setShowPricingOverlay } = getStatusState();
		const compareResult = await comparer?.compare();
		const hasDiff = (compareResult?.diffPairs?.length || 0) > 0;
		const showPricing =
			hasDiff && compareResult?.isTextCompare && !usable("textComparison");

		if (showPricing) {
			setShowPricingOverlay(true);
		} else {
			comparer?.highlightDiff(
				compareResult?.diffPairs || [],
				!!compareResult?.isTextCompare,
			);
		}

		if (hasDiff) {
			compareResult?.isTextCompare && count("textComparison");
			toastWarn(
				t?.(compareResult?.isTextCompare ? "with_text_diff" : "with_diff"),
				"compare",
			);
		} else {
			toastSucc(t?.("no_diff"), "compare");
		}
	},

	resetHighlight() {
		get().comparer?.reset();
	},
}));

export function useEditor(kind: Kind = "main") {
	return useEditorStore((state) => state[kind]);
}

export function getEditorState() {
	return useEditorStore.getState();
}
