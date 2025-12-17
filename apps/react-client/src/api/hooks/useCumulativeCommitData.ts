import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitService } from "./jsonCommitApi";
import type { CumulativeCommitData } from "./jsonDataApi";

export const useCumulativeCommitData = (
	commitId: string,
	options?: {
		enabled?: boolean;
	},
): UseQueryResult<CumulativeCommitData, Error> => {
	return useQuery({
		queryKey: ["jsonData", "cumulativeCommitData", commitId],
		queryFn: () => jsonCommitService.getCumulativeDataAtCommit(commitId),
		staleTime: 0,
		enabled: options?.enabled ?? Boolean(commitId),
	});
};
