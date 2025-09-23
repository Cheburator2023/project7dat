import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KeycloakConnectModule } from "nest-keycloak-connect";
import { KeycloakConfigService } from "./keycloak-config.service";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { AuthGuard, ResourceGuard, RoleGuard } from "nest-keycloak-connect";
import { GodModeGuard } from "./god-mode.guard";

/**
 * Модуль для работы с KeyCloak
 *
 * @description
 * Предоставляет интеграцию с KeyCloak для аутентификации и авторизации.
 *
 * @features
 * - Поддержка offline и online валидации токенов
 * - Гибкая конфигурация через .env
 * - Режим "бога" (NO_ROLES=true) для разработки
 * - Три уровня защиты: Auth, Resource, Role
 */
@Module({})
export class KeycloakModule {
	static forRoot(): DynamicModule {
		const isGodMode = process.env.NO_ROLES === "true";

		const imports: any[] = [ConfigModule.forRoot()];

		// Only register KeycloakConnectModule if not in god mode
		if (!isGodMode) {
			imports.push(
				KeycloakConnectModule.registerAsync({
					useClass: KeycloakConfigService,
					imports: [ConfigModule],
				}),
			);
		}

		const providers: any[] = [KeycloakConfigService];

		// Only add Keycloak guards when not in god mode
		if (!isGodMode) {
			providers.push(
				// AuthGuard
				{
					provide: "DELEGATE_GUARD_AUTH",
					useClass: AuthGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (
						reflector: Reflector,
						configService: ConfigService,
						delegateGuard: AuthGuard,
					) => new GodModeGuard(reflector, configService, delegateGuard),
					inject: [Reflector, ConfigService, "DELEGATE_GUARD_AUTH"],
				},
				// ResourceGuard
				{
					provide: "DELEGATE_GUARD_RESOURCE",
					useClass: ResourceGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (
						reflector: Reflector,
						configService: ConfigService,
						delegateGuard: ResourceGuard,
					) => new GodModeGuard(reflector, configService, delegateGuard),
					inject: [Reflector, ConfigService, "DELEGATE_GUARD_RESOURCE"],
				},
				// RoleGuard
				{
					provide: "DELEGATE_GUARD_ROLE",
					useClass: RoleGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (
						reflector: Reflector,
						configService: ConfigService,
						delegateGuard: RoleGuard,
					) => new GodModeGuard(reflector, configService, delegateGuard),
					inject: [Reflector, ConfigService, "DELEGATE_GUARD_ROLE"],
				},
			);
		} else {
			// In god mode, provide simple guards that always allow access
			providers.push({
				provide: APP_GUARD,
				useFactory: (reflector: Reflector, configService: ConfigService) =>
					new GodModeGuard(reflector, configService),
				inject: [Reflector, ConfigService],
			});
		}

		return {
			module: KeycloakModule,
			imports,
			providers,
			exports: isGodMode
				? [KeycloakConfigService]
				: [KeycloakConnectModule, KeycloakConfigService],
		};
	}
}
