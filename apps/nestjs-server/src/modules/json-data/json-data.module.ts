import {Module, DynamicModule, Provider,  Global} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "./entities/json-data.entity";
import { JsonCommitEntity } from "./entities/json-commit.entity";
import { ChangeEntity } from "./entities/change.entity";
import { ProcessEntity } from "./entities/process.entity";
import { EntityEntity } from "./entities/entity.entity";
import { AttributeEntity } from "./entities/attribute.entity";
import { EntityMapEntity } from "./entities/entity-map.entity";
import { AttributeMapEntity } from "./entities/attribute-map.entity";
import { AttributeMapSourceEntity } from "./entities/attribute-map-source.entity";
import { EntityAttributeMapEntity } from "./entities/entity-attribute-map.entity";

import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";
import { JsonMappingService } from "./services/json-mapping.service";
import { EntityTypeService } from "./services/entity-type.service";
import { AttributeTypeService } from "./services/attribute-type.service";
import { EntityContainerService } from "./services/entity-container.service";
import { DependencyCheckService } from "./services/dependency-check.service";
import { JsonValidationService } from "./services/json-validation.service";
import { VersioningService } from "./services/versioning.service";

import { JsonDataController } from "./controllers/json-data.controller";
import { JsonCommitController } from "./controllers/json-commit.controller";
import { JsonImportController } from "./controllers/json-import.controller";
import { JsonValidationController } from "./controllers/json-validation.controller";

import { MemoryStorageService } from "../../core/shared/database/service/memory-storage.service";
import { ChangelogModule } from "../changelog/changelog.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChangelogService } from "../changelog/services/changelog.service";
import { ChangelogMemoryStorageService } from "../changelog/services/changelog-memory-storage.service";

@Global()
@Module({})
export class JsonDataModule {
	static forRoot(): DynamicModule {
		const entities = [
			JsonDataEntity,
			JsonCommitEntity,
			ChangeEntity,
			ProcessEntity,
			EntityEntity,
			AttributeEntity,
			EntityMapEntity,
			AttributeMapEntity,
			AttributeMapSourceEntity,
			EntityAttributeMapEntity
		];

		const imports = [
			TypeOrmModule.forFeature(entities),
			ConfigModule.forRoot(),
			ChangelogModule,
		];

		const providers: Provider[] = [
			JsonDataService,
			JsonCommitService,
			JsonMappingService,
			EntityTypeService,
			AttributeTypeService,
			EntityContainerService,
			DependencyCheckService,
			JsonValidationService,
			VersioningService,
			MemoryStorageService,
			ChangelogService,
			ChangelogMemoryStorageService,
			ConfigService,
			{
				provide: 'DATA_SOURCE',
				useFactory: (configService: ConfigService) => {
					return null;
				},
				inject: [ConfigService],
			}
		];

		return {
			module: JsonDataModule,
			imports,
			controllers: [
				JsonDataController,
				JsonCommitController,
				JsonImportController,
				JsonValidationController
			],
			providers,
			exports: [
				JsonDataService,
				JsonCommitService,
				JsonMappingService,
				EntityTypeService,
				AttributeTypeService,
				EntityContainerService,
				DependencyCheckService,
				JsonValidationService,
				VersioningService,
				ChangelogService,
				ChangelogMemoryStorageService
			],
		};
	}
}
