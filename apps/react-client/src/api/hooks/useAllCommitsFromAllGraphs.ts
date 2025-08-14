import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataService, type CommitListResponse } from "../jsonDataApi";

export const useAllCommitsFromAllGraphs = (params?: {
	page?: number;
	limit?: number;
	dateFrom?: string;
	dateTo?: string;
	user?: string;
	query?: string;
	enabled?: boolean;
}): UseQueryResult<CommitListResponse, Error> => {
	return useQuery({
		queryKey: ["jsonData", "allCommitsFromAllGraphs", params],
		queryFn: () => jsonDataService.getAllCommitsFromAllGraphs(params),
		enabled: params?.enabled !== false,
	});
};
