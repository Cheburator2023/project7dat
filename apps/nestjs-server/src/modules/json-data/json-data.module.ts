import {Module, DynamicModule, Global} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "./entities/json-data.entity";
import { JsonCommitEntity } from "./entities/json-commit.entity";
import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";
import { JsonDataController } from "./controllers/json-data.controller";
import { JsonCommitController } from "./controllers/json-commit.controller";
import { MemoryStorageService } from "../../core/shared/database/service/memory-storage.service";
import { ChangelogModule } from "../changelog/changelog.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChangelogService } from "../changelog/services/changelog.service";
import { ChangelogMemoryStorageService } from "../changelog/services/changelog-memory-storage.service";

@Global()
@Module({})
export class JsonDataModule {
	static forRoot(): DynamicModule {
		const configService = new ConfigService();
		const isProduction = configService.get("app.isProduction");

		const imports = isProduction
			? [TypeOrmModule.forFeature([JsonDataEntity, JsonCommitEntity])]
			: [];

		const providers = [
			JsonDataService,
			JsonCommitService,
			ChangelogModule,
			MemoryStorageService,
			{
				provide: ConfigService,
				useValue: new ConfigService(),
			},
		];

		return {
			module: JsonDataModule,
			imports: [...imports, ConfigModule.forRoot()],
			controllers: [JsonDataController, JsonCommitController],
			providers: [JsonDataService, JsonCommitService, ChangelogService, ChangelogMemoryStorageService],
			exports: [JsonDataService, JsonCommitService, ChangelogService, ChangelogMemoryStorageService],
		};
	}
}
