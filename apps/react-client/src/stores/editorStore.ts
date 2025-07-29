import { create } from "zustand";
import { useJsonEditorStore } from "@react-client/features/codeEditor/CodeJsonEditor";

interface EditorStore {
	importFromFile: () => void;
	exportToFile: () => void;
}

export const useEditorStore = create<EditorStore>(() => ({
	importFromFile: () => {
		useJsonEditorStore.getState().importFromFile();
	},
	exportToFile: () => {
		useJsonEditorStore.getState().exportToFile();
	},
}));
