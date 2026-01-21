import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly changeIdsKey = 'export_change_ids';
    private readonly allCacheKey = 'export_all';
    private readonly changeCachePrefix = 'export_change_';

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * Получить кэшированные данные общего экспорта
     */
    async getCachedExportAll(): Promise<any> {
        return this.cacheManager.get(this.allCacheKey);
    }

    /**
     * Сохранить данные общего экспорта в кэш
     */
    async setCachedExportAll(data: any, ttl?: number): Promise<void> {
        await this.cacheManager.set(this.allCacheKey, data, ttl || this.getDefaultTtl());
    }

    /**
     * Получить кэшированные данные экспорта по change_id
     */
    async getCachedExportByChangeId(changeId: number): Promise<any> {
        return this.cacheManager.get(`${this.changeCachePrefix}${changeId}`);
    }

    /**
     * Сохранить данные экспорта по change_id в кэш
     */
    async setCachedExportByChangeId(changeId: number, data: any, ttl?: number): Promise<void> {
        const cacheKey = `${this.changeCachePrefix}${changeId}`;

        // Сохраняем данные в кэш
        await this.cacheManager.set(cacheKey, data, ttl || this.getDefaultTtl());

        // Добавляем change_id в список отслеживаемых ключей
        await this.addChangeIdToTracking(changeId);
    }

    /**
     * Очистить все кэши экспорта
     */
    async invalidateAllCaches(): Promise<void> {
        this.logger.log('Очистка всех кэшей экспорта');

        // Удаляем общий кэш
        await this.cacheManager.del(this.allCacheKey);

        // Получаем все отслеживаемые change_id
        const changeIds = await this.getTrackedChangeIds();

        // Удаляем кэши по каждому change_id
        for (const changeId of changeIds) {
            await this.cacheManager.del(`${this.changeCachePrefix}${changeId}`);
        }

        // Очищаем список отслеживания
        await this.cacheManager.del(this.changeIdsKey);

        this.logger.log(`Очищено ${changeIds.length + 1} кэшей`);
    }

    /**
     * Очистить кэши по конкретному change_id
     */
    async invalidateCachesByChangeId(changeId: number): Promise<void> {
        this.logger.log(`Очистка кэшей для change_id: ${changeId}`);

        // Удаляем кэш для конкретного change_id
        await this.cacheManager.del(`${this.changeCachePrefix}${changeId}`);

        // Удаляем change_id из списка отслеживания
        await this.removeChangeIdFromTracking(changeId);
    }

    /**
     * Добавить change_id в список отслеживания
     */
    private async addChangeIdToTracking(changeId: number): Promise<void> {
        let changeIds = await this.getTrackedChangeIds();

        if (!changeIds.includes(changeId)) {
            changeIds.push(changeId);
            await this.cacheManager.set(this.changeIdsKey, changeIds);
        }
    }

    /**
     * Удалить change_id из списка отслеживания
     */
    private async removeChangeIdFromTracking(changeId: number): Promise<void> {
        let changeIds = await this.getTrackedChangeIds();
        changeIds = changeIds.filter(id => id !== changeId);
        await this.cacheManager.set(this.changeIdsKey, changeIds);
    }

    /**
     * Получить список отслеживаемых change_id
     */
    private async getTrackedChangeIds(): Promise<number[]> {
        const changeIds = await this.cacheManager.get<number[]>(this.changeIdsKey);
        return changeIds || [];
    }

    /**
     * Очистить только общий кэш (для операций обновления данных)
     */
    async invalidateExportAllCache(): Promise<void> {
        this.logger.log('Очистка общего кэша экспорта');
        await this.cacheManager.del(this.allCacheKey);
    }

    /**
     * Получить TTL по умолчанию в миллисекундах
     */
    private getDefaultTtl(): number {
        return 10 * 60 * 1000; // 10 минут в миллисекундах
    }
}