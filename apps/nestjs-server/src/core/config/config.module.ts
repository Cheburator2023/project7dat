import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig, { appValidationSchema } from './app.config';
import databaseConfig, { databaseValidationSchema } from './database.config';
import keycloakConfig, { keycloakValidationSchema } from './keycloak.config';
import Joi from 'joi';

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
            load: [appConfig, databaseConfig, keycloakConfig],
            validationSchema: Joi.object({
                ...appValidationSchema,
                ...databaseValidationSchema,
                ...keycloakValidationSchema
            }),
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule {
    static forRoot() {
        return {
            module: ConfigModule,
            global: true,
        };
    }
}