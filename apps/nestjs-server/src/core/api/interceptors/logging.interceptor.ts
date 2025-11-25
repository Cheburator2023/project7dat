import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Logger,
} from "@nestjs/common";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): ReturnType<CallHandler["handle"]> {
		const request = context.switchToHttp().getRequest();
		const method = request.method;
		const url = request.url;
		const now = Date.now();

		this.logger.log(`Before ${method} ${url}`);

		return (next.handle() as any).pipe(
			tap({
				next: () => {
					const time = Date.now() - now;
					this.logger.log(`After ${method} ${url} - ${time}ms`);
				},
				error: (error) => {
					const time = Date.now() - now;
					this.logger.error(
						`Error in ${method} ${url} - ${time}ms: ${error.message}`,
					);
				},
			}),
		) as ReturnType<CallHandler["handle"]>;
	}
}
