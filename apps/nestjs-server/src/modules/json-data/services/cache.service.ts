import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CacheOperationType, CacheMetrics } from "./interfaces/cache.interface";

@Injectable()
export class CacheService {
	private readonly logger = new Logger(CacheService.name);
	private readonly metrics: CacheMetrics = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		errors: 0,
		totalOperations: 0,
		hitRatio: 0,
	};

	private readonly changeIdsKey = "export_change_ids";
	private readonly allCacheKey = "export_all";
	private readonly changeCachePrefix = "export_change_";

	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
		// Периодический вывод метрик (каждые 5 минут)
		setInterval(() => this.logMetrics(), 5 * 60 * 1000);
	}

	/**
	 * Получение кэшированных данных общего экспорта
	 */
	async getCachedExportAll(): Promise<any> {
		return this.executeCacheOperation(
			CacheOperationType.GET,
			this.allCacheKey,
			() => this.cacheManager.get(this.allCacheKey),
		);
	}

	/**
	 * Сохрание данных общего экспорта в кэш
	 */
	async setCachedExportAll(data: any, ttl?: number): Promise<void> {
		await this.executeCacheOperation(
			CacheOperationType.SET,
			this.allCacheKey,
			() =>
				this.cacheManager.set(
					this.allCacheKey,
					data,
					ttl || this.getDefaultTtl(),
				),
		);
	}

	/**
	 * Получение кэшированных данных экспорта по change_id
	 */
	async getCachedExportByChangeId(changeId: number): Promise<any> {
		const cacheKey = `${this.changeCachePrefix}${changeId}`;
		return this.executeCacheOperation(CacheOperationType.GET, cacheKey, () =>
			this.cacheManager.get(cacheKey),
		);
	}

	/**
	 * Сохрание данных экспорта по change_id в кэш
	 */
	async setCachedExportByChangeId(
		changeId: number,
		data: any,
		ttl?: number,
	): Promise<void> {
		const cacheKey = `${this.changeCachePrefix}${changeId}`;

		await this.executeCacheOperation(
			CacheOperationType.SET,
			cacheKey,
			async () => {
				await this.cacheManager.set(cacheKey, data);
				await this.addChangeIdToTracking(changeId);
			},
		);
	}

	/**
	 * Очистить все кэши экспорта
	 */
	async invalidateAllCaches(): Promise<void> {
		await this.executeCacheOperation(
			CacheOperationType.DELETE_ALL,
			"all_caches",
			async () => {
				// Удаляем общий кэш
				await this.cacheManager.del(this.allCacheKey);

				// Получаем все отслеживаемые change_id
				const changeIds = await this.getTrackedChangeIds();

				// Удаляем кэши по каждому change_id
				const deletePromises = changeIds.map((changeId) =>
					this.cacheManager.del(`${this.changeCachePrefix}${changeId}`),
				);

				await Promise.all(deletePromises);

				// Очищаем список отслеживания
				await this.cacheManager.del(this.changeIdsKey);

				this.logger.log(`Очищено ${changeIds.length + 1} кэшей`, {
					changeIdsCount: changeIds.length,
					operation: "invalidate_all_caches",
				});
			},
		);
	}

	/**
	 * Очистить кэши по конкретному change_id
	 */
	async invalidateCachesByChangeId(changeId: number): Promise<void> {
		const cacheKey = `${this.changeCachePrefix}${changeId}`;

		await this.executeCacheOperation(
			CacheOperationType.DELETE,
			cacheKey,
			async () => {
				await this.cacheManager.del(cacheKey);
				await this.removeChangeIdFromTracking(changeId);

				this.logger.log(`Кэш очищен для change_id: ${changeId}`, {
					changeId,
					cacheKey,
					operation: "invalidate_by_change_id",
				});
			},
		);
	}

	/**
	 * Очистить только общий кэш (для операций обновления данных)
	 */
	async invalidateExportAllCache(): Promise<void> {
		await this.executeCacheOperation(
			CacheOperationType.DELETE,
			this.allCacheKey,
			async () => {
				await this.cacheManager.del(this.allCacheKey);

				this.logger.log("Общий кэш экспорта очищен", {
					cacheKey: this.allCacheKey,
					operation: "invalidate_export_all",
				});
			},
		);
	}

	/**
	 * Получение метрик кэширования
	 */
	getMetrics(): CacheMetrics {
		const totalOperations = this.metrics.hits + this.metrics.misses;
		this.metrics.hitRatio =
			totalOperations > 0 ? (this.metrics.hits / totalOperations) * 100 : 0;
		this.metrics.totalOperations = totalOperations;

		return { ...this.metrics };
	}

	/**
	 * Сбросить метрики кэширования
	 */
	resetMetrics(): void {
		this.metrics.hits = 0;
		this.metrics.misses = 0;
		this.metrics.sets = 0;
		this.metrics.deletes = 0;
		this.metrics.errors = 0;
		this.metrics.totalOperations = 0;
		this.metrics.hitRatio = 0;

		this.logger.log("Метрики кэширования сброшены");
	}

	/**
	 * Добавление change_id в список отслеживания
	 */
	private async addChangeIdToTracking(changeId: number): Promise<void> {
		const changeIds = await this.getTrackedChangeIds();

		if (!changeIds.includes(changeId)) {
			changeIds.push(changeId);
			await this.cacheManager.set(this.changeIdsKey, changeIds);

			this.logger.debug(`Change ID ${changeId} добавлен в отслеживание`, {
				changeId,
				totalTrackedIds: changeIds.length,
				operation: "add_tracking",
			});
		}
	}

	/**
	 * Удаление change_id из списка отслеживания
	 */
	private async removeChangeIdFromTracking(changeId: number): Promise<void> {
		let changeIds = await this.getTrackedChangeIds();
		const initialCount = changeIds.length;
		changeIds = changeIds.filter((id) => id !== changeId);

		if (initialCount !== changeIds.length) {
			await this.cacheManager.set(this.changeIdsKey, changeIds);

			this.logger.debug(`Change ID ${changeId} удален из отслеживания`, {
				changeId,
				totalTrackedIds: changeIds.length,
				operation: "remove_tracking",
			});
		}
	}

	/**
	 * Получение списока отслеживаемых change_id
	 */
	private async getTrackedChangeIds(): Promise<number[]> {
		const changeIds = await this.cacheManager.get<number[]>(this.changeIdsKey);
		return changeIds || [];
	}

	/**
	 * Выполнение операции с кэшем с логированием и учетом метрик
	 */
	private async executeCacheOperation<T>(
		type: CacheOperationType,
		key: string,
		operation: () => Promise<T>,
	): Promise<T> {
		const startTime = Date.now();

		try {
			this.logger.debug(`Начало операции кэша: ${type} для ключа: ${key}`, {
				cacheOperation: type,
				cacheKey: key,
				timestamp: new Date().toISOString(),
			});

			const result = await operation();

			const duration = Date.now() - startTime;
			this.updateMetrics(type, true);

			this.logCacheResult(type, key, duration, true, result !== undefined);

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.updateMetrics(type, false, true);

			this.logger.error(`Ошибка операции кэша: ${type} для ключа: ${key}`, {
				error: error.message,
				stack: error.stack,
				cacheOperation: type,
				cacheKey: key,
				duration,
				timestamp: new Date().toISOString(),
			});

			throw error;
		}
	}

	/**
	 * Обновление метрик на основе результата операции
	 */
	private updateMetrics(
		type: CacheOperationType,
		isSuccess: boolean,
		isError = false,
	): void {
		if (isError) {
			this.metrics.errors++;
		} else if (isSuccess) {
			switch (type) {
				case CacheOperationType.GET:
					// Для GET операций различаем hit/miss в методе logCacheResult
					break;
				case CacheOperationType.SET:
					this.metrics.sets++;
					break;
				case CacheOperationType.DELETE:
				case CacheOperationType.DELETE_ALL:
					this.metrics.deletes++;
					break;
			}
		}
	}

	/**
	 * Логирование результата операции с кэшем
	 */
	private logCacheResult(
		type: CacheOperationType,
		key: string,
		duration: number,
		isSuccess: boolean,
		hasData?: boolean,
	): void {
		const logData = {
			cacheOperation: type,
			cacheKey: key,
			duration,
			success: isSuccess,
			hasData,
			timestamp: new Date().toISOString(),
		};

		switch (type) {
			case CacheOperationType.GET:
				if (isSuccess) {
					if (hasData) {
						this.metrics.hits++;
						this.logger.debug(`Кэш-попадание для ключа: ${key}`, {
							...logData,
							result: "HIT",
						});
					} else {
						this.metrics.misses++;
						this.logger.debug(`Кэш-промах для ключа: ${key}`, {
							...logData,
							result: "MISS",
						});
					}
				}
				break;

			case CacheOperationType.SET:
				if (isSuccess) {
					this.logger.debug(`Данные сохранены в кэш: ${key}`, logData);
				}
				break;

			case CacheOperationType.DELETE:
				if (isSuccess) {
					this.logger.debug(`Данные удалены из кэша: ${key}`, logData);
				}
				break;

			case CacheOperationType.DELETE_ALL:
				if (isSuccess) {
					this.logger.debug(`Все кэши очищены`, logData);
				}
				break;
		}
	}

	/**
	 * Логирование метрик кэширования
	 */
	private logMetrics(): void {
		const metrics = this.getMetrics();

		this.logger.log("Метрики кэширования", {
			metrics: {
				hits: metrics.hits,
				misses: metrics.misses,
				hitRatio: metrics.hitRatio.toFixed(2),
				sets: metrics.sets,
				deletes: metrics.deletes,
				errors: metrics.errors,
				totalOperations: metrics.totalOperations,
			},
			timestamp: new Date().toISOString(),
		});
	}

	private getDefaultTtl(): number {
		return 10 * 60 * 1000; // 10 минут в миллисекундах
	}
}
