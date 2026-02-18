import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum CommitStateFilter {
    PROCESSING = 'processing',
    DONE = 'done',
    ALL = 'all',
}

export class CommitListQueryDto {
    @ApiPropertyOptional({ description: 'Номер страницы', minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Количество записей на странице', minimum: 1, maximum: 100, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Тип коммита (table/json/model)', enum: ['table', 'json', 'model'] })
    @IsOptional()
    @IsString()
    @IsEnum(['table', 'json', 'model'])
    type?: 'table' | 'json' | 'model';

    @ApiPropertyOptional({ description: 'Статус коммита', enum: CommitStateFilter, default: CommitStateFilter.ALL })
    @IsOptional()
    @IsString()
    @IsEnum(CommitStateFilter)
    state?: CommitStateFilter = CommitStateFilter.ALL;

    @ApiPropertyOptional({ description: 'Имя пользователя, создавшего коммит' })
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional({ description: 'Поиск по имени коммита' })
    @IsOptional()
    @IsString()
    search?: string;
}