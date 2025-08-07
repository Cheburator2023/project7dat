import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from "@nestjs/common";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(_context: ExecutionContext, next: CallHandler) {
		console.log("Before...");
		const now = Date.now();

		const result = next.handle();

		// Simple logging without subscribing to avoid duplication
		setTimeout(() => {
			console.log(`After... ${Date.now() - now}ms`);
		}, 0);

		return result;
	}
}
