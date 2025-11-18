import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { FullScreenLoader } from "@react-client/common/muiCustom/FullScreenLoader";

interface AuthProviderProps {
	token?: string;
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
	token,
	children,
}) => {
	const setAccessToken = useAuthStore((s) => s.setAccessToken);
	const accessToken = useAuthStore((s) => s.accessToken);
	const initializeGodMode = useAuthStore((s) => s.initializeGodMode);

	useEffect(() => {
		if (token) {
			setAccessToken(token);
			return;
		}
		if (typeof window !== "undefined" && (window as any).token) {
			setAccessToken((window as any).token as string);
		}
	}, [token, setAccessToken]);

	const GOD_MODE = process?.env?.NO_ROLES === "true";

	useEffect(() => {
		if (GOD_MODE) {
			initializeGodMode();
		}
	}, [GOD_MODE, initializeGodMode]);

	if (GOD_MODE) return <>{children}</>;

	return accessToken ? children : <FullScreenLoader />;
};
