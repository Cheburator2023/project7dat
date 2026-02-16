import { create } from "zustand";

type MainDataLoadingState = {
	isMainDataLoading: boolean;
	hasMainDataLoadedOnce: boolean;
	setMainDataLoading: (isLoading: boolean) => void;
	markMainDataLoadedOnce: () => void;
	resetMainDataLoadedOnce: () => void;
};

export const useMainDataLoadingStore = create<MainDataLoadingState>((set) => ({
	isMainDataLoading: false,
	hasMainDataLoadedOnce: false,
	setMainDataLoading: (isLoading: boolean) =>
		set({ isMainDataLoading: isLoading }),
	markMainDataLoadedOnce: () =>
		set({ hasMainDataLoadedOnce: true, isMainDataLoading: false }),
	resetMainDataLoadedOnce: () =>
		set({ hasMainDataLoadedOnce: false, isMainDataLoading: false }),
}));
