import { ApiProperty } from "@nestjs/swagger";
import {
	IsObject,
	IsString,
	IsOptional,
	IsBoolean,
	IsEnum,
} from "class-validator";

export enum JsonSourceType {
	SURM = "SURM",
	DAPP = "DAPP",
}

export class JsonImportRequestDto {
	@ApiProperty({
		description: "JSON данные для импорта",
		example: { desc: {}, entities: [], mappings: [] },
	})
	@IsObject()
	data: Record<string, any>;

	@ApiProperty({
		description: "Пользователь, подтвердивший изменения",
		example: "user123",
	})
	@IsString()
	user: string;

	@ApiProperty({
		description: "Наименование изменения",
		example: "Импорт данных СУРМ",
	})
	@IsString()
	changeName: string;

	@ApiProperty({
		description: "Флаг проверки перед импортом",
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	validated?: boolean;

	@ApiProperty({
		description: "Тип источника JSON данных",
		enum: JsonSourceType,
		example: JsonSourceType.SURM,
		required: false,
	})
	@IsOptional()
	@IsEnum(JsonSourceType)
	sourceType?: JsonSourceType;

	@ApiProperty({
		description: "Версия схемы JSON",
		example: "1.0",
		required: false,
	})
	@IsOptional()
	@IsString()
	schemaVersion?: string;

	@ApiProperty({
		description:
			"Разрешить импорт при наличии циклических зависимостей, которые существовали ранее",
		required: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	allowExistingCycles?: boolean;

	@ApiProperty({
		description:
			"Пропустить проверку на дубликаты (для случаев, когда дубликаты уже есть в БД и их импорт разрешён)",
		required: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	skipDuplicateCheck?: boolean;

	@ApiProperty({
		description:
			"Пропустить структурную валидацию (для merge flow, когда данные уже из БД)",
		required: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	skipStructureValidation?: boolean;

	@ApiProperty({
		description:
			"Полностью пропустить валидацию (для merge flow, когда данные уже провалидированы в applyMerge)",
		required: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	skipValidation?: boolean;

	checkCancelled?: () => void;

	onStepProgress?: (step: string) => void;
}
