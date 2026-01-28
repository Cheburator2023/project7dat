import { ApiProperty } from "@nestjs/swagger";

export class ValidationResultDto {
	@ApiProperty({ description: "Валидность данных" })
	isValid: boolean;

	@ApiProperty({ description: "Ошибки валидации", type: [String] })
	errors: string[];

	@ApiProperty({ description: "Предупреждения", type: [String] })
	warnings: string[];
}

export class IntegrityResultDto {
	@ApiProperty({ description: "Целостность данных" })
	isValid: boolean;

	@ApiProperty({ description: "Проблемы целостности", type: [String] })
	issues: string[];
}

export class BusinessValidationResultDto {
	@ApiProperty({ description: "Соответствие бизнес-правилам" })
	isValid: boolean;

	@ApiProperty({ description: "Нарушения бизнес-правил", type: [String] })
	violations: string[];

	@ApiProperty({ description: "Рекомендации", type: [String] })
	recommendations: string[];
}

export class RecursionCheckResultDto {
	@ApiProperty({ description: "Наличие рекурсии" })
	hasRecursion: boolean;

	@ApiProperty({
		description: "Обнаруженные циклы",
		type: [String],
		example: [["entity1", "entity2", "entity1"]],
	})
	cycles: string[][];
}

export class DuplicateCheckResultDto {
	@ApiProperty({ description: "Наличие дубликатов" })
	hasDuplicates: boolean;

	@ApiProperty({ description: "Обнаруженные дубликаты", type: [String] })
	duplicates: string[];
}

export class SchemaVersionResultDto {
	@ApiProperty({ description: "Валидность версии схемы" })
	isValid: boolean;

	@ApiProperty({ description: "Версия схемы", example: "1.0" })
	version: string;

	@ApiProperty({ description: "Поддерживается ли версия" })
	supported: boolean;

	@ApiProperty({ description: "Сообщение о версии" })
	message: string;
}

export class ValidationStatisticsDto {
	@ApiProperty({ description: "Количество сущностей" })
	entitiesCount: number;

	@ApiProperty({ description: "Количество атрибутов" })
	attributesCount: number;

	@ApiProperty({ description: "Количество маппингов" })
	mappingsCount: number;

	@ApiProperty({ description: "Количество зависимостей" })
	dependenciesCount: number;

	@ApiProperty({ description: "Количество измененных сущностей" })
	modifiedEntitiesCount: number;
}

export class ComprehensiveValidationResponseDto {
	@ApiProperty({ description: "Общая валидность данных" })
	isValid: boolean;

	@ApiProperty({ type: ValidationResultDto })
	validation: ValidationResultDto;

	@ApiProperty({ type: IntegrityResultDto })
	integrity: IntegrityResultDto;

	@ApiProperty({
		description: "Информация о версии схемы",
		type: Object,
		example: {
			compatible: true,
			migrationRequired: false,
			message: "Версия схемы 1.0 поддерживается",
			currentVersion: "2.0",
			incomingVersion: "1.0",
			version: "1.0",
			supported: true,
		},
	})
	schemaVersion: any;

	@ApiProperty({ type: ValidationStatisticsDto })
	statistics: ValidationStatisticsDto;

	@ApiProperty({ type: RecursionCheckResultDto })
	recursionCheck: RecursionCheckResultDto;

	@ApiProperty({ type: DuplicateCheckResultDto })
	duplicateCheck: DuplicateCheckResultDto;

	@ApiProperty({ description: "Нормализованные данные" })
	normalizedData: any;

	@ApiProperty({ description: "Рекомендации", type: [String] })
	recommendations: string[];
}
