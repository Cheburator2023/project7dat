import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsISO8601, IsNumber } from "class-validator";

// DTO для описания секции
export class JsonExportDescDto {
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
export class JsonExportAttributeDto {
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
export class JsonExportEntityDto {
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
        type: [JsonExportAttributeDto],
        description: "Атрибуты сущности"
    })
    @IsArray()
    attrSeq: JsonExportAttributeDto[];

    @ApiProperty({ description: "Наименование системы сущности в РБД DL", required: false })
    @IsOptional()
    @IsString()
    system_name?: string;
}

// DTO для маппинга атрибутов
export class JsonExportAttrMapDto {
    @ApiProperty({ description: "Имя источника" })
    @IsString()
    src: string;

    @ApiProperty({ description: "Имя таргета" })
    @IsString()
    dst: string;

    @ApiProperty({
        description: "ID источника (source_attribute_id)",
        required: false
    })
    @IsOptional()
    @IsNumber()
    src_id?: number;

    @ApiProperty({
        description: "ID таргета (attribute_id)",
        required: false
    })
    @IsOptional()
    @IsNumber()
    dst_id?: number;

    @ApiProperty({ description: "Дата добавления/изменения связи" })
    @IsISO8601()
    relation_change: string;
}

// DTO для функциональных зависимостей
export class JsonExportAtrDepDto {
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

    @ApiProperty({
        description: "ID атрибута источника (source_attribute_id)",
        required: false
    })
    @IsOptional()
    @IsNumber()
    src_id?: number;

    @ApiProperty({ description: "Дата добавления/изменения связи" })
    @IsISO8601()
    relation_change: string;
}

// DTO для зависимостей (deps)
export class JsonExportDependencyDto {
    @ApiProperty({ description: "Имя сущности источника" })
    @IsString()
    entityId: string;

    @ApiProperty({ description: "Уникальный идентификатор сущности источник в РБД DL", required: false })
    @IsOptional()
    @IsNumber()
    source_id?: number;

    @ApiProperty({
        description: "Код системы источника",
        example: "1642",
        required: false
    })
    @IsOptional()
    @IsString()
    system_code?: string;

    @ApiProperty({ description: "Уникальный идентификатор процесса DAG в РБД", required: false })
    @IsOptional()
    @IsNumber()
    process_id?: number;

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
        type: [JsonExportAttrMapDto],
        description: "Маппинг атрибутов"
    })
    @IsArray()
    attrMaps: JsonExportAttrMapDto[];

    @ApiProperty({
        type: [JsonExportAtrDepDto],
        description: "Функциональные зависимости"
    })
    @IsArray()
    atrDeps: JsonExportAtrDepDto[];
}

// DTO для маппингов
export class JsonExportMappingDto {
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
        type: [JsonExportDependencyDto],
        description: "Зависимости"
    })
    @IsArray()
    deps: JsonExportDependencyDto[];

    @ApiProperty({ description: "Описание связи (маппинга) источник - цель", required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: "Уникальный идентификатор связи", required: false })
    @IsOptional()
    @IsNumber()
    entity_map_id?: number;

    @ApiProperty({ description: "Уникальный идентификатор сущности 'цель'", required: false })
    @IsOptional()
    @IsNumber()
    target_id?: number;

}

// Основной DTO для ответа
export class JsonExportResponseDto {
    @ApiProperty({ type: JsonExportDescDto })
    desc: JsonExportDescDto;

    @ApiProperty({ type: [JsonExportEntityDto] })
    entities: JsonExportEntityDto[];

    @ApiProperty({ type: [JsonExportMappingDto] })
    mappings: JsonExportMappingDto[];
}
