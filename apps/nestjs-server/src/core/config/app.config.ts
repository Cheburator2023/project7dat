import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("app", () => {
	const nodeEnv = process.env.NODE_ENV || "development";
	const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

	return {
		nodeEnv,
		isProduction: nodeEnv === "production",
		name: process.env.APP_NAME || "DataLineage",
		port: Number.isNaN(port) ? 3000 : port,
		apiPrefix: process.env.API_PREFIX || "api",
		fallbackLanguage: process.env.FALLBACK_LANGUAGE || "en",
	};
});

export const appValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid("development", "production", "test")
		.default("development"),
	PORT: Joi.number().default(3000),
	APP_NAME: Joi.string().default("DataLineage"),
	API_PREFIX: Joi.string().default("api"),
	FALLBACK_LANGUAGE: Joi.string().default("en"),
});
