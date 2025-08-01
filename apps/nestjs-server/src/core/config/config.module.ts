import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import * as Joi from 'joi';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
            load: [appConfig, databaseConfig],
            validationSchema: Joi.object({
                NODE_ENV: Joi.string()
                    .valid('development', 'production', 'test')
                    .default('development'),
                DB_HOST: Joi.string().default('localhost'),
                DB_PORT: Joi.number().default(5432),
                DB_USERNAME: Joi.string().default('postgres'),
                DB_PASSWORD: Joi.string().default('password'),
                DB_NAME: Joi.string().default('data_lineage'),
                DB_SYNCHRONIZE: Joi.boolean().default(true),
                DB_LOGGING: Joi.boolean().default(true),
                DB_MIGRATIONS_RUN: Joi.boolean().default(true),
                DEV_DB_TYPE: Joi.string().valid('postgres', 'pglite', 'memory').default('pglite'),
                DEV_DB_HOST: Joi.string().when('DEV_DB_TYPE', {
                    is: 'postgres',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
                DEV_DB_PORT: Joi.number().when('DEV_DB_TYPE', {
                    is: 'postgres',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
                DEV_DB_NAME: Joi.string().default('data_lineage_dev'),
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