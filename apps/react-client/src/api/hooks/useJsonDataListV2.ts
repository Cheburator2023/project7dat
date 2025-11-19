import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataV2Service, type JsonDataItem } from "../jsonDataV2Api";

export const JSON_DATA_V2_LIST_QUERY_KEY = ["jsonData", "list", "v2"] as const;

export const useJsonDataListV2 = (): UseQueryResult<JsonDataItem[], Error> => {
	return useQuery({
		queryKey: JSON_DATA_V2_LIST_QUERY_KEY,
		queryFn: jsonDataV2Service.getAll,
		staleTime: 5 * 60 * 1000,
	});
};
