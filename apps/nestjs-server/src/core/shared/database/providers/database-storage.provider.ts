import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, EntityTarget, Repository, ObjectLiteral } from 'typeorm';
import { IDatabaseProvider } from '../interfaces/database.interface';

@Injectable()
export class DatabaseProvider implements IDatabaseProvider {
    private dataSource: DataSource;

    constructor(private readonly configService: ConfigService) {}

    getConfig(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            host: this.configService.get<string>("DB_HOST", "localhost"),
            port: this.configService.get<number>("DB_PORT", 5432),
            username: this.configService.get<string>("DB_USERNAME", "postgres"),
            password: this.configService.get<string>("DB_PASSWORD", "postgres"),
            database: this.configService.get<string>("DB_NAME", "calculation_db"),
            entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
            synchronize: this.configService.get('DB_SYNCHRONIZE') === 'true',
            logging: this.configService.get('DB_LOGGING') === 'true',
            migrations: [__dirname + '/../../../../migrations/*{.ts,.js}'],
            migrationsRun: true,
        };
    }

    async connect(): Promise<void> {
        if (!this.dataSource) {
            this.dataSource = new DataSource(this.getConfig() as any);
        }
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }
    }

    async disconnect(): Promise<void> {
        if (this.dataSource && this.dataSource.isInitialized) {
            await this.dataSource.destroy();
        }
    }

    getRepository<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): Repository<Entity> {
        if (!this.dataSource) {
            throw new Error('Database not connected');
        }
        return this.dataSource.getRepository(entity);
    }

    async transaction<T>(operation: (entityManager: any) => Promise<T>): Promise<T> {
        if (!this.dataSource) {
            throw new Error('Database not connected');
        }
        return this.dataSource.transaction(operation);
    }
}