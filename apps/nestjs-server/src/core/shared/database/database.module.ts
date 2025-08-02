import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseProvider } from './interfaces/database.interface';
import { MemoryStorageProvider } from './providers/memory-storage.provider';
import { DatabaseProvider } from './providers/database-storage.provider';
import { MemoryStorageService } from './service/memory-storage.service';

@Module({})
export class DatabaseModule {
    static forRoot(): DynamicModule {
        const databaseProvider: Provider = {
            provide: 'DATABASE_PROVIDER',
            useFactory: (configService: ConfigService, memoryStorageService: MemoryStorageService): IDatabaseProvider => {
                return configService.get('NODE_ENV') === 'production'
                    ? new DatabaseProvider(configService)
                    : new MemoryStorageProvider(memoryStorageService);
            },
            inject: [ConfigService, MemoryStorageService],
        };

        const providers = [
            databaseProvider,
            MemoryStorageService,
        ];

        return {
            module: DatabaseModule,
            providers,
            exports: providers,
            global: true,
        };
    }
}