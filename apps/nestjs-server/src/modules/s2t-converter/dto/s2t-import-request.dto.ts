import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class S2TImportRequestDto {
    @ApiProperty({
        description: 'Имя коммита в системе Data Lineage',
        example: 'Обновление витрины продаж',
    })
    @IsString()
    commit_name: string;

    @ApiProperty({
        description: 'Описание коммита в системе Data Lineage',
        example: 'Обновление данных за январь 2024',
        required: false,
    })
    @IsOptional()
    @IsString()
    commit_description?: string;

    @ApiProperty({
        description: 'Наименование процесса (для витрин и моделей)',
        example: 'DAG_SALES_UPDATE',
        required: false,
    })
    @IsOptional()
    @IsString()
    process_name?: string;

    @ApiProperty({
        description: 'Описание процесса',
        example: 'Обновление витрины продаж',
        required: false,
    })
    @IsOptional()
    @IsString()
    process_description?: string;
}