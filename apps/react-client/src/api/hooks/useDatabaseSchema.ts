import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	databaseSchemaService,
	type DatabaseSchemaResponse,
} from "../databaseSchemaApi";

export const DATABASE_SCHEMA_QUERY_KEY = ["database", "schema"] as const;

export const useDatabaseSchema = (): UseQueryResult<
	DatabaseSchemaResponse,
	Error
> => {
	return useQuery({
		queryKey: DATABASE_SCHEMA_QUERY_KEY,
		queryFn: databaseSchemaService.getSchema,
		staleTime: 10 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
	});
};
