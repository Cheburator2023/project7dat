import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	KeycloakConnectOptions,
	KeycloakConnectOptionsFactory,
	TokenValidation,
} from "nest-keycloak-connect";

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
	constructor(private readonly configService: ConfigService) {}

	createKeycloakConnectOptions(): KeycloakConnectOptions {
		if (this.configService.get<string>("NODE_ENV") === "development") {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}

		return {
			authServerUrl: this.getRequiredConfig("keycloak.url"),
			realm: this.getRequiredConfig("keycloak.realm"),
			clientId: this.getRequiredConfig("keycloak.clientId"),
			secret: this.getRequiredConfig("keycloak.secret"),
			tokenValidation:
				this.configService.get<TokenValidation>("keycloak.tokenValidation") ||
				TokenValidation.OFFLINE,
			bearerOnly:
				this.configService.get<boolean>("keycloak.bearerOnly") ?? true,
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
