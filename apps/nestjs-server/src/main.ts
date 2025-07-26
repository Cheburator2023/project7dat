import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

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

	const config = new DocumentBuilder()
		.setTitle("Data Lineage API")
		.setDescription("API для управления графами линейности данных")
		.setVersion("1.0")
		.addTag("Основное", "Основные эндпоинты приложения")
		.addTag("JSON Данные", "CRUD операции для JSON документов")
		.build();

	const document = SwaggerModule.createDocument(app as any, config);
	SwaggerModule.setup("api/docs", app as any, document);

	const port = process.env.PORT || 3000;
	await app.listen(port);
	console.log(`🚀 Сервер запущен на http://localhost:${port}`);
	console.log("📚 API эндпоинты доступны по адресу /api/json-data");
	console.log(
		`📖 API документация доступна по адресу http://localhost:${port}/api/docs`,
	);
}
bootstrap();
