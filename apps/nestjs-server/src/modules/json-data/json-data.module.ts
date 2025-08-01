import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "./entities/json-data.entity";
import { JsonCommitEntity } from "./entities/json-commit.entity";
import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";
import { JsonDataController } from "./controllers/json-data.controller";
import { JsonCommitController } from "./controllers/json-commit.controller";
import { MemoryStorageService } from "../../core/shared/database/service/memory-storage.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({})
export class JsonDataModule {
	static forRoot(): DynamicModule {
		const configService = new ConfigService();
		const isProduction = configService.get('NODE_ENV') === 'production';

		const imports = isProduction
			? [TypeOrmModule.forFeature([JsonDataEntity, JsonCommitEntity])]
			: [];

		const providers = [
			JsonDataService,
			JsonCommitService,
			MemoryStorageService,
			{
				provide: ConfigService,
				useValue: new ConfigService(),
			},
		];

		return {
			module: JsonDataModule,
			imports: [
				...imports,
				ConfigModule.forRoot(),
			],
			controllers: [JsonDataController, JsonCommitController],
			providers,
			exports: [JsonDataService, JsonCommitService],
		};
	}
}