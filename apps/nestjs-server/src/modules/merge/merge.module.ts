import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsonCommitEntity } from '../json-data/entities/json-commit.entity';
import { SnapshotEntity } from '../snapshots/entities/snapshot.entity';
import { JsonExportService } from '../json-data/services/json-export.service';
import { JsonImportService } from '../json-data/services/json-import.service';
import { JsonCommitService } from '../json-data/services/json-commit.service';
import { SnapshotService } from '../snapshots/services/snapshot.service';
import { ChangeEntity } from '../json-data/entities/change.entity';
import { EntityEntity } from '../json-data/entities/entity.entity';
import { EntityTypeEntity } from '../json-data/entities/entity-type.entity';
import { EntityContainerEntity } from '../json-data/entities/entity-container.entity';
import { SystemsEntity } from '../json-data/entities/systems.entity';
import { EntityMapEntity } from '../json-data/entities/entity-map.entity';
import { AttributeEntity } from '../json-data/entities/attribute.entity';
import { AttributeTypeEntity } from '../json-data/entities/attribute-type.entity';
import { AttributeMapEntity } from '../json-data/entities/attribute-map.entity';
import { AttributeMapSourceEntity } from '../json-data/entities/attribute-map-source.entity';
import { EntityAttributeMapEntity } from '../json-data/entities/entity-attribute-map.entity';
import { ProcessEntity } from '../json-data/entities/process.entity';
import { ProcessTypeEntity } from '../json-data/entities/process-type.entity';
import { ProcessGroupEntity } from '../json-data/entities/process-group.entity';
import { DiffService } from '../json-data/services/diff.service';
import { MergeController } from './controllers/merge.controller';
import { MergeService } from './services/merge.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            JsonCommitEntity,
            SnapshotEntity,
            ChangeEntity,
            EntityEntity,
            EntityTypeEntity,
            EntityContainerEntity,
            SystemsEntity,
            EntityMapEntity,
            AttributeEntity,
            AttributeTypeEntity,
            AttributeMapEntity,
            AttributeMapSourceEntity,
            EntityAttributeMapEntity,
            ProcessEntity,
            ProcessTypeEntity,
            ProcessGroupEntity,
        ]),
        ConfigModule,
    ],
    controllers: [MergeController],
    providers: [
        MergeService,
        DiffService,
        JsonExportService,
        JsonImportService,
        JsonCommitService,
        SnapshotService,
    ],
    exports: [MergeService],
})
export class MergeModule {}