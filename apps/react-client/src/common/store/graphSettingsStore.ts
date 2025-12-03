import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GraphSettingsState {
	// Показывать полный граф по умолчанию (без поиска)
	showFullGraphByDefault: boolean;
	setShowFullGraphByDefault: (enabled: boolean) => void;
}

export const useGraphSettingsStore = create<GraphSettingsState>()(
	persist(
		(set) => ({
			showFullGraphByDefault: true, // По умолчанию показываем полный граф
			setShowFullGraphByDefault: (enabled: boolean) =>
				set({ showFullGraphByDefault: enabled }),
		}),
		{
			name: "graph-settings-storage",
		},
	),
);
