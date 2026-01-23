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
