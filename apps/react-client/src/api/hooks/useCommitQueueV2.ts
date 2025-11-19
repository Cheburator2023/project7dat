import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import type { CommitQueueApiItem } from "../jsonDataApi";

export const COMMIT_QUEUE_V2_QUERY_KEY = ["jsonData", "commitQueueV2"] as const;

export const useCommitQueueV2 = (options?: {
	enabled?: boolean;
}): UseQueryResult<CommitQueueApiItem[], Error> => {
	return useQuery({
		queryKey: COMMIT_QUEUE_V2_QUERY_KEY,
		queryFn: () => jsonCommitV2Service.getCommitQueue(),
		staleTime: 30_000,
		enabled: options?.enabled ?? true,
	});
};
