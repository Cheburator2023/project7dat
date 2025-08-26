import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { KeycloakConnectModule } from "nest-keycloak-connect";
import { KeycloakConfigService } from "./keycloak-config.service";

@Module({})
export class KeycloakModule {
	static forRoot(): DynamicModule {
		const isGodMode = [true, 'true', 1, '1'].includes(
			process.env.NO_ROLES as any
		);

		if (isGodMode) {
			console.warn('⚠️  God mode is active - Keycloak completely disabled');
			return {
				module: KeycloakModule,
				providers: [
				],
				exports: [],
			};
		}

		return {
			module: KeycloakModule,
			imports: [
				ConfigModule.forRoot(),
				KeycloakConnectModule.registerAsync({
					useClass: KeycloakConfigService,
					imports: [ConfigModule],
				}),
			],
			providers: [KeycloakConfigService],
			exports: [KeycloakConnectModule, KeycloakConfigService],
		};
	}
}