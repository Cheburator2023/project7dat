import { DynamicModule, Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '../config/config.module';
import { HttpExceptionFilter } from '../api/filters/http-exception.filter';
import { ValidationPipe } from '../api/pipes/validation.pipe';
import { LoggingInterceptor } from '../api/interceptors/logging.interceptor';

@Global()
@Module({})
export class SharedModule {
    static forRoot(): DynamicModule {
        return {
            module: SharedModule,
            imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
            providers: [
                {
                    provide: APP_FILTER,
                    useClass: HttpExceptionFilter,
                },
                {
                    provide: APP_PIPE,
                    useClass: ValidationPipe,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useClass: LoggingInterceptor,
                },
            ],
            exports: [ConfigModule, DatabaseModule],
        };
    }
}