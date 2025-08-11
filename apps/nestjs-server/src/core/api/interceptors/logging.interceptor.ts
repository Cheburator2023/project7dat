import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from "@nestjs/common";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		console.log("Before...");
		const now = Date.now();

		const result = next.handle();

		if (result && typeof result.subscribe === "function") {
			result.subscribe({
				complete: () => console.log(`After... ${Date.now() - now}ms`),
			});
		}

		return result;
	}
}
