import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "./jsonDataApi";

export const CURRENT_JSON_DATA_QUERY_KEY = ["jsonData", "current"] as const;

export const useCurrentJsonData = (): UseQueryResult<JsonDataItem, Error> => {
	return useQuery({
		queryKey: CURRENT_JSON_DATA_QUERY_KEY,
		queryFn: jsonDataService.getCurrent,
		staleTime: 5 * 60 * 1000,
	});
};
