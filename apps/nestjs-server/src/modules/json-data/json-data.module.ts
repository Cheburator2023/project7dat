import { Module, DynamicModule, Provider, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

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

// Services
import { JsonDataService } from "./services/json-data.service";
import { JsonCommitService } from "./services/json-commit.service";
import { JsonMappingService } from "./services/json-mapping.service";
import { ChangeRecordService } from './services/change-record.service';
import { ProcessHandlingService } from './services/process-handling.service';
import { EntityProcessingService } from './services/entity-processing.service';
import { MappingProcessingService } from './services/mapping-processing.service';
import { EntityTypeService } from "./services/entity-type.service";
import { AttributeTypeService } from "./services/attribute-type.service";
import { EntityContainerService } from "./services/entity-container.service";
import { DependencyCheckService } from "./services/dependency-check.service";
import { JsonValidationService } from "./services/json-validation.service";
import { VersioningService } from "./services/versioning.service";

// Controllers
import { JsonDataController } from "./controllers/json-data.controller";
import { JsonCommitController } from "./controllers/json-commit.controller";
import { JsonImportController } from "./controllers/json-import.controller";
import { JsonValidationController } from "./controllers/json-validation.controller";

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
        ];

        const imports = [
            TypeOrmModule.forFeature(entities),
            ConfigModule.forRoot(),
            ChangelogModule,
        ];

        const providers: Provider[] = [
            // Core services
            JsonDataService,
            JsonCommitService,
            JsonMappingService,

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
            JsonValidationService,
            VersioningService,

            // External services (from ChangelogModule)
            ConfigService,
        ];

        const controllers = [
            JsonDataController,
            JsonCommitController,
            JsonImportController,
            JsonValidationController,
        ];

        const exports = [
            JsonDataService,
            JsonCommitService,
            JsonMappingService,
            ChangeRecordService,
            ProcessHandlingService,
            EntityProcessingService,
            MappingProcessingService,
            EntityTypeService,
            AttributeTypeService,
            EntityContainerService,
            DependencyCheckService,
            JsonValidationService,
            VersioningService,
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
