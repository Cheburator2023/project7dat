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
	const setAccessToken = useAuthStore((state) => state.setAccessToken);
	const accessToken = useAuthStore((state) => state.accessToken);

	useEffect(() => {
		if (token) {
			setAccessToken(token);
		}
	}, [token, setAccessToken]);

	const NO_ROLES_FOR_DEV = true || process?.env?.NO_ROLES;

	if (NO_ROLES_FOR_DEV) return <>{children}</>;

	return accessToken ? children : <FullScreenLoader />;
};
