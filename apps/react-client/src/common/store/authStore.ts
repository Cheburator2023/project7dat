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
	initializeGodMode: () => void;
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

const GOD_USER_INFO: UserInfo = {
	id: "god-user-00000000-0000-0000-0000-000000000000",
	username: "god",
	email: "god@datalineage.local",
	firstName: "God",
	lastName: "Mode",
	roles: [
		"admin",
		"god",
		"superuser",
		"data-analyst",
		"data-engineer",
		"data-scientist",
		"viewer",
		"editor",
		"owner",
		// All possible permissions
		"READ_DATA",
		"WRITE_DATA",
		"DELETE_DATA",
		"MANAGE_USERS",
		"MANAGE_ROLES",
		"MANAGE_SYSTEM",
		"VIEW_AUDIT_LOGS",
		"EXPORT_DATA",
		"IMPORT_DATA",
		"MANAGE_LINEAGE",
		"VIEW_LINEAGE",
		"EDIT_LINEAGE",
	],
	groups: [
		"admin-group",
		"god-group",
		"data-team",
		"analytics",
		"engineering",
		"management",
		"all-access",
	],
};

const FAKE_ACCESS_TOKEN = "fake-jwt-token-for-development";
const GOD_ACCESS_TOKEN = "god-mode-jwt-token-unlimited-power";

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
	initializeGodMode: () => {
		console.warn("🔥 FRONTEND GOD MODE ACTIVATED - Unlimited access granted");
		console.warn(
			`🔥 God user: ${GOD_USER_INFO.username} (${GOD_USER_INFO.email})`,
		);
		console.warn(`🔥 Roles: ${GOD_USER_INFO.roles.join(", ")}`);
		set({
			accessToken: GOD_ACCESS_TOKEN,
			userInfo: GOD_USER_INFO,
			isAuthenticated: true,
		});
	},
}));
