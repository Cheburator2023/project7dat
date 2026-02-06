import { Controller, Get } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { ProcessesService } from "../services/processes.service";

@ApiBearerAuth("JWT-auth")
@ApiTags("Процессы")
@Controller("processes")
export class ProcessesController {
	constructor(private readonly processesService: ProcessesService) {}

	@Get()
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить список процессов",
		description: "Возвращает уникальный список наименований процессов",
	})
	@ApiResponse({ status: 200 })
	async listProcessNames() {
		return await this.processesService.listProcessNames();
	}

	@Get("with-descriptions")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить список процессов с описаниями",
		description:
			"Возвращает уникальный список наименований процессов с описаниями",
	})
	@ApiResponse({ status: 200 })
	async listProcessesWithDescription() {
		return await this.processesService.listProcessesWithDescription();
	}
}
