import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JsonDataModule } from "src/modules/json-data/json-data.module";
import { SnapshotsModule } from "src/modules/snapshots/snapshots.module";
import { DatabaseSchemaModule } from "src/modules/database-schema/database-schema.module";
import { ChangelogModule } from "src/modules/changelog/changelog.module";
import { SharedModule } from "src/core/shared/shared.module";
import { databaseConfig } from "src/core/config/database.config";
import { KeycloakModule } from "src/core/auth/keycloak/keycloak.module";

@Module({})
export class AppModule {
	static forRoot(): DynamicModule {
		const imports = [
			SharedModule.forRoot(),
			JsonDataModule.forRoot(),
			SnapshotsModule.forRoot(),
			DatabaseSchemaModule,
			ChangelogModule,
			ConfigModule.forRoot(),
			KeycloakModule.forRoot(),
			// Initialize TypeORM for all environments using databaseConfig
			TypeOrmModule.forRootAsync({
				imports: [ConfigModule],
				useFactory: async () => databaseConfig(),
				inject: [ConfigService],
			}),
			// TypeORM is initialized globally via forRootAsync; feature repositories are registered in their modules
		];

		return {
			module: AppModule,
			imports,
			controllers: [AppController],
			providers: [AppService],
		};
	}
}
