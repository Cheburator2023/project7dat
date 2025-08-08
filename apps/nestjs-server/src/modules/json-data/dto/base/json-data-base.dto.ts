import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class JsonDataBaseDto {
    @ApiProperty({
        description: 'Название JSON документа',
        example: 'Мой документ',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'JSON данные документа',
        example: { key: 'value' },
        required: true,
    })
    @IsObject()
    data: Record<string, any>;

    @ApiProperty({
        description: 'Описание документа',
        example: 'Описание моего документа',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;
}