import { T_KEYCLOAK_USER } from "@react-client/types";
import {
	Permission,
	Role,
	UserPermissions,
	UserRoles,
} from "@react-client/types/roles";
import { create, StoreApi, UseBoundStore } from "zustand";

const NO_ROLES_FOR_DEV = process?.env?.NO_ROLES;

interface UserStoreState {
	username: string | null;
	groups: string[];
	roles: UserRoles;
	permissions: UserPermissions;
	user: T_KEYCLOAK_USER | undefined;
	setUsername: (username: string) => void;
	setGroups: (roles: string[]) => void;
	setRoles: (role: UserRoles) => void;
	setPermissions: (permissions: UserPermissions) => void;
	hasRole: (role: Role) => boolean;
	hasPermission: (permission: Permission) => boolean;
	setUser: (user: T_KEYCLOAK_USER) => void;
}

export const useUserStore: UseBoundStore<StoreApi<UserStoreState>> =
	create<UserStoreState>((set) => ({
		username: null,
		groups: [],
		roles: [],
		permissions: [],
		user: undefined,
		setUsername: (username: string) => set({ username }),
		setGroups: (groups: string[]) => set({ groups }),
		setRoles: (roles: UserRoles) => set({ roles }),
		setPermissions: (permissions: UserPermissions) => set({ permissions }),
		setUser: (user: T_KEYCLOAK_USER) => set({ user }),
		hasRole: (role: Role) => {
			const { roles } = useUserStore.getState();
			return NO_ROLES_FOR_DEV ? true : roles.includes(role);
		},
		hasPermission: (permission: Permission) => {
			const { permissions } = useUserStore.getState();
			return NO_ROLES_FOR_DEV ? true : permissions.includes(permission);
		},
	}));
