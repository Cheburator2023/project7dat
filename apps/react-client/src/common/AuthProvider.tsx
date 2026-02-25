import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const initializeGodMode = useAuthStore((s) => s.initializeGodMode);

	const GOD_MODE = process?.env?.NO_ROLES === "true";

	useEffect(() => {
		if (GOD_MODE) {
			initializeGodMode();
		}
	}, [GOD_MODE, initializeGodMode]);

	if (GOD_MODE) return <>{children}</>;

	return children;
};
