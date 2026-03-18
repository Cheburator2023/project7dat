import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitService } from "./jsonCommitApi";
import type { CommitQueueApiItem } from "./jsonDataApi";

export const COMMIT_QUEUE_QUERY_KEY = ["jsonData", "commitQueue"] as const;

export const useCommitQueue = (options?: {
	enabled?: boolean;
}): UseQueryResult<CommitQueueApiItem[], Error> => {
	return useQuery({
		queryKey: COMMIT_QUEUE_QUERY_KEY,
		queryFn: () => jsonCommitService.getCommitQueue(),
		staleTime: 0,
		enabled: options?.enabled ?? true,
	});
};
