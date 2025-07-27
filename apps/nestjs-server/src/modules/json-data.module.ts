import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "../entities/json-data.entity";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonDataService } from "../services/json-data.service";
import { JsonCommitService } from "../services/json-commit.service";
import { JsonDataController } from "../controllers/json-data.controller";
import { JsonCommitController } from "../controllers/json-commit.controller";
import { MemoryStorageService } from "../shared/database/memory-storage.service";

const isDevelopment = process.env.NODE_ENV !== "production";

@Module({
	imports: [
		...(isDevelopment
			? []
			: [TypeOrmModule.forFeature([JsonDataEntity, JsonCommitEntity])]),
	],
	controllers: [JsonDataController, JsonCommitController],
	providers: [JsonDataService, JsonCommitService, MemoryStorageService],
	exports: [JsonDataService, JsonCommitService],
})
export class JsonDataModule {}
