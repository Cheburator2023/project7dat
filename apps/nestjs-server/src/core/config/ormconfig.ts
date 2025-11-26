import { DataSource } from "typeorm";
import { databaseConfig } from "./database.config";

const config = databaseConfig();

export default new DataSource({
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
