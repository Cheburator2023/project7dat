import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "../jsonDataApi";

export const useJsonData = (
	id: string,
	enabled = true,
): UseQueryResult<JsonDataItem, Error> => {
	return useQuery({
		queryKey: ["jsonData", id],
		queryFn: () => jsonDataService.getById(id),
		enabled: enabled && Boolean(id),
		staleTime: 5 * 60 * 1000,
	});
};
