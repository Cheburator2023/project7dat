import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import type { CommitListResponse } from "../jsonDataApi";

export const useCommitSearchV2 = (
	graphId: string,
	params?: {
		dateFrom?: string;
		dateTo?: string;
		user?: string;
		query?: string;
		page?: number;
		limit?: number;
		enabled?: boolean;
	},
): UseQueryResult<CommitListResponse, Error> => {
	return useQuery({
		queryKey: ["jsonData", "commitSearchV2", graphId, params],
		queryFn: () => jsonCommitV2Service.searchCommits(graphId, params),
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled ?? Boolean(graphId),
	});
};
