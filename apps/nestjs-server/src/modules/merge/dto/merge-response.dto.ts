import { ApiProperty } from "@nestjs/swagger";
import { JsonExportResponseDto } from "../../json-data/dto/responses/json-export-response.dto";

export class MergeDiffDto {
	@ApiProperty({
		description: "Тип изменения",
		enum: ["added", "removed", "modified"],
	})
	type: "added" | "removed" | "modified";

	@ApiProperty({ description: "Путь к измененному свойству" })
	path: string;

	@ApiProperty({ description: "Старое значение (если есть)" })
	oldValue?: any;

	@ApiProperty({ description: "Новое значение (если есть)" })
	newValue?: any;
}

export class ApplyMergeResponseDto {
	@ApiProperty({
		description: "Уникальный идентификатор операции слияния",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	mergeSessionId: string;

	@ApiProperty({
		description: "JSON смерженной модели данных",
		type: JsonExportResponseDto,
	})
	mergedJson: JsonExportResponseDto;

	@ApiProperty({
		description: "Список изменений (diff)",
		type: [MergeDiffDto],
	})
	diff: MergeDiffDto[];

	@ApiProperty({
		description: "Количество измененных сущностей",
		example: 5,
	})
	changedEntitiesCount: number;

	@ApiProperty({
		description: "Количество измененных атрибутов",
		example: 12,
	})
	changedAttributesCount: number;

	@ApiProperty({
		description: "Количество измененных маппингов",
		example: 3,
	})
	changedMappingsCount: number;

	@ApiProperty({
		description:
			"Обнаружены ли дубликаты сущностей в БД (требуется дедупликация перед confirm)",
		example: false,
	})
	hasDuplicates: boolean;

	@ApiProperty({
		description: "Количество дубликатов сущностей в БД",
		example: 0,
	})
	duplicatesCount: number;
}

export class ConfirmMergeResponseDto {
	@ApiProperty({ description: "Успешность операции", example: true })
	success: boolean;

	@ApiProperty({
		description: "ID сессии слияния для отслеживания прогресса",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	mergeSessionId: string;

	@ApiProperty({
		description: "Сообщение",
		example: "Слияние запущено в фоновом режиме",
	})
	message: string;
}

export class MergeSessionStatusDto {
	@ApiProperty({
		description: "ID сессии слияния",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	mergeSessionId: string;

	@ApiProperty({
		description: "ID коммита",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	commitId: string;

	@ApiProperty({
		description: "Название коммита",
		example: "Импорт данных",
	})
	commitName: string;

	@ApiProperty({
		description: "Статус слияния",
		enum: ["merging", "done", "failed"],
	})
	status: "merging" | "done" | "failed";

	@ApiProperty({
		description: "Прогресс выполнения от 0 до 100",
		example: 45,
	})
	progress: number;

	@ApiProperty({
		description: "Текущий этап выполнения",
		example: "Импорт данных в БД",
	})
	stage: string;

	@ApiProperty({
		description: "Время начала процесса (ISO)",
		example: "2025-03-10T15:00:00.000Z",
	})
	startedAt: string;

	@ApiProperty({
		description:
			"Примерное оставшееся время в секундах (null если невозможно определить)",
		example: 30,
		nullable: true,
	})
	estimatedSecondsLeft: number | null;

	@ApiProperty({
		description: "ID снепшота (после завершения)",
		example: "uuid-snapshot",
		nullable: true,
	})
	snapshotId: string | null;

	@ApiProperty({
		description: "Сообщение об ошибке (при status=failed)",
		nullable: true,
	})
	errorMessage: string | null;
}

export class CancelMergeResponseDto {
	@ApiProperty({ description: "Успешность операции", example: true })
	success: boolean;

	@ApiProperty({
		description: "Сообщение",
		example: "Слияние отменено, временные данные удалены",
	})
	message: string;
}

export class EntityExportPaginatedResponseDto {
	@ApiProperty({ type: JsonExportResponseDto })
	data: JsonExportResponseDto;

	@ApiProperty({ description: "Общее количество маппингов", example: 45 })
	totalMappings: number;

	@ApiProperty({ description: "Общее количество зависимостей", example: 120 })
	totalDependencies: number;

	@ApiProperty({ description: "Текущая страница", example: 1 })
	page: number;

	@ApiProperty({ description: "Лимит на страницу", example: 20 })
	limit: number;

	@ApiProperty({ description: "Всего страниц", example: 3 })
	totalPages: number;
}
