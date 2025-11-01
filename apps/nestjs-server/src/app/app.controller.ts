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
import { RealmRole } from "../core/auth/decorators/realm-role.decorator";
import { Permission } from "../core/auth/permissions";

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

	@Get("god-mode-test")
	@ApiOperation({ summary: "Тест режима бога" })
	@ApiResponse({
		status: 200,
		description: "Информация о пользователе в режиме бога",
	})
	getGodModeTest(@CurrentUser() user: JwtPayload) {
		return {
			message: "God mode test endpoint",
			timestamp: new Date().toISOString(),
			godMode: process.env.NO_ROLES === "true",
			user: user
				? {
						id: user.sub,
						username: user.username,
						email: user.email,
						roles: user.roles,
					}
				: null,
		};
	}

	@Get("god-mode-protected")
	@RealmRole(Permission.DL_CREATE_JSON_DATA)
	@ApiOperation({ summary: "Защищенный эндпоинт для теста режима бога" })
	@ApiResponse({ status: 200, description: "Доступ разрешен в режиме бога" })
	@ApiResponse({
		status: 403,
		description: "Доступ запрещен без соответствующих ролей",
	})
	getGodModeProtected(@CurrentUser() user: JwtPayload) {
		return {
			message: "Access granted! God mode bypassed role protection",
			timestamp: new Date().toISOString(),
			requiredPermission: Permission.DL_CREATE_JSON_DATA,
			user: user
				? {
						id: user.sub,
						username: user.username,
						email: user.email,
						roles: user.roles,
					}
				: null,
		};
	}
}
