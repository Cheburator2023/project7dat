import { create } from "zustand";

type User = any;

export const initialStatistics: any = {
	graphModeView: 0,
	tableModeView: 0,
	textComparison: 0,
	jqExecutions: 0,
};

export interface UserState {
	user: any | null;
	activeOrder: any;
	statistics: any;
	nextQuotaRefreshTime?: Date;
	fallbackKey: string;

	usable: (key: any) => boolean;
	count: (key: any) => void;
	setUser: (user: User | null) => Promise<void>;
	updateActiveOrder: (user: User | null) => Promise<void>;
	setStatistics: (
		statistics: any,
		nextQuotaRefreshTime: Date,
		fallbackKey: string,
	) => void;
}

const initialStates: any = {
	user: null,
	activeOrder: null,
	statistics: initialStatistics,
	fallbackKey: "",
};

export const useUserStore = create<UserState>()((set, get) => ({
	...initialStates,
	nextQuotaRefreshTime: undefined,
	user: initialStates.user,
	statistics: initialStates.statistics,
	fallbackKey: initialStates.fallbackKey,

	usable(_key: any) {
		return true;
	},

	count(key: any) {
		const { fallbackKey, statistics } = get();
		statistics[key] += 1;

		set({ statistics });
	},

	async setUser(user: User | null) {
		const { updateActiveOrder: setActiveOrder } = get();
		set({ user });
		await setActiveOrder(user);
	},

	async updateActiveOrder(user: User | null) {
		if (!user) {
			set({ activeOrder: null });
			return;
		}
	},

	setStatistics(
		statistics: any,
		nextQuotaRefreshTime: Date,
		fallbackKey: string,
	) {
		set({ statistics, nextQuotaRefreshTime, fallbackKey });
	},
}));

export function getUserState() {
	return useUserStore.getState();
}
