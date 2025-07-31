import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "../jsonDataApi";

export const JSON_DATA_LIST_QUERY_KEY = [
	"jsonData",
	"list",
	"commitList",
] as const;

export const useJsonDataList = (): UseQueryResult<JsonDataItem[], Error> => {
	return useQuery({
		queryKey: JSON_DATA_LIST_QUERY_KEY,
		queryFn: jsonDataService.getAll,
		staleTime: 5 * 60 * 1000,
	});
};
