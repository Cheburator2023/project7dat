import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import appConfig, { appValidationSchema } from "./app.config";
import databaseConfig, { databaseValidationSchema } from "./database.config";
import Joi from "joi";

@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
			load: [appConfig, databaseConfig],
			validationSchema: appValidationSchema.concat(
				Joi.object(databaseValidationSchema),
			),
			validationOptions: {
				allowUnknown: true,
				abortEarly: false,
			},
		}),
	],
	exports: [NestConfigModule],
})
export class ConfigModule {
	static forRoot() {
		return {
			module: ConfigModule,
			global: true,
		};
	}
}
