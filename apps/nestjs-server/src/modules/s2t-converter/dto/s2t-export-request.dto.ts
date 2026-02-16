import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum S2TExportType {
    VITRINA = 'vitrina',
    JSON = 'json',
    MODEL = 'model',
}

export class S2TExportRequestDto {
    @ApiProperty({
        description: 'Тип экспортируемого S2T',
        enum: S2TExportType,
        example: S2TExportType.VITRINA,
        required: false,
    })
    @IsOptional()
    @IsEnum(S2TExportType)
    type?: S2TExportType;

    @ApiProperty({
        description: 'ID коммита для экспорта (если не указан, экспортируется текущая модель из БД)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsOptional()
    @IsString()
    commit_id?: string;
}