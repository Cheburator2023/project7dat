export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface IntegrityResult {
    isValid: boolean;
    issues: string[];
}

export interface BusinessValidationResult {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
}

export interface RecursionCheckResult {
    hasRecursion: boolean;
    cycles: string[][];
}

export interface DuplicateCheckResult {
    hasDuplicates: boolean;
    duplicates: string[];
}

export interface SchemaVersionResult {
    isValid: boolean;
    version: string;
    supported: boolean;
    message: string;
}

export interface ValidationReport {
    summary: {
        isValid: boolean;
        entitiesCount: number;
        attributesCount: number;
        mappingsCount: number;
        schemaVersion: string;
    };
    validation: ValidationResult;
    integrity: IntegrityResult;
    statistics: {
        entitiesCount: number;
        attributesCount: number;
        mappingsCount: number;
        dependenciesCount: number;
        modifiedEntitiesCount: number;
    };
}

export interface ComprehensiveValidationResponse {
    isValid: boolean;
    validation: ValidationResult;
    integrity: IntegrityResult;
    schemaVersion: {
        compatible: boolean;
        migrationRequired: boolean;
        message: string;
        currentVersion: string;
        incomingVersion: string;
        version: string;
        supported: boolean;
    };
    statistics: any;
    recursionCheck: RecursionCheckResult;
    duplicateCheck: DuplicateCheckResult;
    normalizedData: any;
    recommendations: string[];
}