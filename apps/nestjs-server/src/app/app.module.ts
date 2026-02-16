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
import { SnapshotEntity } from "src/modules/snapshots/entities/snapshot.entity";
import { KeycloakModule } from "src/core/auth/keycloak/keycloak.module";
import {S2TModule} from "../modules/s2t-converter/s2t.module";

@Module({})
export class AppModule {
	static forRoot(): DynamicModule {
		const imports = [
			SharedModule.forRoot(),
			JsonDataModule.forRoot(),
			SnapshotsModule.forRoot(),
			DatabaseSchemaModule,
			ChangelogModule,
			S2TModule,
			ConfigModule.forRoot(),
			KeycloakModule.forRoot(),
		];

		imports.push(
			TypeOrmModule.forRootAsync({
				imports: [ConfigModule],
				useFactory: async () => databaseConfig(),
				inject: [ConfigService],
			}),
		);

		imports.push(TypeOrmModule.forFeature([SnapshotEntity]));

		return {
			module: AppModule,
			imports,
			controllers: [AppController],
			providers: [AppService],
		};
	}
}
