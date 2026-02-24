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
        description: "Разрешить импорт при наличии уже существующих циклических зависимостей",
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    allowExistingCycles?: boolean;
}
