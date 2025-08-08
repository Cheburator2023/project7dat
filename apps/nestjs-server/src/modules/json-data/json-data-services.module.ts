import { Module, DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "./entities/json-data.entity";
import { JsonCommitEntity } from "./entities/json-commit.entity";
import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";

import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({})
export class JsonDataServicesModule {
	static forRoot(): DynamicModule {
		const configService = new ConfigService();
		const isProduction = configService.get("app.isProduction");

		const imports = isProduction
			? [TypeOrmModule.forFeature([JsonDataEntity, JsonCommitEntity])]
			: [];

		const providers = [
			JsonDataService,
			JsonCommitService,
			{
				provide: ConfigService,
				useValue: new ConfigService(),
			},
		];

		return {
			module: JsonDataServicesModule,
			imports: [...imports, ConfigModule],
			providers,
			exports: [JsonDataService, JsonCommitService],
		};
	}
}
