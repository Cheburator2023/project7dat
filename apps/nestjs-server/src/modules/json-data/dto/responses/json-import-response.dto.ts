import { ApiProperty } from "@nestjs/swagger";

export class JsonImportResponseDto {
	@ApiProperty({ description: "Успешность операции" })
	success: boolean;

	@ApiProperty({ description: "ID созданной записи изменения" })
	changeId: number;

	@ApiProperty({ description: "Сообщение о результате" })
	message: string;

	@ApiProperty({
		description: "Предупреждения",
		type: [String],
		required: false,
	})
	warnings?: string[];

	@ApiProperty({
		description: "Статистика обработки",
		type: Object,
		example: {
			entitiesProcessed: 10,
			attributesProcessed: 45,
			mappingsProcessed: 8,
		},
	})
	stats: {
		entitiesProcessed: number;
		attributesProcessed: number;
		mappingsProcessed: number;
	};
}

export class JsonValidationResponseDto {
	@ApiProperty({ description: "Валидность JSON" })
	isValid: boolean;

	@ApiProperty({ description: "Ошибки валидации", type: [String] })
	errors: string[];

	@ApiProperty({ description: "Предупреждения", type: [String] })
	warnings: string[];

	@ApiProperty({ description: "Информационные сообщения", type: [String] })
	info: string[];

	@ApiProperty({ description: "Поддерживаемые типы сущностей", type: [String] })
	entityTypes: string[];

	@ApiProperty({ description: "Поддерживаемые типы атрибутов", type: [String] })
	attributeTypes: string[];
}

export class DependencyCheckResponseDto {
	@ApiProperty({ description: "Наличие конфликтов" })
	hasConflicts: boolean;

	@ApiProperty({
		description: "Конфликты",
		type: [Object],
		example: [
			{
				entityName: "schema.table",
				processes: ["process1 (ID: 1)", "process2 (ID: 2)"],
			},
		],
	})
	conflicts: Array<{
		entityName: string;
		processes: string[];
	}>;
}
