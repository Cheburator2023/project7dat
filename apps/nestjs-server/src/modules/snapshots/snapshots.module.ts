import { DynamicModule, Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { SnapshotController } from "./controllers/snapshot.controller";
import { SnapshotService } from "./services/snapshot.service";
import { SnapshotEntity } from "./entities/snapshot.entity";
import { SnapshotMemoryStorageService } from "./services/snapshot-memory-storage.service";
import { ChangelogModule } from "../changelog/changelog.module";

@Global()
@Module({})
export class SnapshotsModule {
	static forRoot(): DynamicModule {
		const imports: any[] = [];
		const providers = [SnapshotService, SnapshotMemoryStorageService];

		const configService = new ConfigService();
		const isProduction = configService.get("app.isProduction");

		if (isProduction) {
			imports.push(TypeOrmModule.forFeature([SnapshotEntity]));
		}

		return {
			module: SnapshotsModule,
			imports: [...imports, ConfigModule.forRoot(), ChangelogModule],
			controllers: [SnapshotController],
			providers,
			exports: [SnapshotService, SnapshotMemoryStorageService],
		};
	}
}