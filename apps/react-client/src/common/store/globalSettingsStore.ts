import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalSettingsState {
	isMinimapVisible: boolean;
	isJsonPreviewVisible: boolean;
	isSideMenuVisible: boolean;
	toggleMinimap: () => void;
	toggleJsonPreview: () => void;
	toggleSideMenu: () => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
	persist(
		(set) => ({
			isMinimapVisible: true,
			isJsonPreviewVisible: true,
			isSideMenuVisible: true,
			toggleMinimap: () =>
				set((state) => ({ isMinimapVisible: !state.isMinimapVisible })),
			toggleJsonPreview: () =>
				set((state) => ({
					isJsonPreviewVisible: !state.isJsonPreviewVisible,
				})),
			toggleSideMenu: () =>
				set((state) => ({ isSideMenuVisible: !state.isSideMenuVisible })),
		}),
		{
			name: "useGlobalSettings-storage",
		},
	),
);
