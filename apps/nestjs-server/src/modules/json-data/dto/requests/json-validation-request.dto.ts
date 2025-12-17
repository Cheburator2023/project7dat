import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class JsonValidationRequestDto {
    @ApiProperty({
        description: "JSON данные для валидации",
        example: { desc: {}, entities: [], mappings: [] },
    })
    @IsObject()
    data: Record<string, any>;

    @ApiProperty({
        description: "Идентификатор пользователя",
        example: "ivanov",
        required: false,
    })
    @IsOptional()
    @IsString()
    user?: string;
}