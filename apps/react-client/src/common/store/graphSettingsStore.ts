import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GraphSettingsState {
	showFullGraphByDefault: boolean;
	setShowFullGraphByDefault: (enabled: boolean) => void;
}

export const useGraphSettingsStore = create<GraphSettingsState>()(
	persist(
		(set) => ({
			showFullGraphByDefault: false,
			setShowFullGraphByDefault: (enabled: boolean) => {
				set({ showFullGraphByDefault: enabled });
				if (!enabled) {
					// При выключении сбрасываем в дефолтное значение (true)
					set({ showFullGraphByDefault: true });
				}
			},
		}),
		{
			name: "graph-settings-storage",
		},
	),
);
