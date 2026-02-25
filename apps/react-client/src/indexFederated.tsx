import { createBridgeComponent } from "@module-federation/bridge-react/v19";
import { CircularProgress } from "@mui/material";
import { App } from "@react-client/App";
import { AuthProvider } from "@react-client/common/AuthProvider";
import { FullScreenLoader } from "@react-client/common/muiCustom/FullScreenLoader";
import { useUserStore } from "@react-client/common/store/userStore";
import { useDeepEffect } from "@react-client/hooks";
import { globalStyles } from "@react-client/theme/GlobalStyle";
import { T_CONFIG_MAP, T_KEYCLOAK_USER } from "@react-client/types";
import { Permission, Role } from "@react-client/types/roles";
import { useEffect } from "react";

export type Props = {
	urlConfig?: T_CONFIG_MAP;
	token?: string;
	user?: T_KEYCLOAK_USER;
	userPermissions?: string[];
	navigate?: (to: string) => void;
	protectedFetch?: any;
	bridged?: boolean;
	keycloak?: any;
	onLogout?: () => void;
};

const MfeRoot = (props: Props) => {
	console.log("🐸 Pepe said >> MfeRoot >> props:", props);

	useDeepEffect(() => {
		if (props?.urlConfig) {
			window.urlConfig = props.urlConfig;
			window.keycloak = props.keycloak;
			window.user = props.user;
		}
	}, [props]);

	const { user } = props;

	const { setUsername, setGroups, setRoles, setPermissions, setUser } =
		useUserStore();

	useEffect(() => {
		if (user?.preferred_username) {
			setUsername(user?.preferred_username);
			setUser(user);
		}

		if (user?.groups) {
			setGroups(user.groups);

			const roles = user.groups.filter((group) =>
				Object.values(Role).includes(group as Role),
			) as Role[];
			setRoles(roles);
		}

		if (user?.realm_access?.roles) {
			const permissions = user.realm_access.roles.filter((permission) =>
				Object.values(Permission).includes(permission as Permission),
			) as Permission[];

			setPermissions(permissions);
		}
	}, [user?.roles, user?.realm_access]);

	return (
		<AuthProvider>
			{globalStyles}

			{props?.urlConfig && props?.keycloak ? (
				<App {...props} bridged />
			) : (
				<FullScreenLoader />
			)}
		</AuthProvider>
	);
};

export default createBridgeComponent({
	rootComponent: MfeRoot,
});
