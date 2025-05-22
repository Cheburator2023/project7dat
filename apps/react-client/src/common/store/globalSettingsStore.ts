import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalSettingsState {
	isCommitHistoryVisible: boolean;
	isJsonPreviewVisible: boolean;
	isDataMartVisible: boolean;
	isSideMenuVisible: boolean;
	toggleDataMart: () => void;
	toggleHideAllDashboardPanels: () => void;
	toggleCommitHistory: () => void;
	toggleJsonPreview: () => void;
	toggleSideMenu: () => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
	persist(
		(set) => ({
			isCommitHistoryVisible: true,
			isJsonPreviewVisible: true,
			isSideMenuVisible: true,
			isDataMartVisible: true,
			toggleHideAllDashboardPanels: () =>
				set((state) => ({
					isDataMartVisible: false,
					isCommitHistoryVisible: false,
					isJsonPreviewVisible: false,
				})),
			toggleDataMart: () =>
				set((state) => ({
					isDataMartVisible: !state.isDataMartVisible,
				})),
			toggleCommitHistory: () =>
				set((state) => ({
					isCommitHistoryVisible: !state.isCommitHistoryVisible,
				})),
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
