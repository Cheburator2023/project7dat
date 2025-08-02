import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JsonDataModule } from 'src/modules/json-data/json-data.module';
import { SharedModule } from 'src/core/shared/shared.module';

@Module({})
export class AppModule {
	static forRoot(): DynamicModule {
		const configService = new ConfigService();
		const isProduction = configService.get('NODE_ENV') === 'production';

		const imports = [
			SharedModule.forRoot(),
			JsonDataModule.forRoot(),
			ConfigModule.forRoot(),
		];

		if (isProduction) {
			imports.push(
				TypeOrmModule.forRootAsync({
					imports: [SharedModule],
					useFactory: async () => ({
						type: 'postgres',
						host: configService.get('DB_HOST'),
						port: configService.get('DB_PORT'),
						username: configService.get('DB_USERNAME'),
						password: configService.get('DB_PASSWORD'),
						database: configService.get('DB_NAME'),
						entities: [__dirname + '/../**/*.entity{.ts,.js}'],
						synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
						logging: configService.get('DB_LOGGING') === 'true',
					}),
				})
			);
		}

		return {
			module: AppModule,
			imports,
			controllers: [AppController],
			providers: [AppService],
		};
	}
}