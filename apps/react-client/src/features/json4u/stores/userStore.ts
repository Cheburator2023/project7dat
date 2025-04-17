import {
	type Statistics,
	type StatisticsKeys,
	env,
} from "@react-client/features/json4u/lib/env";
import type { SubscriptionType } from "@react-client/features/json4u/lib/shop/types";
import { create } from "zustand";

type User = any;

export const initialStatistics: Statistics = {
	graphModeView: 0,
	tableModeView: 0,
	textComparison: 0,
	jqExecutions: 0,
};

export const freeQuota: any = env.NEXT_PUBLIC_FREE_QUOTA;

export interface UserState {
	user: any | null;
	activeOrder: any;
	statistics: Statistics;
	nextQuotaRefreshTime?: Date;
	fallbackKey: string;

	usable: (key: StatisticsKeys) => boolean;
	count: (key: StatisticsKeys) => void;
	isPremium: () => boolean;
	getPlan: () => SubscriptionType;
	setUser: (user: User | null) => Promise<void>;
	updateActiveOrder: (user: User | null) => Promise<void>;
	setStatistics: (
		statistics: Statistics,
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

	usable(key: StatisticsKeys) {
		const { statistics: usage, isPremium } = get();

		if (isPremium()) {
			return true;
		}

		return usage[key] < freeQuota[key];
	},

	count(key: StatisticsKeys) {
		const { fallbackKey, statistics, isPremium } = get();
		statistics[key] += 1;

		set({ statistics });
	},

	isPremium() {
		return true;
	},

	getPlan(): SubscriptionType {
		const { activeOrder } = get();
		return activeOrder?.plan ?? "free";
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
		statistics: Statistics,
		nextQuotaRefreshTime: Date,
		fallbackKey: string,
	) {
		set({ statistics, nextQuotaRefreshTime, fallbackKey });
	},
}));

export function getUserState() {
	return useUserStore.getState();
}
