import { DynamicModule, Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { SnapshotController } from "./controllers/snapshot.controller";
import { SnapshotService } from "./services/snapshot.service";
import { SnapshotEntity } from "./entities/snapshot.entity";
import { SnapshotMemoryStorageService } from "./services/snapshot-memory-storage.service";

@Global()
@Module({})
export class SnapshotsModule {
	static forRoot(): DynamicModule {
		const imports: any[] = [];
		const providers = [SnapshotService, SnapshotMemoryStorageService];

		if (process.env.NODE_ENV === "production") {
			imports.push(TypeOrmModule.forFeature([SnapshotEntity]));
		}

		return {
			module: SnapshotsModule,
			imports: [...imports, ConfigModule.forRoot()],
			controllers: [SnapshotController],
			providers,
			exports: [SnapshotService, SnapshotMemoryStorageService],
		};
	}
}
