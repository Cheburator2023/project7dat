import { create } from "zustand";

interface GlobalSettingsState {
	isMinimapVisible: boolean;
	isJsonPreviewVisible: boolean;
	isSideMenuVisible: boolean;
	toggleMinimap: () => void;
	toggleJsonPreview: () => void;
	toggleSideMenu: () => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
	isMinimapVisible: true,
	isJsonPreviewVisible: true,
	isSideMenuVisible: true,
	toggleMinimap: () =>
		set((state) => ({ isMinimapVisible: !state.isMinimapVisible })),
	toggleJsonPreview: () =>
		set((state) => ({ isJsonPreviewVisible: !state.isJsonPreviewVisible })),
	toggleSideMenu: () =>
		set((state) => ({ isSideMenuVisible: !state.isSideMenuVisible })),
}));
