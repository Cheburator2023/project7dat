import { ApiProperty } from "@nestjs/swagger";

export class ColumnInfo {
	@ApiProperty({ description: "Название колонки" })
	name: string;

	@ApiProperty({ description: "Тип данных колонки" })
	type: string;

	@ApiProperty({ description: "Является ли колонка первичным ключом" })
	primaryKey: boolean;

	@ApiProperty({ description: "Может ли колонка содержать NULL" })
	nullable: boolean;

	@ApiProperty({ description: "Значение по умолчанию", required: false })
	defaultValue?: string;

	@ApiProperty({
		description: "Является ли колонка автоинкрементной",
		required: false,
	})
	autoIncrement?: boolean;
}

export class ForeignKeyInfo {
	@ApiProperty({ description: "Название колонки с внешним ключом" })
	column: string;

	@ApiProperty({
		description: "Ссылка на таблицу и колонку (например, 'users.id')",
	})
	references: string;

	@ApiProperty({ description: "Действие при обновлении", required: false })
	onUpdate?: string;

	@ApiProperty({ description: "Действие при удалении", required: false })
	onDelete?: string;
}

export class TableInfo {
	@ApiProperty({ description: "Название таблицы" })
	name: string;

	@ApiProperty({ description: "Список колонок", type: [ColumnInfo] })
	columns: ColumnInfo[];

	@ApiProperty({ description: "Список внешних ключей", type: [ForeignKeyInfo] })
	foreignKeys: ForeignKeyInfo[];

	@ApiProperty({ description: "Количество записей в таблице" })
	rowCount: number;

	@ApiProperty({ description: "Размер таблицы в байтах", required: false })
	tableSize?: number;
}

export class DatabaseSchemaResponse {
	@ApiProperty({ description: "Список таблиц", type: [TableInfo] })
	tables: TableInfo[];

	@ApiProperty({ description: "Тип базы данных" })
	databaseType: string;

	@ApiProperty({ description: "Название базы данных" })
	databaseName: string;

	@ApiProperty({ description: "Общее количество таблиц" })
	totalTables: number;
}

export class TableDataResponse {
	@ApiProperty({ description: "Название таблицы" })
	tableName: string;

	@ApiProperty({ description: "Данные таблицы" })
	data: Record<string, any>[];

	@ApiProperty({ description: "Общее количество записей" })
	totalRows: number;

	@ApiProperty({ description: "Количество возвращенных записей" })
	returnedRows: number;
}
