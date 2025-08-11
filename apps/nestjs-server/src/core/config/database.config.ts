import { ConfigService, registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
import * as Joi from "joi";

export type DatabaseConfig = TypeOrmModuleOptions & DataSourceOptions;

export const databaseValidationSchema = Joi.object({
	DB_HOST: Joi.string().default("localhost"),
	DB_PORT: Joi.number().default(5432),
	DB_USERNAME: Joi.string().default("postgres"),
	DB_PASSWORD: Joi.string().default("password"),
	DB_NAME: Joi.string().default("data_lineage"),
	DB_SYNCHRONIZE: Joi.boolean().default(true),
	DB_LOGGING: Joi.boolean().default(true),
	DB_MIGRATIONS_RUN: Joi.boolean().default(true),
	DEV_DB_TYPE: Joi.string()
		.valid("postgres", "sqlite", "memory")
		.default("sqlite"),
	DEV_DB_HOST: Joi.string().when("DEV_DB_TYPE", {
		is: "postgres",
		then: Joi.required(),
		otherwise: Joi.optional(),
	}),
	DEV_DB_PORT: Joi.number().when("DEV_DB_TYPE", {
		is: "postgres",
		then: Joi.required(),
		otherwise: Joi.optional(),
	}),
	DEV_DB_NAME: Joi.string().default("data_lineage_dev"),
});

export default registerAs("database", (): DatabaseConfig => {
	const configService = new ConfigService();
	const isProduction = configService.get("app.isProduction");
	const devDbType = process.env.DEV_DB_TYPE || "sqlite";

	const commonOptions: Partial<DatabaseConfig> = {
		entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
		synchronize: process.env.DB_SYNCHRONIZE === "true" || !isProduction,
		logging: process.env.DB_LOGGING === "true" || !isProduction,
		migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
		migrationsRun: process.env.DB_MIGRATIONS_RUN === "true",
	};

	if (isProduction) {
		return {
			type: "postgres",
			host: process.env.DB_HOST || "localhost",
			port: Number.parseInt(process.env.DB_PORT || "5432", 10),
			username: process.env.DB_USERNAME || "postgres",
			password: process.env.DB_PASSWORD || "password",
			database: process.env.DB_NAME || "data_lineage",
			...commonOptions,
		} as DatabaseConfig;
	}

	if (devDbType === "postgres") {
		return {
			type: "postgres",
			host: process.env.DEV_DB_HOST || "localhost",
			port: Number.parseInt(process.env.DEV_DB_PORT || "5432", 10),
			username: process.env.DEV_DB_USERNAME || "postgres",
			password: process.env.DEV_DB_PASSWORD || "postgres",
			database: process.env.DEV_DB_NAME || "data_lineage_dev",
			...commonOptions,
		} as DatabaseConfig;
	}

	return {
		type: "sqlite",
		database: process.env.DEV_DB_NAME || "./dev-database.sqlite",
		...commonOptions,
	} as DatabaseConfig;
});
