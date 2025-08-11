import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestWithUser } from "../interfaces/request-with-user.interface";

/**
 * Guard для режима "бога" (god mode)
 *
 * @description
 * Позволяет отключать проверку прав в development режиме (NO_ROLES=true)
 * В production режиме делегирует проверку указанному guard'у
 */
@Injectable()
export class GodModeGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		@Inject("DELEGATE_GUARD") private readonly delegateGuard: CanActivate,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<RequestWithUser>();

		if (process.env.NO_ROLES === "true") {
			request.user = {
				sub: "dev-user-id",
				username: "developer",
				email: "dev@example.com",
				roles: ["admin"],
			};
			console.warn("God mode is active - bypassing all guards");
			return true;
		}

		if (typeof this.delegateGuard.canActivate === "function") {
			return this.delegateGuard.canActivate(context) as any;
		}
		return true;
	}
}
