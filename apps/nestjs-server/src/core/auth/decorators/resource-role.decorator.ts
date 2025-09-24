import { Roles } from "nest-keycloak-connect";

export function ResourceRole(resource: string, role: string) {
	return Roles(`${resource}:${role}`);
}
