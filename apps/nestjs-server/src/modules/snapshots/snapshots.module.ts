import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnapshotEntity } from "./entities/snapshot.entity";
import { SnapshotService } from "./services/snapshot.service";
import { SnapshotController } from "./controllers/snapshot.controller";
import { SnapshotMemoryStorageService } from "./services/snapshot-memory-storage.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JsonDataServicesModule } from "../json-data/json-data-services.module";

@Module({})
export class SnapshotsModule {
	static forRoot(): DynamicModule {
		const configService = new ConfigService();
		const isProduction = configService.get<boolean>("app.isProduction");

		const imports: any[] = [ConfigModule, JsonDataServicesModule.forRoot()];

		if (isProduction) {
			imports.push(TypeOrmModule.forFeature([SnapshotEntity]));
		}

		return {
			module: SnapshotsModule,
			imports,
			controllers: [SnapshotController],
			providers: [
				SnapshotService,
				SnapshotMemoryStorageService,
				{
					provide: ConfigService,
					useValue: new ConfigService(),
				},
			],
			exports: [SnapshotService, SnapshotMemoryStorageService],
		};
	}
}
