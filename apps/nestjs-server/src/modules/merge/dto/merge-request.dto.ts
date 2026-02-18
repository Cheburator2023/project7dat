import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyMergeRequestDto {
    @ApiProperty({
        description: 'GUID пользовательской версии коммита',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    commitId: string;
}

export class ConfirmMergeRequestDto {
    @ApiProperty({
        description: 'GUID пользовательской версии коммита',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    commitId: string;

    @ApiPropertyOptional({
        description: 'ФИО пользователя (переопределяет данные коммита)',
        example: 'Иванов Иван Иванович',
    })
    @IsOptional()
    user?: string;
}

export class CancelMergeRequestDto {
    @ApiProperty({
        description: 'GUID пользовательской версии коммита',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    commitId: string;
}

export class EntityExportPaginationDto {
    @ApiPropertyOptional({
        description: 'Номер страницы',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Количество элементов на странице',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Тип сортировки (по умолчанию по имени)',
        enum: ['name', 'change_date'],
        default: 'name',
    })
    @IsOptional()
    sortBy?: 'name' | 'change_date' = 'name';

    @ApiPropertyOptional({
        description: 'Направление сортировки',
        enum: ['ASC', 'DESC'],
        default: 'ASC',
    })
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'ASC';
}