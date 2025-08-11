import { Roles } from "nest-keycloak-connect";

export function RealmRole(role: string) {
	return Roles(`realm:${role}`);
}
