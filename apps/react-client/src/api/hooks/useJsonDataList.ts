import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataListService, type JsonDataItem } from "./jsonDataListApi";

export const JSON_DATA_LIST_QUERY_KEY = ["jsonData", "list"] as const;

export const useJsonDataList = (): UseQueryResult<JsonDataItem[], Error> => {
	return useQuery({
		queryKey: JSON_DATA_LIST_QUERY_KEY,
		queryFn: jsonDataListService.getAll,
		staleTime: 5 * 60 * 1000,
	});
};
