import { Controller, Get, Delete, Logger } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { CacheService } from "../services/cache.service";
import { GraphIndexService } from "../services/graph-index.service";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Мониторинг кэша")
@Controller("cache-monitor")
export class CacheMonitorController {
	private readonly logger = new Logger(CacheMonitorController.name);

	constructor(
		private readonly cacheService: CacheService,
		private readonly graphIndexService: GraphIndexService,
	) {}

	@Get("metrics")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Получить метрики кэширования",
		description: "Возвращает статистику операций с кэшем",
	})
	@ApiResponse({
		status: 200,
		description: "Метрики кэширования успешно получены",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				metrics: {
					type: "object",
					properties: {
						hits: { type: "number" },
						misses: { type: "number" },
						hitRatio: { type: "number" },
						sets: { type: "number" },
						deletes: { type: "number" },
						errors: { type: "number" },
						totalOperations: { type: "number" },
					},
				},
				timestamp: { type: "string", format: "date-time" },
			},
		},
	})
	async getCacheMetrics() {
		this.logger.debug("Запрос метрик кэширования");

		const metrics = this.cacheService.getMetrics();

		this.logger.log("Метрики кэширования предоставлены", {
			hitRatio: metrics.hitRatio,
			totalOperations: metrics.totalOperations,
		});

		return {
			success: true,
			metrics,
			timestamp: new Date().toISOString(),
		};
	}

	@Delete("reset-metrics")
	@RealmRole(Permission.DL_UPDATE_JSON_DATA)
	@ApiOperation({
		summary: "Сбросить метрики кэширования",
		description: "Сбрасывает счетчики метрик кэширования",
	})
	@ApiResponse({
		status: 200,
		description: "Метрики кэширования успешно сброшены",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
				timestamp: { type: "string", format: "date-time" },
			},
		},
	})
	async resetCacheMetrics() {
		this.logger.debug("Сброс метрик кэширования");

		this.cacheService.resetMetrics();

		this.logger.log("Метрики кэширования сброшены");

		return {
			success: true,
			message: "Метрики кэширования сброшены",
			timestamp: new Date().toISOString(),
		};
	}

	@Delete("clear-all")
	@RealmRole(Permission.DL_UPDATE_JSON_DATA)
	@ApiOperation({
		summary: "Очистить все кэши",
		description: "Принудительно очищает все кэшированные данные",
	})
	@ApiResponse({
		status: 200,
		description: "Все кэши успешно очищены",
		schema: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
				timestamp: { type: "string", format: "date-time" },
			},
		},
	})
	async clearAllCaches() {
		this.logger.debug("Запрос на принудительную очистку всех кэшей");

		await this.cacheService.invalidateAllCaches();
		this.graphIndexService.invalidate();

		this.logger.log("Все кэши принудительно очищены");

		return {
			success: true,
			message: "Все кэши успешно очищены",
			timestamp: new Date().toISOString(),
		};
	}
}
