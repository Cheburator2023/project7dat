import type { T_CONFIG_MAP, T_KEYCLOAK_USER } from "@react-client/types";
import type { GridApi } from "ag-grid-community";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalSettingsState {
	isCommitHistoryVisible: boolean;
	isJsonPreviewVisible: boolean;
	isDataMartVisible: boolean;
	isSideMenuVisible: boolean;
	user: T_KEYCLOAK_USER | undefined;
	configMap?: T_CONFIG_MAP;
	gridApi?: GridApi | null;
	toggleSideMenu: () => void;
	setGridApi: (api: GridApi | null) => void;
	setUser: (user?: T_KEYCLOAK_USER) => void;
	toggleDataMart: () => void;
	toggleHideAllDashboardPanels: () => void;
	toggleCommitHistory: () => void;
	toggleJsonPreview: () => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
	persist(
		(set) => ({
			isCommitHistoryVisible: true,
			isJsonPreviewVisible: true,
			isSideMenuVisible: true,
			isDataMartVisible: true,
			user: undefined,
			configMap: undefined,
			gridApi: undefined,
			setGridApi: (api: GridApi | null) => set({ gridApi: api }),
			setUser: (user?: T_KEYCLOAK_USER) => set({ user }),
			toggleHideAllDashboardPanels: () =>
				set((_state) => ({
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
