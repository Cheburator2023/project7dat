import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IDatabaseProvider } from "./interfaces/database.interface";
import { DatabaseProvider } from "./providers/database-storage.provider";
import { MemoryStorageService } from "./service/memory-storage.service";

@Module({})
export class DatabaseModule {
	static forRoot(): DynamicModule {
		const databaseProvider: Provider = {
			provide: "DATABASE_PROVIDER",
			useFactory: (
				configService: ConfigService,
				_memoryStorageService: MemoryStorageService,
			): IDatabaseProvider => {
				return new DatabaseProvider(configService);
			},
			inject: [ConfigService, MemoryStorageService],
		};

		const providers = [databaseProvider, MemoryStorageService];

		return {
			module: DatabaseModule,
			providers,
			exports: providers,
			global: true,
		};
	}
}
