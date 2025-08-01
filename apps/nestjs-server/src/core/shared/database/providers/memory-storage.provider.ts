import { Injectable } from '@nestjs/common';
import { IDatabaseProvider } from '../interfaces/database.interface';
import { JsonDataEntity } from '../../../../modules/json-data/entities/json-data.entity';
import { JsonCommitEntity } from '../../../../modules/json-data/entities/json-commit.entity';
import { MemoryStorageService } from '../service/memory-storage.service';
import { EntityTarget, ObjectLiteral, Repository } from "typeorm";

@Injectable()
export class MemoryStorageProvider implements IDatabaseProvider {
    constructor(private readonly memoryStorageService: MemoryStorageService) {}

    getConfig(): any {
        return {
            type: 'memory',
            entities: [JsonDataEntity, JsonCommitEntity],
        };
    }

    async connect(): Promise<void> {
        console.log('Using in-memory storage');
    }

    async disconnect(): Promise<void> {
        this.memoryStorageService.clear();
        console.log('Cleared in-memory storage');
    }

    getRepository<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> {
        throw new Error('Method not implemented in memory provider');
    }

    async transaction<T>(operation: (entityManager: any) => Promise<T>): Promise<T> {
        return operation({});
    }
}