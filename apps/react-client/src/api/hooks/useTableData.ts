import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	databaseSchemaService,
	type TableDataResponse,
} from "../databaseSchemaApi";

export const useTableData = (
	tableName: string,
	params?: {
		limit?: number;
		offset?: number;
		enabled?: boolean;
	},
): UseQueryResult<TableDataResponse, Error> => {
	return useQuery({
		queryKey: ["database", "table", tableName, params?.limit, params?.offset],
		queryFn: () =>
			databaseSchemaService.getTableData(tableName, {
				limit: params?.limit,
				offset: params?.offset,
			}),
		enabled: params?.enabled !== false && !!tableName,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};
