import { registerAs } from "@nestjs/config";
import * as Joi from "joi";
import { TokenValidation } from "nest-keycloak-connect";

export default registerAs("keycloak", () => ({
	url: process.env.KEYCLOAK_URL || "http://localhost:8080/auth",
	realm: process.env.KEYCLOAK_REALM || "master",
	clientId: process.env.KEYCLOAK_CLIENT || "dl-client",
	secret: process.env.KEYCLOAK_SECRET || "secret",
	bearerOnly: process.env.KEYCLOAK_BEARER_ONLY === "true" || true,
	tokenValidation:
		process.env.KEYCLOAK_TOKEN_VALIDATION || TokenValidation.OFFLINE,
}));

export const keycloakValidationSchema = Joi.object({
	KEYCLOAK_URL: Joi.string()
		.uri()
		.optional()
		.description("URL сервера KeyCloak (включая /auth)"),
	KEYCLOAK_REALM: Joi.string().optional().description("Realm в KeyCloak"),
	KEYCLOAK_CLIENT: Joi.string().optional().description("Client ID в KeyCloak"),
	KEYCLOAK_SECRET: Joi.string()
		.optional()
		.description("Client secret в KeyCloak"),
	KEYCLOAK_BEARER_ONLY: Joi.boolean()
		.default(true)
		.description("Режим только для bearer token"),
	KEYCLOAK_TOKEN_VALIDATION: Joi.string()
		.valid("online", "offline", "none")
		.default("offline")
		.description("Тип валидации токена"),
});
