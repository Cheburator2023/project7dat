import { Controller, Get } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { AppService } from "./app.service";
import { CurrentUser } from "../core/auth/decorators/current-user.decorator";
import { JwtPayload } from "../core/auth/interfaces/jwt-payload.interface";

@ApiBearerAuth("JWT-auth")
@ApiTags("Основное")
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiOperation({ summary: "Приветствие" })
	@ApiResponse({ status: 200, description: "Приветственное сообщение" })
	getHello(@CurrentUser() user: JwtPayload): string {
		console.log("Authenticated user:", user.username);
		return this.appService.getHello();
	}

	@Get("health")
	@ApiOperation({ summary: "Проверка состояния сервера" })
	@ApiResponse({ status: 200, description: "Сервер работает" })
	getHealth(@CurrentUser() user: JwtPayload) {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			service: "Data Lineage API",
			user: user
				? {
						id: user.sub,
						username: user.username,
					}
				: null,
		};
	}
}
