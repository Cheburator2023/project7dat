import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const getDataSourceOptions = (
	configService: ConfigService,
): TypeOrmModuleOptions => {
	const isProduction = configService.get("NODE_ENV") === "production";

	if (isProduction) {
		return {
			type: "postgres",
			host: configService.get("DB_HOST", "localhost"),
			port: configService.get("DB_PORT", 5432),
			username: configService.get("DB_USERNAME", "postgres"),
			password: configService.get("DB_PASSWORD", "password"),
			database: configService.get("DB_NAME", "data_lineage"),
			entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
			migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
			synchronize: false,
			logging: false,
		};
	}

	return {
		type: "sqlite",
		database: "./dev-database.sqlite",
		entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
		synchronize: true,
		logging: true,
	};
};
