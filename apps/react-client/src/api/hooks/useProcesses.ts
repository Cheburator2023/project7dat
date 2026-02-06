import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { processesService, type ProcessItem } from "./processesApi";

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

export const PROCESS_WITH_DESC_QUERY_KEY = [
	"processes",
	"withDescriptions",
] as const;

export const useProcessesWithDescriptions = (params?: {
	enabled?: boolean;
}): UseQueryResult<ProcessItem[], Error> => {
	return useQuery({
		queryKey: PROCESS_WITH_DESC_QUERY_KEY,
		queryFn: processesService.getAllWithDescriptions,
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled !== false,
	});
};
