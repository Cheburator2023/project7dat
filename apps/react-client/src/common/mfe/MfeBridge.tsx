import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

interface MfeBridgeProps {
	children: React.ReactNode;
}

interface KeycloakUserInfo {
	sub: string;
	preferred_username: string;
	email: string;
	given_name: string;
	family_name: string;
	realm_access?: {
		roles: string[];
	};
	groups?: string[];
}

interface ShellAuthData {
	accessToken: string;
	userInfo: KeycloakUserInfo;
}

declare global {
	interface Window {
		__SHELL_AUTH__?: ShellAuthData;
		__MFE_BRIDGE__?: {
			setAuth: (authData: ShellAuthData) => void;
			clearAuth: () => void;
			getUserInfo: () => any;
		};
	}
}

const transformKeycloakUser = (kcUser: KeycloakUserInfo) => ({
	id: kcUser.sub,
	username: kcUser.preferred_username,
	email: kcUser.email,
	firstName: kcUser.given_name,
	lastName: kcUser.family_name,
	roles: kcUser.realm_access?.roles || [],
	groups: kcUser.groups || [],
});

export const MfeBridge = ({ children }: MfeBridgeProps) => {
	const {
		initializeFakeAuth,
		setAccessToken,
		setUserInfo,
		setAuthenticated,
		logout,
		userInfo,
	} = useAuthStore();

	useEffect(() => {
		// Initialize fake auth for development if no shell auth is available
		if (!window.__SHELL_AUTH__) {
			initializeFakeAuth();
		} else {
			// Use auth data from shell app
			const { accessToken, userInfo } = window.__SHELL_AUTH__;
			setAccessToken(accessToken);
			setUserInfo(transformKeycloakUser(userInfo));
			setAuthenticated(true);
		}

		// Expose MFE bridge API to shell
		window.__MFE_BRIDGE__ = {
			setAuth: (authData: ShellAuthData) => {
				setAccessToken(authData.accessToken);
				setUserInfo(transformKeycloakUser(authData.userInfo));
				setAuthenticated(true);
			},
			clearAuth: () => {
				logout();
			},
			getUserInfo: () => {
				return userInfo;
			},
		};

		// Listen for auth changes from shell
		const handleAuthChange = (event: CustomEvent) => {
			if (event.detail.type === "AUTH_UPDATE") {
				window.__MFE_BRIDGE__?.setAuth(event.detail.data);
			} else if (event.detail.type === "AUTH_LOGOUT") {
				window.__MFE_BRIDGE__?.clearAuth();
			}
		};

		window.addEventListener(
			"shell-auth-change",
			handleAuthChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				"shell-auth-change",
				handleAuthChange as EventListener,
			);
			delete window.__MFE_BRIDGE__;
		};
	}, []);

	return <>{children}</>;
};
