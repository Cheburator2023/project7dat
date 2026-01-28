import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { processesService } from "./processesApi";

export const PROCESS_LIST_QUERY_KEY = ["processes", "list"] as const;

export const useProcesses = (params?: {
	enabled?: boolean;
}): UseQueryResult<string[], Error> => {
	return useQuery({
		queryKey: PROCESS_LIST_QUERY_KEY,
		queryFn: processesService.getAll,
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled !== false,
	});
};
