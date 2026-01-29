import {
	ValidationResult,
	IntegrityResult,
	BusinessValidationResult,
	RecursionCheckResult,
	DuplicateCheckResult,
} from "../../types";

// Используем abstract classes для DI (incoming подход)
export abstract class JsonStructureValidator {
	abstract validateStructure(data: any): ValidationResult;
	abstract checkForRecursion(
		entities: any[],
		mappings: any[],
	): RecursionCheckResult;
	abstract checkForDuplicates(data: any): DuplicateCheckResult;
	abstract normalizeJsonData(data: any): any;
}

export abstract class JsonBusinessRulesValidator {
	abstract validateBusinessRules(data: any): BusinessValidationResult;
}

export abstract class JsonIntegrityValidator {
	abstract validateIntegrity(data: any): IntegrityResult;
}

export abstract class JsonSchemaVersionValidator {
	abstract validateSchemaVersion(data: any): {
		isValid: boolean;
		version: string;
		supported: boolean;
		message: string;
	};
}
