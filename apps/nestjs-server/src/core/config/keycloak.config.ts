import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('keycloak', () => ({
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080/auth',
    realm: process.env.KEYCLOAK_REALM || 'master',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'dl-client',
    secret: process.env.KEYCLOAK_SECRET || 'secret',
    bearerOnly: process.env.KEYCLOAK_BEARER_ONLY === 'true' || true,
    tokenValidation: process.env.KEYCLOAK_TOKEN_VALIDATION || 'offline',
}));

export const keycloakValidationSchema = Joi.object({
    KEYCLOAK_URL: Joi.string().uri().required(),
    KEYCLOAK_REALM: Joi.string().required(),
    KEYCLOAK_CLIENT_ID: Joi.string().required(),
    KEYCLOAK_SECRET: Joi.string().required(),
    KEYCLOAK_BEARER_ONLY: Joi.boolean().default(true),
    KEYCLOAK_TOKEN_VALIDATION: Joi.string().valid('online', 'offline', 'none').default('offline'),
});