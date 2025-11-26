import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { readFileSync } from "fs";
import { parse } from "dotenv";
import appConfig, { appValidationSchema } from "./app.config";
import { databaseValidationSchema, databaseConfig } from "./database.config";
import keycloakConfig, { keycloakValidationSchema } from "./keycloak.config";

function getEnvFilePaths(): string[] {
    let isProduction = false;

    try {
        const envFileContent = readFileSync(".env", "utf8");
        const envConfig = parse(envFileContent);
        isProduction = envConfig.NODE_ENV === "production";

        console.log('Main .env NODE_ENV:', envConfig.NODE_ENV);
    } catch (error) {
        isProduction = process.env.NODE_ENV === "production";
        console.log('No .env file, using process.env.NODE_ENV:', process.env.NODE_ENV);
    }

    const paths = isProduction ? [".env"] : [".env", ".env.development"];

    console.log('Loading env files:', paths);
    console.log('Final NODE_ENV:', process.env.NODE_ENV);

    return paths;
}

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
            envFilePath: getEnvFilePaths(),
			load: [appConfig, databaseConfig, keycloakConfig],
			validationSchema: appValidationSchema
				.concat(databaseValidationSchema)
				.concat(keycloakValidationSchema),
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
