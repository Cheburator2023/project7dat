import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GraphSettingsState {
	showFullGraphByDefault: boolean;
	setShowFullGraphByDefault: (enabled: boolean) => void;
	showAttributesInNodes: boolean;
	setShowAttributesInNodes: (enabled: boolean) => void;
}

export const useGraphSettingsStore = create<GraphSettingsState>()(
	persist(
		(set) => ({
			showFullGraphByDefault: true,
			setShowFullGraphByDefault: (enabled: boolean) => {
				set({ showFullGraphByDefault: enabled });
				if (!enabled) {
					// При выключении сбрасываем в дефолтное значение (true)
					set({ showFullGraphByDefault: true });
				}
			},
			showAttributesInNodes: false,
			setShowAttributesInNodes: (enabled: boolean) => {
				set({ showAttributesInNodes: enabled });
				if (!enabled) {
					// При выключении сбрасываем в дефолтное значение (false)
					set({ showAttributesInNodes: false });
				}
			},
		}),
		{
			name: "graph-settings-storage",
		},
	),
);
