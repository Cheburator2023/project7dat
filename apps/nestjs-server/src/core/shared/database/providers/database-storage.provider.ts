import { Injectable } from "@nestjs/common";
import { DataSource, EntityTarget, Repository, ObjectLiteral } from "typeorm";
import { IDatabaseProvider } from "../interfaces/database.interface";
import { databaseConfig, PostgresDatabaseConfig } from "../../../config/database.config";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseProvider implements IDatabaseProvider {
    private dataSource: DataSource;

    constructor(private readonly configService: ConfigService) {}

    getConfig(): PostgresDatabaseConfig {
        return databaseConfig();
    }

    async connect(): Promise<void> {
        if (!this.dataSource) {
            const config = this.getConfig();
            this.dataSource = new DataSource({
                type: "postgres",
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
                database: config.database,
                entities: config.entities,
                synchronize: config.synchronize,
                logging: config.logging,
                migrations: config.migrations,
                migrationsRun: config.migrationsRun,
            });
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

	getRepository<Entity extends ObjectLiteral>(
		entity: EntityTarget<Entity>,
	): Repository<Entity> {
		if (!this.dataSource) {
			throw new Error("Database not connected");
		}
		return this.dataSource.getRepository(entity);
	}

	async transaction<T>(
		operation: (entityManager: any) => Promise<T>,
	): Promise<T> {
		if (!this.dataSource) {
			throw new Error("Database not connected");
		}
		return this.dataSource.transaction(operation);
	}

	getDataSource(): DataSource {
		if (!this.dataSource) {
			throw new Error("Database not connected");
		}
		return this.dataSource;
	}
}
