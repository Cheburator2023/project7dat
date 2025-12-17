import { EntityTarget, Repository, ObjectLiteral, DataSource } from "typeorm";
import { PostgresDatabaseConfig } from "../../../config/database.config";

export interface IDatabaseProvider {
	getConfig(): PostgresDatabaseConfig;
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getRepository<Entity extends ObjectLiteral>(
		entity: EntityTarget<Entity>,
	): Repository<Entity>;
	transaction<T>(operation: (entityManager: any) => Promise<T>): Promise<T>;
	getDataSource(): DataSource;
}
