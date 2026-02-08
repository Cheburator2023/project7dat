import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsISO8601 } from "class-validator";

// DTO для описания секции
export class JsonExportNewDescDto {
    @ApiProperty({
        description: "Дата версии данных",
        example: "2024-01-15T10:30:00.000Z"
    })
    @IsISO8601()
    change_date: string;

    @ApiProperty({
        description: "Код системы по умолчанию",
        example: "1642",
        required: false
    })
    @IsOptional()
    @IsString()
    default_system_code?: string;
}

// DTO для атрибута сущности
export class JsonExportNewAttributeDto {
    @ApiProperty({ description: "Имя атрибута" })
    @IsString()
    name: string;

    @ApiProperty({
        description: "Тип данных атрибута",
        enum: ['TIMESTAMP', 'DECIMAL', 'STRING', 'INTEGER', 'BOOLEAN']
    })
    @IsString()
    type: string;

    @ApiProperty({ description: "Комментарий", required: false })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({ description: "Дата изменения атрибута" })
    @IsISO8601()
    attr_change: string;
}

// DTO для сущности
export class JsonExportNewEntityDto {
    @ApiProperty({ description: "Уникальное имя сущности в БД" })
    @IsString()
    id: string;

    @ApiProperty({ description: "Флаг изменения (true - цель, false - источник)" })
    modified: boolean;

    @ApiProperty({
        description: "Тип сущности",
        enum: ['table', 'view', 'json', 'input_vector', 'unresolved', 'rdd']
    })
    @IsString()
    type: string;

    @ApiProperty({ description: "Наименование контейнера сущности" })
    @IsString()
    namespace: string;

    @ApiProperty({ description: "Имя сущности" })
    @IsString()
    name: string;

    @ApiProperty({
        description: "Код системы сущности",
        example: "1642",
        required: false
    })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({ description: "Дата изменения сущности" })
    @IsISO8601()
    entity_change: string;

    @ApiProperty({ description: "Описание сущности", required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: "Описание контейнера", required: false })
    @IsOptional()
    @IsString()
    container_description?: string;

    @ApiProperty({ description: "Дата изменения контейнера" })
    @IsISO8601()
    container_change: string;

    @ApiProperty({
        type: [JsonExportNewAttributeDto],
        description: "Атрибуты сущности"
    })
    @IsArray()
    attrSeq: JsonExportNewAttributeDto[];
}

// DTO для маппинга атрибутов
export class JsonExportNewAttrMapDto {
    @ApiProperty({ description: "Имя источника" })
    @IsString()
    src: string;

    @ApiProperty({ description: "Имя таргета" })
    @IsString()
    dst: string;

    @ApiProperty({ description: "Дата добавления/изменения связи" })
    @IsISO8601()
    relation_change: string;
}

// DTO для функциональных зависимостей
export class JsonExportNewAtrDepDto {
    @ApiProperty({ description: "Имя атрибута источника" })
    @IsString()
    attr: string;

    @ApiProperty({
        description: "Типы функций использования",
        type: [String],
        example: ["WHERE", "JOIN", "GROUPBY", "WINDOW"]
    })
    @IsArray()
    @IsString({ each: true })
    linkTypes: string[];

    @ApiProperty({ description: "Дата добавления/изменения связи" })
    @IsISO8601()
    relation_change: string;
}

// DTO для зависимостей (deps)
export class JsonExportNewDependencyDto {
    @ApiProperty({ description: "Имя сущности источника" })
    @IsString()
    entityId: string;

    @ApiProperty({
        description: "Код системы источника",
        example: "1642",
        required: false
    })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({
        description: "Наименование процесса DAG",
        required: false
    })
    @IsOptional()
    @IsString()
    process?: string;

    @ApiProperty({
        description: "Описание процесса DAG",
        required: false
    })
    @IsOptional()
    @IsString()
    process_description?: string;

    @ApiProperty({
        description: "Дата изменения процесса",
        required: false
    })
    @IsOptional()
    @IsISO8601()
    process_change?: string;

    @ApiProperty({
        type: [JsonExportNewAttrMapDto],
        description: "Маппинг атрибутов"
    })
    @IsArray()
    attrMaps: JsonExportNewAttrMapDto[];

    @ApiProperty({
        type: [JsonExportNewAtrDepDto],
        description: "Функциональные зависимости"
    })
    @IsArray()
    atrDeps: JsonExportNewAtrDepDto[];
}

// DTO для маппингов
export class JsonExportNewMappingDto {
    @ApiProperty({ description: "Имя сущности цели" })
    @IsString()
    entityId: string;

    @ApiProperty({
        description: "Код системы цели",
        example: "1642",
        required: false
    })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({ description: "Дата добавления/изменения связи" })
    @IsISO8601()
    relation_change: string;

    @ApiProperty({
        type: [JsonExportNewDependencyDto],
        description: "Зависимости"
    })
    @IsArray()
    deps: JsonExportNewDependencyDto[];

    @ApiProperty({
        description: "Сущности, которые не получилось сопоставить",
        required: false
    })
    @IsOptional()
    @IsString()
    unmatched?: string;
}

// Основной DTO для ответа
export class JsonExportNewResponseDto {
    @ApiProperty({ type: JsonExportNewDescDto })
    desc: JsonExportNewDescDto;

    @ApiProperty({ type: [JsonExportNewEntityDto] })
    entities: JsonExportNewEntityDto[];

    @ApiProperty({ type: [JsonExportNewMappingDto] })
    mappings: JsonExportNewMappingDto[];
}