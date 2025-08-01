import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', () => {
	const isProduction = process.env.NODE_ENV === 'production';

	const commonOptions: Partial<TypeOrmModuleOptions> = {
		entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
		synchronize: process.env.DB_SYNCHRONIZE === 'true' || !isProduction,
		logging: process.env.DB_LOGGING === 'true' || !isProduction,
	};

	if (isProduction) {
		return {
			type: 'postgres',
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'postgres',
			password: process.env.DB_PASSWORD || 'password',
			database: process.env.DB_NAME || 'data_lineage',
			migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
			migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
			...commonOptions,
		};
	}

	const devDbType = process.env.DEV_DB_TYPE || 'sqlite';

	if (devDbType === 'postgres') {
		return {
			type: 'postgres',
			host: process.env.DEV_DB_HOST || 'localhost',
			port: parseInt(process.env.DEV_DB_PORT || '5432', 10),
			username: process.env.DEV_DB_USERNAME || 'postgres',
			password: process.env.DEV_DB_PASSWORD || 'postgres',
			database: process.env.DEV_DB_NAME || 'data_lineage_dev',
			...commonOptions,
		};
	}

	return {
		type: 'sqlite',
		database: process.env.DEV_DB_NAME || './dev-database.sqlite',
		...commonOptions,
	};
});