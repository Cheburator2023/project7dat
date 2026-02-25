import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GraphSettingsState {
	showFullGraphByDefault: boolean;
	setShowFullGraphByDefault: (enabled: boolean) => void;
	layoutDirection: "LR" | "TB";
	setLayoutDirection: (direction: "LR" | "TB") => void;
	toggleLayoutDirection: () => void;
	usePerGraphLayout: boolean;
	setUsePerGraphLayout: (enabled: boolean) => void;
	perGraphLayoutDirections: Record<string, "LR" | "TB">;
	getGraphLayoutDirection: (graphId: string) => "LR" | "TB";
	setGraphLayoutDirection: (graphId: string, direction: "LR" | "TB") => void;
	toggleGraphLayoutDirection: (graphId: string) => void;
}

export const useGraphSettingsStore = create<GraphSettingsState>()(
	persist(
		(set, get) => ({
			showFullGraphByDefault: false,
			setShowFullGraphByDefault: (enabled: boolean) => {
				set({ showFullGraphByDefault: enabled });
				if (!enabled) {
					// При выключении сбрасываем в дефолтное значение (true)
					set({ showFullGraphByDefault: true });
				}
			},
			layoutDirection: "LR",
			setLayoutDirection: (direction) => set({ layoutDirection: direction }),
			toggleLayoutDirection: () =>
				set((state) => ({
					layoutDirection: state.layoutDirection === "LR" ? "TB" : "LR",
				})),
			usePerGraphLayout: true,
			setUsePerGraphLayout: (enabled) => set({ usePerGraphLayout: enabled }),
			perGraphLayoutDirections: {},
			getGraphLayoutDirection: (graphId: string): "LR" | "TB" => {
				const state = get();
				if (!state.usePerGraphLayout) {
					return state.layoutDirection;
				}
				return state.perGraphLayoutDirections[graphId] ?? state.layoutDirection;
			},
			setGraphLayoutDirection: (graphId: string, direction: "LR" | "TB") =>
				set((state) => ({
					perGraphLayoutDirections: {
						...state.perGraphLayoutDirections,
						[graphId]: direction,
					},
				})),
			toggleGraphLayoutDirection: (graphId: string) =>
				set((state) => {
					const current =
						state.perGraphLayoutDirections[graphId] ?? state.layoutDirection;
					return {
						perGraphLayoutDirections: {
							...state.perGraphLayoutDirections,
							[graphId]: current === "LR" ? "TB" : "LR",
						},
					};
				}),
		}),
		{
			name: "graph-settings-storage",
		},
	),
);
