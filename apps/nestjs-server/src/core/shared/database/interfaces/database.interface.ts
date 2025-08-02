import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityTarget, Repository, ObjectLiteral } from 'typeorm';

export interface IDatabaseProvider {
    getConfig(): TypeOrmModuleOptions | any;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getRepository<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity>;
    transaction<T>(operation: (entityManager: any) => Promise<T>): Promise<T>;
}