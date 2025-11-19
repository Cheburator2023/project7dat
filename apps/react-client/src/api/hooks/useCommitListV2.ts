import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import type { CommitListResponse } from "../jsonDataApi";

export const useCommitListV2 = (params?: {
	page?: number;
	limit?: number;
	graphId?: string;
	enabled?: boolean;
}): UseQueryResult<CommitListResponse, Error> => {
	return useQuery({
		queryKey: ["jsonData", "commitListV2", params],
		queryFn: () => jsonCommitV2Service.getCommits(params),
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled ?? Boolean(params?.graphId),
	});
};
