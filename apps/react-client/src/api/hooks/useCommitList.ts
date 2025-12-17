import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitService } from "./jsonCommitApi";
import type { CommitListResponse } from "./jsonDataApi";

export const useCommitList = (params?: {
	page?: number;
	limit?: number;
	graphId?: string;
	enabled?: boolean;
}): UseQueryResult<CommitListResponse, Error> => {
	return useQuery({
		queryKey: ["jsonData", "commitList", params],
		queryFn: () => jsonCommitService.getCommits(params),
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled ?? Boolean(params?.graphId),
	});
};
