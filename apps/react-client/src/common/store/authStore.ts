import { create } from "zustand";

interface UserInfo {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	roles: string[];
	groups: string[];
}

interface AuthState {
	accessToken: string | null;
	userInfo: UserInfo | null;
	isAuthenticated: boolean;
	setAccessToken: (token: string | null) => void;
	setUserInfo: (userInfo: UserInfo | null) => void;
	setAuthenticated: (authenticated: boolean) => void;
	logout: () => void;
	initializeFakeAuth: () => void;
}

const FAKE_USER_INFO: UserInfo = {
	id: "fake-user-123",
	username: "john.doe",
	email: "john.doe@company.com",
	firstName: "John",
	lastName: "Doe",
	roles: ["data-analyst", "viewer"],
	groups: ["data-team", "analytics"],
};

const FAKE_ACCESS_TOKEN = "fake-jwt-token-for-development";

export const useAuthStore = create<AuthState>()((set, _get) => ({
	accessToken: null,
	userInfo: null,
	isAuthenticated: false,
	setAccessToken: (token) => set({ accessToken: token }),
	setUserInfo: (userInfo) => set({ userInfo }),
	setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
	logout: () =>
		set({
			accessToken: null,
			userInfo: null,
			isAuthenticated: false,
		}),
	initializeFakeAuth: () => {
		set({
			accessToken: FAKE_ACCESS_TOKEN,
			userInfo: FAKE_USER_INFO,
			isAuthenticated: true,
		});
	},
}));
