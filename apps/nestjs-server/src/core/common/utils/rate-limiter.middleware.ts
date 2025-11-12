import { Injectable, NestMiddleware } from "@nestjs/common";
import rateLimit from "express-rate-limit";

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
	private limiter = rateLimit({
		windowMs: 60 * 1000,
		max: 100,
		message: "Too Many Requests",
	});

	use(...args: Parameters<ReturnType<typeof rateLimit>>) {
		this.limiter(...args);
	}
}
