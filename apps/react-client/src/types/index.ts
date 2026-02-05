export type T_KEYCLOAK_USER = {
	exp: number;
	iat: number;
	auth_time: number;
	jti: string;
	iss: string;
	aud: string;
	sub: string;
	typ: string;
	azp: string;
	nonce: string;
	session_state: string;
	acr: string;
	"allowed-origins": string[];
	realm_access: {
		roles: string[];
	};
	resource_access: {
		"realm-management": {
			roles: string[];
		};
	};
	scope: string;
	email_verified: boolean;
	roles: string[];
	name: string;
	groups: string[];
	preferred_username: string;
	given_name: string;
	family_name: string;
	email?: string;
};

export type T_CONFIG_MAP = {
	SUM_FRONTEND: string;
	SUM_API: string;
	SUM_RM_FRONTEND: string;
	SMART_ANKETA_FRONTEND: string;
	SMART_ANKETA_API: string;
	SUM_RM_API: string;
	KEYCLOAK_URL: string;
	KABVAL_URL: string;
	DATA_LINEAGE_API: string;
	DATA_LINEAGE_FRONTEND: string;
};

export * from "./jsonData";

type TKeycloakLike = {
	logout: () => void;
	login: () => void;
} & Record<string, unknown>;

declare global {
	interface Window {
		urlConfig?: T_CONFIG_MAP;
		token?: string;
		keycloak?: TKeycloakLike;
		user?: T_KEYCLOAK_USER;
	}
}
