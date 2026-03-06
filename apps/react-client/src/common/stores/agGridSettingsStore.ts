import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgGridConfig {
	id: string;
	name: string;
	localStorageKey: string;
	enabled: boolean;
	updatedAt: number;
}

interface AgGridSettingsState {
	persistGridStateEnabled: boolean;
	grids: Record<string, AgGridConfig>;

	setPersistGridStateEnabled: (enabled: boolean) => void;
	registerGrid: (
		grid: Pick<AgGridConfig, "id" | "name" | "localStorageKey">,
	) => void;
	unregisterGrid: (gridId: string) => void;
	toggleGridPersist: (gridId: string) => void;
	resetGridState: (gridId: string) => void;
	resetAllGrids: () => void;
	isGridPersistEnabled: (gridId: string) => boolean;
}

export const AG_GRID_SETTINGS_STORE_KEY = "ag-grid-settings-storage";

export const useAgGridSettingsStore = create<AgGridSettingsState>()(
	persist(
		(set, get) => ({
			persistGridStateEnabled: false,
			grids: {},
			setPersistGridStateEnabled: (enabled: boolean) => {
				if (!enabled) {
					for (const grid of Object.values(get().grids)) {
						localStorage.removeItem(grid.localStorageKey);
					}
				}

				set({ persistGridStateEnabled: enabled });

				if (!enabled) {
					localStorage.removeItem(AG_GRID_SETTINGS_STORE_KEY);
				}
			},
			registerGrid: (grid) => {
				set((state) => {
					const existing = state.grids[grid.id];
					return {
						grids: {
							...state.grids,
							[grid.id]: {
								id: grid.id,
								name: grid.name,
								localStorageKey: grid.localStorageKey,
								enabled: existing?.enabled ?? true,
								updatedAt: Date.now(),
							},
						},
					};
				});
			},
			unregisterGrid: (gridId) => {
				set((state) => {
					const next = { ...state.grids };
					delete next[gridId];
					return { grids: next };
				});
			},
			toggleGridPersist: (gridId: string) => {
				const grid = get().grids[gridId];
				if (!grid) return;

				if (grid.enabled) {
					localStorage.removeItem(grid.localStorageKey);
				}

				set((state) => ({
					grids: {
						...state.grids,
						[gridId]: {
							...state.grids[gridId],
							enabled: !state.grids[gridId]?.enabled,
							updatedAt: Date.now(),
						},
					},
				}));
			},
			resetGridState: (gridId: string) => {
				const grid = get().grids[gridId];
				if (!grid) return;
				localStorage.removeItem(grid.localStorageKey);
			},
			resetAllGrids: () => {
				for (const grid of Object.values(get().grids)) {
					localStorage.removeItem(grid.localStorageKey);
				}
			},
			isGridPersistEnabled: (gridId: string) => {
				const state = get();
				if (!state.persistGridStateEnabled) return false;
				return state.grids[gridId]?.enabled ?? false;
			},
		}),
		{
			name: AG_GRID_SETTINGS_STORE_KEY,
		},
	),
);
