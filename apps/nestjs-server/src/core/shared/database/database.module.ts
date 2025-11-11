import { DynamicModule, Module, Provider } from "@nestjs/common";
import { IDatabaseProvider } from "./interfaces/database.interface";
import { DatabaseProvider } from "./providers/database-storage.provider";

@Module({})
export class DatabaseModule {
	static forRoot(): DynamicModule {
		const databaseProvider: Provider = {
			provide: "DATABASE_PROVIDER",
			useFactory: (): IDatabaseProvider => {
				return new DatabaseProvider();
			},
		};

		const providers = [databaseProvider];

		return {
			module: DatabaseModule,
			providers,
			exports: providers,
			global: true,
		};
	}
}
