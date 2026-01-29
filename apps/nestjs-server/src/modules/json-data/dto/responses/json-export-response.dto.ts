import { ApiProperty } from "@nestjs/swagger";

export class JsonExportDescDto {
	@ApiProperty({
		description: "Дата версии данных",
		example: "2024-01-15T10:30:00.000Z",
	})
	change_date: string;
}

export class JsonExportAttributeDto {
	@ApiProperty({ description: "Имя атрибута" })
	name: string;

	@ApiProperty({
		description: "Тип данных атрибута",
		enum: ["TIMESTAMP", "DECIMAL", "STRING", "INTEGER"],
	})
	type: string;

	@ApiProperty({ description: "Комментарий", required: false })
	comment?: string;

	@ApiProperty({ description: "Дата изменения атрибута" })
	attr_change: string;
}

export class JsonExportEntityDto {
	@ApiProperty({ description: "Уникальное имя сущности в БД" })
	id: string;

	@ApiProperty({
		description: "Флаг изменения (true - цель, false - источник)",
	})
	modified: boolean;

	@ApiProperty({
		description: "Тип сущности",
		enum: ["table", "view", "json", "input_vector", "unresolved", "rdd"],
	})
	type: string;

	@ApiProperty({ description: "Наименование контейнера сущности" })
	namespace: string;

	@ApiProperty({ description: "Имя сущности" })
	name: string;

	@ApiProperty({ description: "Дата изменения сущности" })
	entity_change: string;

	@ApiProperty({ description: "Описание сущности", required: false })
	description?: string;

	@ApiProperty({ description: "Описание контейнера", required: false })
	container_description?: string;

	@ApiProperty({ description: "Код системы", required: false })
	system_code?: string;

	@ApiProperty({ description: "Дата изменения контейнера" })
	container_change: string;

	@ApiProperty({
		type: [JsonExportAttributeDto],
		description: "Атрибуты сущности",
	})
	attrSeq: JsonExportAttributeDto[];
}

export class JsonExportAttrMapDto {
	@ApiProperty({ description: "Имя источника" })
	src: string;

	@ApiProperty({ description: "Имя таргета" })
	dst: string;

	@ApiProperty({ description: "Дата добавления/изменения связи" })
	relation_change: string;
}

export class JsonExportAtrDepDto {
	@ApiProperty({ description: "Имя атрибута источника" })
	attr: string;

	@ApiProperty({
		description: "Типы функций использования",
		type: [String],
		example: ["WHERE", "JOIN", "GROUPBY", "WINDOW"],
	})
	linkTypes: string[];

	@ApiProperty({ description: "Дата добавления/изменения связи" })
	relation_change: string;
}

export class JsonExportDependencyDto {
	@ApiProperty({ description: "Имя сущности источника" })
	entityId: string;

	@ApiProperty({
		type: [JsonExportAttrMapDto],
		description: "Маппинг атрибутов",
	})
	attrMaps: JsonExportAttrMapDto[];

	@ApiProperty({
		type: [JsonExportAtrDepDto],
		description: "Функциональные зависимости",
	})
	atrDeps: JsonExportAtrDepDto[];
}

export class JsonExportMappingDto {
	@ApiProperty({ description: "Имя сущности цели" })
	entityId: string;

	@ApiProperty({ description: "Наименование процесса DAG", required: false })
	process?: string;

	@ApiProperty({ description: "Описание процесса DAG", required: false })
	process_description?: string;

	@ApiProperty({ description: "Дата изменения процесса", required: false })
	process_change?: string;

	@ApiProperty({ description: "Описание связи", required: false })
	description?: string;

	@ApiProperty({ description: "Дата добавления/изменения связи" })
	relation_change: string;

	@ApiProperty({ type: [JsonExportDependencyDto], description: "Зависимости" })
	deps: JsonExportDependencyDto[];

	@ApiProperty({
		description: "Сущности, которые не получилось сопоставить",
		required: false,
	})
	unmatched?: string;
}

export class JsonExportResponseDto {
	@ApiProperty({ type: JsonExportDescDto })
	desc: JsonExportDescDto;

	@ApiProperty({ type: [JsonExportEntityDto] })
	entities: JsonExportEntityDto[];

	@ApiProperty({ type: [JsonExportMappingDto] })
	mappings: JsonExportMappingDto[];
}
