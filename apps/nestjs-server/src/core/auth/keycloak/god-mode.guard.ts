import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestWithUser } from "../interfaces/request-with-user.interface";
import { ConfigService } from "@nestjs/config";
import { Permission } from "../permissions";

/**
 * Guard для режима бога (god mode)
 *
 * @description
 * Позволяет отключать проверку прав в development режиме (NO_ROLES=true)
 * В production режиме делегирует проверку указанному guard'у
 */

@Injectable()
export class GodModeGuard implements CanActivate {
	constructor(
		readonly _reflector: Reflector,
		private readonly configService: ConfigService,
		private readonly delegateGuard?: CanActivate,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<RequestWithUser>();
		const isGodMode = this.configService.get<boolean>("app.godMode");

		if (isGodMode) {
			// Create god user with all permissions
			const allPermissions = Object.values(Permission);

			request.user = {
				sub: "god-user-00000000-0000-0000-0000-000000000000",
				username: "god",
				email: "god@datalineage.local",
				roles: [
					"admin",
					"god",
					"superuser",
					...allPermissions, // Add all permissions as roles
				],
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
			};

			console.warn(
				"🔥 GOD MODE ACTIVE - All authentication and authorization bypassed",
			);
			console.warn(
				`🔥 God user: ${request.user.username} (${request.user.email})`,
			);
			console.warn(`🔥 Permissions: ${allPermissions.join(", ")}`);

			return true;
		}

		// Normal mode - delegate to the original guard
		if (
			this.delegateGuard &&
			typeof this.delegateGuard.canActivate === "function"
		) {
			return this.delegateGuard.canActivate(context) as any;
		}

		return true;
	}
}
