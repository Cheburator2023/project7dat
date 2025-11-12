import { createBridgeComponent } from "@module-federation/bridge-react/v19";
import { App } from "@react-client/App";
import { AuthProvider } from "@react-client/common/AuthProvider";
import { useUserStore } from "@react-client/common/store/userStore";
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
	onLogout?: () => void;
};

const MfeRoot = (props: Props) => {
	console.log("MfeRoot >> props DL:", props);

	const { user } = props;
	const { setUsername, setGroups, setRoles, setPermissions } = useUserStore();

	useEffect(() => {
		if (user?.preferred_username) {
			setUsername(user?.preferred_username);
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
		<AuthProvider token={props.token}>
			{globalStyles}

			<App {...props} bridged />
		</AuthProvider>
	);
};

export default createBridgeComponent({
	rootComponent: MfeRoot,
});
