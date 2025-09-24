import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
	FastifyAdapter,
	NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app/app.module";
import { HttpExceptionFilter } from "./core/api/filters/http-exception.filter";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule.forRoot(),
		new FastifyAdapter({
			bodyLimit: 52428800, // 50MB
			logger: true,
			ignoreTrailingSlash: true,
		}),
	);

	app.enableCors({
		origin: "*",
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
			disableErrorMessages: false,
			validationError: {
				target: false,
				value: false,
			},
		}),
	);

	app.useGlobalFilters(new HttpExceptionFilter());

	const config = new DocumentBuilder()
		.setTitle("Data Lineage API")
		.setDescription("API для управления графами линейности данных")
		.setVersion("1.0")
		.addTag("Основное", "Основные эндпоинты приложения")
		.addTag("JSON Данные", "CRUD операции для JSON документов")
		.addTag("JSON Коммиты", "Управление версиями JSON документов")
		.addBearerAuth(
			{
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				name: "JWT",
				description: "Enter JWT token",
				in: "header",
			},
			"JWT-auth",
		)
		.build();

	const document = SwaggerModule.createDocument(app as any, config);
	SwaggerModule.setup("api/docs", app as any, document);

	const port = process.env.PORT || 3000;
	await app.listen({ port: Number(port), host: "0.0.0.0" });
	console.log(`🚀 Сервер запущен на http://localhost:${port}`);
	console.log("📚 API эндпоинты доступны по адресу /api/json-data");
	console.log(
		`📖 API документация доступна по адресу http://localhost:${port}/api/docs`,
	);
}
bootstrap();
