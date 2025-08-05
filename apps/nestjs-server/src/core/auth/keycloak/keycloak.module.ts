import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { KeycloakConfigService } from './keycloak-config.service';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';
import { GodModeGuard } from './god-mode.guard';

@Module({})
export class KeycloakModule {
    static forRoot(): DynamicModule {
        return {
            module: KeycloakModule,
            imports: [
                ConfigModule.forRoot(),
                KeycloakConnectModule.registerAsync({
                    useClass: KeycloakConfigService,
                }),
            ],
            providers: [
                KeycloakConfigService,
                // AuthGuard
                {
                    provide: 'DELEGATE_GUARD_AUTH',
                    useClass: AuthGuard,
                },
                {
                    provide: APP_GUARD,
                    useFactory: (reflector: Reflector, delegateGuard: AuthGuard) =>
                        new GodModeGuard(reflector, delegateGuard),
                    inject: [Reflector, 'DELEGATE_GUARD_AUTH'],
                },
                // ResourceGuard
                {
                    provide: 'DELEGATE_GUARD_RESOURCE',
                    useClass: ResourceGuard,
                },
                {
                    provide: APP_GUARD,
                    useFactory: (reflector: Reflector, delegateGuard: ResourceGuard) =>
                        new GodModeGuard(reflector, delegateGuard),
                    inject: [Reflector, 'DELEGATE_GUARD_RESOURCE'],
                },
                // RoleGuard
                {
                    provide: 'DELEGATE_GUARD_ROLE',
                    useClass: RoleGuard,
                },
                {
                    provide: APP_GUARD,
                    useFactory: (reflector: Reflector, delegateGuard: RoleGuard) =>
                        new GodModeGuard(reflector, delegateGuard),
                    inject: [Reflector, 'DELEGATE_GUARD_ROLE'],
                },
            ],
            exports: [KeycloakConnectModule, KeycloakConfigService],
        };
    }
}