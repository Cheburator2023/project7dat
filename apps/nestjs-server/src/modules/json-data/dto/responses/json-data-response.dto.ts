import { ApiProperty } from '@nestjs/swagger';
import { JsonDataBaseDto } from '../base/json-data-base.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class JsonDataResponseDto extends JsonDataBaseDto {
    @ApiProperty({
        description: 'Уникальный идентификатор документа',
        example: 'uuid-string',
    })
    @IsString({ message: "name must be a string" })
    @IsNotEmpty({ message: "name should not be empty" })
    id: string;

    @ApiProperty({
        description: 'Дата создания',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Дата последнего обновления',
        example: '2023-01-01T00:00:00.000Z',
    })
    updatedAt: Date;
}