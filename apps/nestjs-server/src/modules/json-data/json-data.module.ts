import { Module, DynamicModule, Provider, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";

// Entities
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
import { FailedMappingsEntity } from "./entities/failed-mappings.entity";
import { EntityTypeEntity } from "./entities/entity-type.entity";
import { EntityContainerTypeEntity } from "./entities/entity-container-type.entity";
import { EntityContainerEntity } from "./entities/entity-container.entity";
import { AttributeTypeEntity } from "./entities/attribute-type.entity";
import { ProcessTypeEntity } from "./entities/process-type.entity";
import { ProcessGroupEntity } from "./entities/process-group.entity";
import { DependencyTypeEntity } from "./entities/dependency-type.entity";
import { SystemsEntity } from "./entities/systems.entity";
import { StreamSpaceEntity } from "./entities/stream-space.entity";
import { EntityMapSourceEntity } from "./entities/entity-map-source.entity";
import { S2tCommitEntity } from "./entities/s2t-commit.entity";

// Services
import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";
import { JsonImportService } from "./services/json-import.service";
import { JsonConflictService } from "./services/json-conflict.service";
import { JsonMigrationService } from "./services/json-migration.service";
import { ChangeRecordService } from "./services/change-record.service";
import { ProcessHandlingService } from "./services/process-handling.service";
import { EntityProcessingService } from "./services/entity-processing.service";
import { MappingProcessingService } from "./services/mapping-processing.service";
import { EntityTypeService } from "./services/entity-type.service";
import { AttributeTypeService } from "./services/attribute-type.service";
import { EntityContainerService } from "./services/entity-container.service";
import { DependencyCheckService } from "./services/dependency-check.service";
import { VersioningService } from "./services/versioning.service";
import { JsonStructureValidationService } from "./services/json-structure-validation.service";
import { JsonIntegrityValidationService } from "./services/json-integrity-validation.service";
import { JsonBusinessRulesValidationService } from "./services/json-business-rules-validation.service";
import { JsonSchemaVersionValidationService } from "./services/json-schema-version-validation.service";
import { JsonValidationOrchestratorService } from "./services/json-validation-orchestrator.service";
import { S2tConversionService } from "./services/s2t-conversion.service";
import { CacheService } from "./services/cache.service";
import { JsonExportService } from "./services/json-export.service";
import { S2tToCommitJsonService } from "src/modules/json-data/services/s2t-to-commit-json.service";
import { S2tCommitStoreService } from "./services/s2t-commit-store.service";
import { ProcessesService } from "./services/processes.service";

// Abstract classes
import {
	JsonStructureValidator,
	JsonBusinessRulesValidator,
	JsonIntegrityValidator,
	JsonSchemaVersionValidator,
} from "./services/interfaces/validation.interfaces";

// Controllers
import { JsonDataController } from "./controllers/json-data.controller";
import { JsonCommitController } from "./controllers/json-commit.controller";
import { JsonImportController } from "./controllers/json-import.controller";
import { JsonValidationController } from "./controllers/json-validation.controller";
import { S2tConversionController } from "./controllers/s2t-conversion.controller";
import { S2tCommitStoreController } from "./controllers/s2t-commit-store.controller";
import { JsonExportController } from "./controllers/json-export.controller";
import { CacheMonitorController } from "./controllers/cache-monitor.controller";
import { ProcessesController } from "./controllers/processes.controller";

// Modules
import { ChangelogModule } from "../changelog/changelog.module";

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
			EntityAttributeMapEntity,
			FailedMappingsEntity,
			EntityTypeEntity,
			EntityContainerTypeEntity,
			EntityContainerEntity,
			AttributeTypeEntity,
			ProcessTypeEntity,
			ProcessGroupEntity,
			DependencyTypeEntity,
			SystemsEntity,
			StreamSpaceEntity,
			EntityMapSourceEntity,
			S2tCommitEntity,
		];
		const imports = [
			TypeOrmModule.forFeature(entities),
			ConfigModule.forRoot(),
			ChangelogModule,
			CacheModule.registerAsync({
				imports: [ConfigModule],
				useFactory: async (configService: ConfigService) => {
					const cacheTtl = configService.get<number>("CACHE_TTL", 600); // 10 минут в секундах

					return {
						store: "memory", // Используем in-memory хранилище
						ttl: cacheTtl, // TTL в секундах
						max: 100, // Максимальное количество элементов в кэше
					};
				},
				inject: [ConfigService],
			}),
		];

		const providers: Provider[] = [
			// Core services
			JsonDataService,
			JsonCommitService,
			JsonImportService,
			JsonExportService,
			CacheService,
			S2tConversionService,
			S2tToCommitJsonService,
			S2tCommitStoreService,
			ProcessesService,

			// Conflict and Migration services
			JsonConflictService,
			JsonMigrationService,

			// Processing services
			ChangeRecordService,
			ProcessHandlingService,
			EntityProcessingService,
			MappingProcessingService,

			// Support services
			EntityTypeService,
			AttributeTypeService,
			EntityContainerService,
			DependencyCheckService,
			VersioningService,

			// New Validation Services
			JsonStructureValidationService,
			JsonIntegrityValidationService,
			JsonBusinessRulesValidationService,
			JsonSchemaVersionValidationService,
			JsonValidationOrchestratorService,

			// Registering abstract classes as providers (DI tokens) - incoming подход
			{
				provide: JsonStructureValidator,
				useClass: JsonStructureValidationService,
			},
			{
				provide: JsonBusinessRulesValidator,
				useClass: JsonBusinessRulesValidationService,
			},
			{
				provide: JsonIntegrityValidator,
				useClass: JsonIntegrityValidationService,
			},
			{
				provide: JsonSchemaVersionValidator,
				useClass: JsonSchemaVersionValidationService,
			},

			// External services (from ChangelogModule)
			ConfigService,
		];

		const controllers = [
			JsonDataController,
			JsonCommitController,
			JsonImportController,
			JsonValidationController,
			JsonExportController,
			CacheMonitorController,
			S2tConversionController,
			S2tCommitStoreController,
			ProcessesController,
		];

		const exports = [
			JsonDataService,
			JsonCommitService,
			JsonImportService,
			JsonConflictService,
			JsonMigrationService,
			ChangeRecordService,
			ProcessHandlingService,
			EntityProcessingService,
			MappingProcessingService,
			EntityTypeService,
			AttributeTypeService,
			EntityContainerService,
			DependencyCheckService,
			VersioningService,
			JsonStructureValidationService,
			JsonIntegrityValidationService,
			JsonBusinessRulesValidationService,
			JsonSchemaVersionValidationService,
			JsonValidationOrchestratorService,
			JsonExportService,
			CacheService,
			S2tConversionService,
			S2tToCommitJsonService,

			// Abstract classes
			JsonStructureValidator,
			JsonBusinessRulesValidator,
			JsonIntegrityValidator,
			JsonSchemaVersionValidator,
		];

		return {
			module: JsonDataModule,
			imports,
			controllers,
			providers,
			exports,
		};
	}
}
