import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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
		return {
			module: KeycloakModule,
			imports: [
				ConfigModule.forRoot(),
				KeycloakConnectModule.registerAsync({
					useClass: KeycloakConfigService,
					imports: [ConfigModule],
				}),
			],
			providers: [
				KeycloakConfigService,
				// AuthGuard
				{
					provide: "DELEGATE_GUARD_AUTH",
					useClass: AuthGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (reflector: Reflector, delegateGuard: AuthGuard) =>
						new GodModeGuard(reflector, delegateGuard),
					inject: [Reflector, "DELEGATE_GUARD_AUTH"],
				},
				// ResourceGuard
				{
					provide: "DELEGATE_GUARD_RESOURCE",
					useClass: ResourceGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (reflector: Reflector, delegateGuard: ResourceGuard) =>
						new GodModeGuard(reflector, delegateGuard),
					inject: [Reflector, "DELEGATE_GUARD_RESOURCE"],
				},
				// RoleGuard
				{
					provide: "DELEGATE_GUARD_ROLE",
					useClass: RoleGuard,
				},
				{
					provide: APP_GUARD,
					useFactory: (reflector: Reflector, delegateGuard: RoleGuard) =>
						new GodModeGuard(reflector, delegateGuard),
					inject: [Reflector, "DELEGATE_GUARD_ROLE"],
				},
			],
			exports: [KeycloakConnectModule, KeycloakConfigService],
		};
	}
}
