import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitService } from "./jsonCommitApi";
import type { CommitListResponse } from "./jsonDataApi";

export const useCommitSearch = (
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
		queryKey: ["jsonData", "commitSearch", graphId, params],
		queryFn: () => jsonCommitService.searchCommits(graphId, params),
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled ?? Boolean(graphId),
	});
};
