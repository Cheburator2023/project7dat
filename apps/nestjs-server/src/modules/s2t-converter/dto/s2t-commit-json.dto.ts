import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsArray, IsOptional, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class S2tCommitJsonDescDto {
    @ApiPropertyOptional({ description: 'Наименование процесса' })
    @IsOptional()
    @IsString()
    process?: string;

    @ApiPropertyOptional({ description: 'Описание процесса' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Тип коммита', enum: ['table', 'json', 'model'] })
    @IsString()
    commit_type: 'table' | 'json' | 'model';

    @ApiPropertyOptional({ description: 'Дата версии данных' })
    @IsOptional()
    @IsString()
    change_date?: string;
}

export class S2tCommitJsonEntityAttrDto {
    @ApiProperty({ description: 'Имя атрибута' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Тип данных атрибута', example: 'STRING' })
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'Комментарий' })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({ description: 'Дата изменения атрибута' })
    @IsString()
    attr_change: string;
}

export class S2tCommitJsonEntityDto {
    @ApiProperty({ description: 'Уникальное имя сущности в БД' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Флаг изменения (true - цель, false - источник)' })
    @IsBoolean()
    modified: boolean;

    @ApiProperty({ description: 'Тип сущности', enum: ['table', 'view', 'json', 'input_vector'] })
    @IsString()
    type: string;

    @ApiProperty({ description: 'Наименование контейнера сущности' })
    @IsString()
    namespace: string;

    @ApiProperty({ description: 'Имя сущности' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Код системы сущности' })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({ description: 'Дата изменения сущности' })
    @IsString()
    entity_change: string;

    @ApiPropertyOptional({ description: 'Описание сущности' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Описание контейнера' })
    @IsOptional()
    @IsString()
    container_description?: string;

    @ApiPropertyOptional({ description: 'Дата изменения контейнера' })
    @IsOptional()
    @IsString()
    container_change?: string;

    @ApiProperty({ type: [S2tCommitJsonEntityAttrDto], description: 'Атрибуты сущности' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonEntityAttrDto)
    attrSeq: S2tCommitJsonEntityAttrDto[];
}

export class S2tCommitJsonAttrMapDto {
    @ApiProperty({ description: 'Имя источника' })
    @IsString()
    src: string;

    @ApiProperty({ description: 'Имя таргета' })
    @IsString()
    dst: string;

    @ApiProperty({ description: 'Дата добавления/изменения связи' })
    @IsString()
    relation_change: string;

    @ApiPropertyOptional({ description: 'ID источника' })
    @IsOptional()
    @IsNumber()
    src_id?: number;

    @ApiPropertyOptional({ description: 'ID таргета' })
    @IsOptional()
    @IsNumber()
    dst_id?: number;
}

export class S2tCommitJsonAtrDepDto {
    @ApiProperty({ description: 'Имя атрибута источника' })
    @IsString()
    attr: string;

    @ApiProperty({ description: 'Типы функций использования', type: [String] })
    @IsArray()
    @IsString({ each: true })
    linkTypes: string[];

    @ApiProperty({ description: 'Дата добавления/изменения связи' })
    @IsString()
    relation_change: string;

    @ApiPropertyOptional({ description: 'ID атрибута источника' })
    @IsOptional()
    @IsNumber()
    src_id?: number;
}

export class S2tCommitJsonDependencyDto {
    @ApiProperty({ description: 'Имя сущности источника' })
    @IsString()
    entityId: string;

    @ApiPropertyOptional({ description: 'ID сущности источника' })
    @IsOptional()
    @IsNumber()
    source_id?: number;

    @ApiPropertyOptional({ description: 'Код системы источника' })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiPropertyOptional({ description: 'ID процесса' })
    @IsOptional()
    @IsNumber()
    process_id?: number;

    @ApiPropertyOptional({ description: 'Наименование процесса' })
    @IsOptional()
    @IsString()
    process?: string;

    @ApiPropertyOptional({ description: 'Описание процесса' })
    @IsOptional()
    @IsString()
    process_description?: string;

    @ApiPropertyOptional({ description: 'Дата изменения процесса' })
    @IsOptional()
    @IsString()
    process_change?: string;

    @ApiProperty({ type: [S2tCommitJsonAttrMapDto], description: 'Маппинг атрибутов' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonAttrMapDto)
    attrMaps: S2tCommitJsonAttrMapDto[];

    @ApiProperty({ type: [S2tCommitJsonAtrDepDto], description: 'Функциональные зависимости' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonAtrDepDto)
    atrDeps: S2tCommitJsonAtrDepDto[];
}

export class S2tCommitJsonMappingDto {
    @ApiProperty({ description: 'Имя сущности цели' })
    @IsString()
    entityId: string;

    @ApiPropertyOptional({ description: 'Код системы цели' })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({ description: 'Дата добавления/изменения связи' })
    @IsString()
    relation_change: string;

    @ApiProperty({ type: [S2tCommitJsonDependencyDto], description: 'Зависимости' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonDependencyDto)
    deps: S2tCommitJsonDependencyDto[];

    @ApiPropertyOptional({ description: 'Описание связи' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'ID связи' })
    @IsOptional()
    @IsNumber()
    entity_map_id?: number;

    @ApiPropertyOptional({ description: 'ID целевой сущности' })
    @IsOptional()
    @IsNumber()
    target_id?: number;
}

export class S2tCommitJsonDto {
    @ApiProperty({ type: S2tCommitJsonDescDto })
    @ValidateNested()
    @Type(() => S2tCommitJsonDescDto)
    desc: S2tCommitJsonDescDto;

    @ApiProperty({ type: [S2tCommitJsonEntityDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonEntityDto)
    entities: S2tCommitJsonEntityDto[];

    @ApiProperty({ type: [S2tCommitJsonMappingDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => S2tCommitJsonMappingDto)
    mappings: S2tCommitJsonMappingDto[];
}