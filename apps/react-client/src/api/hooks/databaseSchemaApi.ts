import axios from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

export const databaseSchemaApi = axios.create({
	baseURL: `${API_BASE_URL}/api/database-schema`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface ColumnInfo {
	name: string;
	type: string;
	primaryKey: boolean;
	nullable: boolean;
	defaultValue?: string;
	autoIncrement?: boolean;
}

export interface ForeignKeyInfo {
	column: string;
	references: string;
	onUpdate?: string;
	onDelete?: string;
}

export interface TableInfo {
	name: string;
	columns: ColumnInfo[];
	foreignKeys: ForeignKeyInfo[];
	rowCount: number;
	tableSize?: number;
}

export interface DatabaseSchemaResponse {
	tables: TableInfo[];
	databaseType: string;
	databaseName: string;
	totalTables: number;
}

export interface TableDataResponse {
	tableName: string;
	data: Record<string, any>[];
	totalRows: number;
	returnedRows: number;
}

export const databaseSchemaService = {
	getSchema: (): Promise<DatabaseSchemaResponse> =>
		databaseSchemaApi.get("").then((response) => response.data),

	getTableData: (
		tableName: string,
		params?: {
			limit?: number;
			offset?: number;
		},
	): Promise<TableDataResponse> => {
		const searchParams = new URLSearchParams();
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.offset) searchParams.append("offset", params.offset.toString());

		const url = `/tables/${tableName}/data${searchParams.toString() ? `?${searchParams}` : ""}`;
		return databaseSchemaApi.get(url).then((response) => response.data);
	},
};
