import { Injectable, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { IDatabaseProvider } from "src/core/shared/database/interfaces/database.interface";
import {
	DatabaseSchemaResponse,
	TableInfo,
	ColumnInfo,
	ForeignKeyInfo,
	TableDataResponse,
} from "../schemas/database-schema.schema";

@Injectable()
export class DatabaseSchemaService {
	private dataSource: DataSource;

	constructor(
		@Inject("DATABASE_PROVIDER")
		private readonly databaseProvider: IDatabaseProvider,
	) {}

	private async ensureConnection(): Promise<void> {
		if (this.dataSource) {
			return;
		}

		try {
			await this.databaseProvider.connect();
			this.dataSource = this.databaseProvider.getDataSource();
		} catch (_error) {
			throw new Error(
				"Схема базы данных недоступна в режиме in-memory storage",
			);
		}
	}

	async getDatabaseSchema(): Promise<DatabaseSchemaResponse> {
		try {
			await this.ensureConnection();
		} catch (_error) {
			return this.getMemoryStorageSchema();
		}

		const databaseType = this.dataSource.options.type;
		const databaseName = this.getDatabaseName();

		const tables = await this.extractTables();

		return {
			databaseType,
			databaseName,
			tables,
			totalTables: tables.length,
		};
	}

	private getMemoryStorageSchema(): DatabaseSchemaResponse {
		const mockTables: TableInfo[] = [
			{
				name: "json_data",
				rowCount: 0,
				columns: [
					{
						name: "id",
						type: "varchar",
						primaryKey: true,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "name",
						type: "varchar",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "data",
						type: "text",
						primaryKey: false,
						nullable: true,
						defaultValue: undefined,
					},
					{
						name: "description",
						type: "varchar",
						primaryKey: false,
						nullable: true,
						defaultValue: undefined,
					},
					{
						name: "createdAt",
						type: "datetime",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "updatedAt",
						type: "datetime",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
				],
				foreignKeys: [],
			},
			{
				name: "json_commits",
				rowCount: 0,
				columns: [
					{
						name: "id",
						type: "varchar",
						primaryKey: true,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "jsonDataId",
						type: "varchar",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "data",
						type: "text",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
					{
						name: "createdAt",
						type: "datetime",
						primaryKey: false,
						nullable: false,
						defaultValue: undefined,
					},
				],
				foreignKeys: [
					{
						column: "jsonDataId",
						references: "json_data.id",
					},
				],
			},
		];

		return {
			databaseType: "memory",
			databaseName: "In-Memory Storage",
			tables: mockTables,
			totalTables: mockTables.length,
		};
	}

	async getTableData(
		tableName: string,
		limit = 100,
		offset = 0,
	): Promise<TableDataResponse> {
		try {
			await this.ensureConnection();
		} catch (_error) {
			return this.getMemoryStorageTableData(tableName, limit, offset);
		}

		const queryRunner = this.dataSource.createQueryRunner();

		try {
			const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
			const countResult = await queryRunner.query(countQuery);
			const totalRows = Number.parseInt(countResult[0].count, 10);

			const dataQuery = `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`;
			const data = await queryRunner.query(dataQuery);

			return {
				tableName,
				data,
				totalRows,
				returnedRows: data.length,
			};
		} finally {
			await queryRunner.release();
		}
	}

	private getMemoryStorageTableData(
		tableName: string,
		_limit: number,
		_offset: number,
	): TableDataResponse {
		return {
			tableName,
			data: [],
			totalRows: 0,
			returnedRows: 0,
		};
	}

	private async extractTables(): Promise<TableInfo[]> {
		const databaseType = this.dataSource.options.type;

		if (databaseType === "sqlite") {
			return this.extractSqliteTables();
		} else if (databaseType === "postgres") {
			return this.extractPostgresTables();
		}

		throw new Error(`Неподдерживаемый тип базы данных: ${databaseType}`);
	}

	private async extractSqliteTables(): Promise<TableInfo[]> {
		const queryRunner = this.dataSource.createQueryRunner();

		try {
			const tablesQuery = `
				SELECT name FROM sqlite_master 
				WHERE type='table' AND name NOT LIKE 'sqlite_%'
			`;
			const tableNames = await queryRunner.query(tablesQuery);

			const tables: TableInfo[] = [];

			for (const { name: tableName } of tableNames) {
				const columns = await this.extractSqliteColumns(tableName, queryRunner);
				const foreignKeys = await this.extractSqliteForeignKeys(
					tableName,
					queryRunner,
				);
				const rowCount = await this.getTableRowCount(tableName, queryRunner);

				tables.push({
					name: tableName,
					columns,
					foreignKeys,
					rowCount,
				});
			}

			return tables;
		} finally {
			await queryRunner.release();
		}
	}

	private async extractPostgresTables(): Promise<TableInfo[]> {
		const queryRunner = this.dataSource.createQueryRunner();

		try {
			const tablesQuery = `
				SELECT table_name 
				FROM information_schema.tables 
				WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
			`;
			const tableNames = await queryRunner.query(tablesQuery);

			const tables: TableInfo[] = [];

			for (const { table_name: tableName } of tableNames) {
				const columns = await this.extractPostgresColumns(
					tableName,
					queryRunner,
				);
				const foreignKeys = await this.extractPostgresForeignKeys(
					tableName,
					queryRunner,
				);
				const rowCount = await this.getTableRowCount(tableName, queryRunner);

				tables.push({
					name: tableName,
					columns,
					foreignKeys,
					rowCount,
				});
			}

			return tables;
		} finally {
			await queryRunner.release();
		}
	}

	private async extractSqliteColumns(
		tableName: string,
		queryRunner: any,
	): Promise<ColumnInfo[]> {
		const columnsQuery = `PRAGMA table_info("${tableName}")`;
		const columnsInfo = await queryRunner.query(columnsQuery);

		return columnsInfo.map((col: any) => ({
			name: col.name,
			type: col.type,
			primaryKey: col.pk === 1,
			nullable: col.notnull === 0,
			defaultValue: col.dflt_value,
		}));
	}

	private async extractPostgresColumns(
		tableName: string,
		queryRunner: any,
	): Promise<ColumnInfo[]> {
		const columnsQuery = `
			SELECT 
				c.column_name,
				c.data_type,
				c.is_nullable,
				c.column_default,
				CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
			FROM information_schema.columns c
			LEFT JOIN (
				SELECT ku.column_name
				FROM information_schema.table_constraints tc
				JOIN information_schema.key_column_usage ku
					ON tc.constraint_name = ku.constraint_name
				WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
			) pk ON c.column_name = pk.column_name
			WHERE c.table_name = $1
			ORDER BY c.ordinal_position
		`;
		const columnsInfo = await queryRunner.query(columnsQuery, [tableName]);

		return columnsInfo.map((col: any) => ({
			name: col.column_name,
			type: col.data_type,
			primaryKey: col.is_primary_key,
			nullable: col.is_nullable === "YES",
			defaultValue: col.column_default,
		}));
	}

	private async extractSqliteForeignKeys(
		tableName: string,
		queryRunner: any,
	): Promise<ForeignKeyInfo[]> {
		const foreignKeysQuery = `PRAGMA foreign_key_list("${tableName}")`;
		const foreignKeysInfo = await queryRunner.query(foreignKeysQuery);

		return foreignKeysInfo.map((fk: any) => ({
			column: fk.from,
			references: `${fk.table}.${fk.to}`,
			onUpdate: fk.on_update,
			onDelete: fk.on_delete,
		}));
	}

	private async extractPostgresForeignKeys(
		tableName: string,
		queryRunner: any,
	): Promise<ForeignKeyInfo[]> {
		const foreignKeysQuery = `
			SELECT
				kcu.column_name,
				ccu.table_name AS foreign_table_name,
				ccu.column_name AS foreign_column_name,
				rc.update_rule,
				rc.delete_rule
			FROM information_schema.table_constraints AS tc
			JOIN information_schema.key_column_usage AS kcu
				ON tc.constraint_name = kcu.constraint_name
			JOIN information_schema.constraint_column_usage AS ccu
				ON ccu.constraint_name = tc.constraint_name
			JOIN information_schema.referential_constraints AS rc
				ON tc.constraint_name = rc.constraint_name
			WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
		`;
		const foreignKeysInfo = await queryRunner.query(foreignKeysQuery, [
			tableName,
		]);

		return foreignKeysInfo.map((fk: any) => ({
			column: fk.column_name,
			references: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
			onUpdate: fk.update_rule,
			onDelete: fk.delete_rule,
		}));
	}

	private async getTableRowCount(
		tableName: string,
		queryRunner: any,
	): Promise<number> {
		const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
		const result = await queryRunner.query(countQuery);
		return Number.parseInt(result[0].count, 10);
	}

	private getDatabaseName(): string {
		const options = this.dataSource.options;

		if (options.type === "sqlite") {
			return (options as any).database || "sqlite";
		} else if (options.type === "postgres") {
			return (options as any).database || "postgres";
		}

		return "unknown";
	}
}
