import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { jsonDataService, type CumulativeCommitData } from "../jsonDataApi";

export const useCumulativeCommitData = (
	commitId: string,
	options?: {
		enabled?: boolean;
	},
): UseQueryResult<CumulativeCommitData, Error> => {
	return useQuery({
		queryKey: ["jsonData", "cumulativeCommitData", commitId],
		queryFn: () => jsonDataService.getCumulativeDataAtCommit(commitId),
		staleTime: 0,
		enabled: options?.enabled ?? Boolean(commitId),
	});
};
