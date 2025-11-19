import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import type { CommitListResponse } from "../jsonDataApi";

export const useAllCommitsFromAllGraphsV2 = (params?: {
	page?: number;
	limit?: number;
	dateFrom?: string;
	dateTo?: string;
	user?: string;
	query?: string;
	enabled?: boolean;
}): UseQueryResult<CommitListResponse, Error> => {
	return useQuery({
		queryKey: ["jsonData", "allCommitsFromAllGraphsV2", params],
		queryFn: () => jsonCommitV2Service.getAllCommitsFromAllGraphs(params),
		enabled: params?.enabled !== false,
	});
};
