import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JsonDataModule } from "src/modules/json-data/json-data.module";
import { SnapshotsModule } from "src/modules/snapshots/snapshots.module";
import { SharedModule } from "src/core/shared/shared.module";
import databaseConfig from "src/core/config/database.config";

@Module({})
export class AppModule {
	static forRoot(): DynamicModule {
		const imports = [
			SharedModule.forRoot(),
			JsonDataModule.forRoot(),
			SnapshotsModule.forRoot(),
			ConfigModule.forRoot(),
		];

		const configService = new ConfigService();
		if (configService.get("app.isProduction")) {
			imports.push(
				TypeOrmModule.forRootAsync({
					imports: [SharedModule],
					useFactory: async () => databaseConfig(),
				}),
			);
		}

		return {
			module: AppModule,
			imports,
			controllers: [AppController],
			providers: [AppService],
		};
	}
}
