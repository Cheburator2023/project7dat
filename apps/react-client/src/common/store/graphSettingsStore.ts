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
			setShowFullGraphByDefault: (enabled: boolean) =>
				set({ showFullGraphByDefault: enabled }),
			showAttributesInNodes: false,
			setShowAttributesInNodes: (enabled: boolean) =>
				set({ showAttributesInNodes: enabled }),
		}),
		{
			name: "graph-settings-storage",
		},
	),
);
