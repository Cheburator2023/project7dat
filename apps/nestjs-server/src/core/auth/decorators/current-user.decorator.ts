import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req as RequestWithUser ||
            context.switchToHttp().getRequest<RequestWithUser>();

        if (process.env.NO_ROLES === 'true') {
            return {
                sub: 'dev-user-id',
                username: 'developer',
                email: 'dev@example.com',
                roles: ['admin']
            } as JwtPayload;
        }

        if (!request.user) {
            throw new UnauthorizedException('User not authenticated');
        }

        return request.user;
    },
);