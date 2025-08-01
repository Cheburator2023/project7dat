import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("Основное")
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiOperation({ summary: "Приветствие" })
	@ApiResponse({ status: 200, description: "Приветственное сообщение" })
	getHello(): string {
		return this.appService.getHello();
	}

	@Get("health")
	@ApiOperation({ summary: "Проверка состояния сервера" })
	@ApiResponse({ status: 200, description: "Сервер работает" })
	getHealth() {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			service: "Data Lineage API",
		};
	}
}
