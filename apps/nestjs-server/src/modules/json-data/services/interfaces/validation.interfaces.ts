import {
    ValidationResult,
    IntegrityResult,
    BusinessValidationResult,
    RecursionCheckResult,
    DuplicateCheckResult
} from "../../types";

export interface IJsonStructureValidator {
    validateStructure(data: any): ValidationResult;
    checkForRecursion(entities: any[], mappings: any[]): RecursionCheckResult;
    checkForDuplicates(data: any): DuplicateCheckResult;
    normalizeJsonData(data: any): any;
}

export interface IJsonBusinessRulesValidator {
    validateBusinessRules(data: any): BusinessValidationResult;
}

export interface IJsonIntegrityValidator {
    validateIntegrity(data: any): IntegrityResult;
}

export interface IJsonSchemaVersionValidator {
    validateSchemaVersion(data: any): { isValid: boolean; version: string; supported: boolean; message: string };
}

export interface ICacheService {
    getCachedExportAll(): Promise<any>;
    setCachedExportAll(data: any, ttl?: number): Promise<void>;
    getCachedExportByChangeId(changeId: number): Promise<any>;
    setCachedExportByChangeId(changeId: number, data: any, ttl?: number): Promise<void>;
    invalidateAllCaches(): Promise<void>;
    invalidateCachesByChangeId(changeId: number): Promise<void>;
    invalidateExportAllCache(): Promise<void>;
}