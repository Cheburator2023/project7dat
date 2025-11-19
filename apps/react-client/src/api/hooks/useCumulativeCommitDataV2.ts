import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import type { CumulativeCommitData } from "../jsonDataApi";

export const useCumulativeCommitDataV2 = (
	commitId: string,
	options?: {
		enabled?: boolean;
	},
): UseQueryResult<CumulativeCommitData, Error> => {
	return useQuery({
		queryKey: ["jsonData", "cumulativeCommitDataV2", commitId],
		queryFn: () => jsonCommitV2Service.getCumulativeDataAtCommit(commitId),
		staleTime: 0,
		enabled: options?.enabled ?? Boolean(commitId),
	});
};
