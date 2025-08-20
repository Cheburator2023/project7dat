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
		const isGodMode = [true, 'true', 1, '1'].includes(
			process.env.NO_ROLES as any
		);

		if (isGodMode) {
			const request = context.switchToHttp().getRequest<RequestWithUser>();
			request.user = {
				sub: "dev-user-id",
				username: "developer",
				email: "dev@example.com",
				roles: ["admin"],
			};
			console.warn("God mode is active - bypassing all guards");
			return true;
		}

		return this.delegateGuard.canActivate(context) as Promise<boolean>;
	}
}
