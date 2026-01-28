export enum CacheOperationType {
    GET = 'GET',
    SET = 'SET',
    DELETE = 'DELETE',
    DELETE_ALL = 'DELETE_ALL',
}

export interface CacheOperationResult {
    success: boolean;
    duration: number;
    data?: any;
    error?: string;
    timestamp: Date;
}

export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    totalOperations: number;
    hitRatio: number;
}

export interface CacheLogEntry {
    operation: CacheOperationType;
    key: string;
    result: CacheOperationResult;
    metadata?: Record<string, any>;
}

export interface ICacheService {
    getCachedExportAll(): Promise<any>;
    setCachedExportAll(data: any): Promise<void>;
    getCachedExportByChangeId(changeId: number): Promise<any>;
    setCachedExportByChangeId(changeId: number, data: any): Promise<void>;
    invalidateAllCaches(): Promise<void>;
    invalidateCachesByChangeId(changeId: number): Promise<void>;
    invalidateExportAllCache(): Promise<void>;
    getMetrics(): CacheMetrics;
    resetMetrics(): void;
}