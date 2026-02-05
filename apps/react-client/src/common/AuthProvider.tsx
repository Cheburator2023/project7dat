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
