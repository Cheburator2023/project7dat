import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
	FastifyAdapter,
	NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app/app.module";
import { HttpExceptionFilter } from "./core/api/filters/http-exception.filter";
import fastifyMultipart from "@fastify/multipart";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule.forRoot(),
		new FastifyAdapter({
			bodyLimit: 104857600, // 100MB
			logger: true,
		}),
	);

	// Регистрация плагина multipart для S2T
	await app.register(fastifyMultipart, {
		limits: {
			fileSize: 5 * 1024 * 1024, // 5 МБ
		},
		attachFieldsToBody: true,
	});

	app.enableCors({
		origin: "*",
		credentials: true,
		methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			transformOptions: {
				enableImplicitConversion: true,
				enableCircularCheck: true,
			},
			disableErrorMessages: false,
			validationError: {
				target: false,
				value: false,
			},
		}),
	);

	app.useGlobalFilters(new HttpExceptionFilter());

	app.setGlobalPrefix("api");
	console.log("Global prefix set to: api");

	const config = new DocumentBuilder()
		.setTitle("Data Lineage API")
		.setDescription("API для управления графами линейности данных")
		.setVersion("1.0")
		.addTag("Основное", "Основные эндпоинты приложения")
		.addTag("JSON Данные", "CRUD операции для JSON документов")
		.addTag("JSON Коммиты", "Управление версиями JSON документов")
		.addTag("Импорт JSON", "Импорт JSON данных в БД DL")
		.addTag("Экспорт JSON", "Экспорт данных РБД в JSON")
		.addTag("Импорт S2T", "Импорт данных из S2T (.xlsx)")
		.addTag("Экспорт S2T", "Экспорт отчётов в формате S2T (.xlsx)")
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

	const document = SwaggerModule.createDocument(app, config);

	console.log("Swagger will be available at: /api/docs");

	SwaggerModule.setup("docs", app, document, {
		useGlobalPrefix: true, // Критически важно для Fastify!
	});

	const port = process.env.PORT || 3000;
	await app.listen({ port: Number(port), host: "0.0.0.0" });
	const appUrl = await app.getUrl();
	console.log("✅ Проверьте доступность:");
	console.log(`   - API: ${appUrl}/api/json-data/list`);
	console.log(`   - Swagger: ${appUrl}/api/docs`);
	console.log(`   - Health: ${appUrl}/api/health`);
	console.log(`🚀 Сервер запущен на http://localhost:${port}`);
	console.log("📚 API эндпоинты доступны по адресу /api/json-data");
	console.log(
		`📖 API документация доступна по адресу http://localhost:${port}/api/docs`,
	);
}
bootstrap();
