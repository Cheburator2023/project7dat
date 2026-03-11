import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export interface PostgresDatabaseConfig {
	type: "postgres";
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
	entities: string[];
	synchronize: boolean;
	logging: boolean;
	migrations: string[];
	migrationsRun: boolean;
	poolSize?: number;
	extra?: Record<string, unknown>;
}

export const databaseValidationSchema = Joi.object({
	DB_HOST: Joi.string().default("localhost"),
	DB_PORT: Joi.number().default(5432),
	DB_USERNAME: Joi.string().default("postgres"),
	DB_PASSWORD: Joi.string().default("postgres"),
	DB_NAME: Joi.string().default("data_lineage"),
	DB_SYNCHRONIZE: Joi.boolean().default(true),
	DB_LOGGING: Joi.boolean().default(true),
	DB_MIGRATIONS_RUN: Joi.boolean().default(true),
	DEV_DB_TYPE: Joi.string()
		.valid("postgres", "sqlite", "memory")
		.default("postgres"),
	DEV_DB_HOST: Joi.string().default("localhost"),
	DEV_DB_PORT: Joi.number().default(5432),
	DEV_DB_NAME: Joi.string().default("data_lineage"),
	DEV_DB_USERNAME: Joi.string().default("postgres"),
	DEV_DB_PASSWORD: Joi.string().default("postgres"),
});

export const databaseConfig = registerAs(
	"database",
	(): PostgresDatabaseConfig => {
		const nodeEnv = process.env.NODE_ENV || "development";
		const isProduction = nodeEnv === "production";

		console.log("Database configuration loaded:", {
			nodeEnv,
			isProduction,
			dbHost: isProduction ? process.env.DB_HOST : process.env.DEV_DB_HOST,
			dbPort: isProduction ? process.env.DB_PORT : process.env.DEV_DB_PORT,
			dbName: isProduction ? process.env.DB_NAME : process.env.DEV_DB_NAME,
		});

		// Базовые параметры
		const baseConfig = {
			type: "postgres" as const,
			host: isProduction
				? process.env.DB_HOST || "localhost"
				: process.env.DEV_DB_HOST || "localhost",
			port: isProduction
				? Number.parseInt(process.env.DB_PORT || "5432", 10)
				: Number.parseInt(process.env.DEV_DB_PORT || "5432", 10),
			username: isProduction
				? process.env.DB_USERNAME || "postgres"
				: process.env.DEV_DB_USERNAME || "postgres",
			password: isProduction
				? process.env.DB_PASSWORD || "postgres"
				: process.env.DEV_DB_PASSWORD || "postgres",
			database: isProduction
				? process.env.DB_NAME || "data_lineage"
				: process.env.DEV_DB_NAME || "data_lineage",
		};

		const poolSize = Number.parseInt(
			process.env.DB_POOL_SIZE || (isProduction ? "20" : "20"),
			10,
		);

		// Полная конфигурация
		const fullConfig: PostgresDatabaseConfig = {
			...baseConfig,
			entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
			synchronize: false,
			logging: process.env.DB_LOGGING === "true" || !isProduction,
			migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
			migrationsRun: process.env.DB_MIGRATIONS_RUN === "true",
			poolSize,
			extra: {
				max: poolSize,
				connectionTimeoutMillis: 30000,
				idleTimeoutMillis: 30000,
				statement_timeout: 120000,
			},
		};

		return fullConfig;
	},
);
