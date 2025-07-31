declare module "data-lineage-remote/App" {
	const App: React.ComponentType;
	export default App;
}

declare module "data-lineage-remote/MfeBridge" {
	interface MfeBridgeProps {
		children: React.ReactNode;
	}
	const MfeBridge: React.ComponentType<MfeBridgeProps>;
	export { MfeBridge };
}

declare global {
	interface Window {
		__SHELL_AUTH__?: {
			accessToken: string;
			userInfo: {
				sub: string;
				preferred_username: string;
				email: string;
				given_name: string;
				family_name: string;
				realm_access?: {
					roles: string[];
				};
				groups?: string[];
			};
		};
		__MFE_BRIDGE__?: {
			setAuth: (authData: any) => void;
			clearAuth: () => void;
			getUserInfo: () => any;
		};
	}
}

export {};