import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsString, IsOptional, IsBoolean } from "class-validator";

export class JsonImportRequestDto {
    @ApiProperty({
        description: "JSON данные для импорта",
        example: { desc: {}, entities: [], mappings: [] }
    })
    @IsObject()
    data: Record<string, any>;

    @ApiProperty({
        description: "Пользователь, подтвердивший изменения",
        example: "user123"
    })
    @IsString()
    user: string;

    @ApiProperty({
        description: "Наименование изменения",
        example: "Импорт данных СУРМ"
    })
    @IsString()
    changeName: string;

    @ApiProperty({
        description: "Флаг проверки перед импортом",
        example: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    validated?: boolean;
}