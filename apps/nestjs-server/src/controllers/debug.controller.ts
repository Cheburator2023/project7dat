import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DebugService } from "src/services/debug.service";

@ApiTags("Отладка")
@Controller("api/debug")
export class DebugController {
	constructor(private readonly debugService: DebugService) {}

	@Get("all")
	@ApiOperation({ summary: "Получить все данные из базы для отладки" })
	@ApiResponse({ status: 200, description: "Все данные из базы" })
	async getAllData() {
		return this.debugService.getAllData();
	}

	@Get("stats")
	@ApiOperation({ summary: "Получить статистику базы данных" })
	@ApiResponse({ status: 200, description: "Статистика базы данных" })
	async getDatabaseStats() {
		return this.debugService.getDatabaseStats();
	}
}
