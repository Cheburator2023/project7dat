import { Controller, Get, Param, Query } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from "@nestjs/swagger";
import { DatabaseSchemaService } from "../services/database-schema.service";
import {
	DatabaseSchemaResponse,
	TableDataResponse,
} from "../schemas/database-schema.schema";

@ApiTags("Схема базы данных")
@Controller("database-schema")
export class DatabaseSchemaController {
	constructor(private readonly databaseSchemaService: DatabaseSchemaService) {}

	@Get()
	@ApiOperation({ summary: "Получить схему базы данных" })
	@ApiResponse({
		status: 200,
		description: "Схема базы данных успешно получена",
		type: DatabaseSchemaResponse,
	})
	async getDatabaseSchema(): Promise<DatabaseSchemaResponse> {
		return this.databaseSchemaService.getDatabaseSchema();
	}

	@Get("tables/:tableName/data")
	@ApiOperation({ summary: "Получить данные таблицы" })
	@ApiParam({ name: "tableName", description: "Название таблицы" })
	@ApiQuery({
		name: "limit",
		description: "Лимит записей",
		required: false,
		type: Number,
	})
	@ApiQuery({
		name: "offset",
		description: "Смещение",
		required: false,
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: "Данные таблицы успешно получены",
		type: TableDataResponse,
	})
	async getTableData(
		@Param("tableName") tableName: string,
		@Query("limit") limit = 100,
		@Query("offset") offset = 0,
	): Promise<TableDataResponse> {
		return this.databaseSchemaService.getTableData(
			tableName,
			Number(limit),
			Number(offset),
		);
	}
}
