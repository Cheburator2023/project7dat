import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getDataSourceOptions } from "./shared/database/database.config";
import { JsonDataModule } from "./modules/json-data.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

const isDevelopment = process.env.NODE_ENV !== "production";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		...(isDevelopment
			? []
			: [
					TypeOrmModule.forRootAsync({
						imports: [ConfigModule],
						useFactory: (configService: ConfigService) =>
							getDataSourceOptions(configService),
						inject: [ConfigService],
					}),
				]),
		JsonDataModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
