import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    KeycloakConnectOptions,
    KeycloakConnectOptionsFactory,
    TokenValidation,
} from 'nest-keycloak-connect';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createKeycloakConnectOptions(): KeycloakConnectOptions {
        if (this.configService.get<string>('NODE_ENV') === 'development') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        const authServerUrl = this.getRequiredConfig('keycloak.url');
        const realm = this.getRequiredConfig('keycloak.realm');
        const clientId = this.getRequiredConfig('keycloak.clientId');
        const secret = this.getRequiredConfig('keycloak.secret');
        const tokenValidation = this.configService.get<TokenValidation>('keycloak.tokenValidation') || TokenValidation.OFFLINE;
        const bearerOnly = this.configService.get<boolean>('keycloak.bearerOnly') ?? true;

        return {
            authServerUrl,
            realm,
            clientId,
            secret,
            tokenValidation,
            bearerOnly,
        };
    }

    private getRequiredConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (value === undefined || value === null) {
            throw new Error(`Missing required configuration: ${key}`);
        }
        return value;
    }
}