import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
    private limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        message: 'Too Many Requests'
    });

    use(req: Request, res: Response, next: NextFunction) {
        this.limiter(req, res, next);
    }
}