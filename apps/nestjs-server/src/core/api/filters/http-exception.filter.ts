import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<FastifyReply>();
		const request = ctx.getRequest<FastifyRequest>();

		let status: number;
		let message: string | object;
		let errorCode: string;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === "string") {
				message = exceptionResponse;
				errorCode = this.getErrorCode(status);
			} else if (
				typeof exceptionResponse === "object" &&
				exceptionResponse !== null
			) {
				const responseObj = exceptionResponse as Record<string, any>;
				message = responseObj.message || exception.message;
				errorCode = responseObj.error || this.getErrorCode(status);

				// Копируем дополнительные поля, исключая message и error
				const additionalFields = { ...responseObj };
				if ("message" in additionalFields) {
					delete additionalFields.message;
				}
				if ("error" in additionalFields) {
					delete additionalFields.error;
				}

				// Если остались дополнительные поля, добавляем их в ответ
				if (Object.keys(additionalFields).length > 0) {
					Object.assign(this, additionalFields);
				}
			} else {
				message = exception.message;
				errorCode = this.getErrorCode(status);
			}
		} else if (exception instanceof Error) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			message = "Internal server error";
			errorCode = "INTERNAL_SERVER_ERROR";

			if (!this.isValidationOrBusinessError(exception)) {
				this.logger.error("Unhandled Exception caught:", {
					status,
					message: exception.message,
					stack: exception.stack,
					path: request.url,
					method: request.method,
				});
			}
		} else {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			message = "Internal server error";
			errorCode = "INTERNAL_SERVER_ERROR";
		}

		// Клиентские ошибки (4xx) логируем как warning
		if (status >= 400 && status < 500) {
			this.logger.warn("Client Exception caught:", {
				status,
				message,
				errorCode,
				path: request.url,
				method: request.method,
			});
		}

		try {
			const errorResponse: any = {
				statusCode: status,
				message,
				error: errorCode,
				timestamp: new Date().toISOString(),
				path: request.url,
				method: request.method,
			};

			// Если есть дополнительные поля от HttpException, добавляем их
			if (exception instanceof HttpException) {
				const exceptionResponse = exception.getResponse();
				if (
					typeof exceptionResponse === "object" &&
					exceptionResponse !== null
				) {
					const responseObj = exceptionResponse as Record<string, any>;
					const additionalFields = { ...responseObj };

					// Удаляем стандартные поля
					delete additionalFields.message;
					delete additionalFields.error;
					delete additionalFields.statusCode;

					// Добавляем оставшиеся поля
					Object.assign(errorResponse, additionalFields);
				}
			}

			response.status(status).send(errorResponse);
		} catch (sendError) {
			this.logger.error("Failed to send error response:", sendError);
			// Fallback response
			response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: "Internal server error",
				error: "INTERNAL_SERVER_ERROR",
				timestamp: new Date().toISOString(),
			});
		}
	}

	private getErrorCode(status: number): string {
		const errorCodes: { [key: number]: string } = {
			400: "BAD_REQUEST",
			401: "UNAUTHORIZED",
			403: "FORBIDDEN",
			404: "NOT_FOUND",
			409: "CONFLICT",
			413: "PAYLOAD_TOO_LARGE",
			422: "UNPROCESSABLE_ENTITY",
			429: "TOO_MANY_REQUESTS",
			500: "INTERNAL_SERVER_ERROR",
			501: "NOT_IMPLEMENTED",
			502: "BAD_GATEWAY",
			503: "SERVICE_UNAVAILABLE",
		};

		return errorCodes[status] || "INTERNAL_SERVER_ERROR";
	}

	private isValidationOrBusinessError(exception: Error): boolean {
		const validationErrors = [
			"ValidationError",
			"ValidatorException",
			"BadRequestException",
			"ConflictException",
		];

		return validationErrors.some(
			(errorName) =>
				exception.name.includes(errorName) ||
				exception.message.includes(errorName),
		);
	}
}
