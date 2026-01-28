import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { s2tCommitStoreService, type S2tCommitItem } from "./s2tCommitStoreApi";

export const S2T_COMMIT_LIST_QUERY_KEY = ["s2tCommits", "list"] as const;

export const useS2tCommitList = (params?: {
	state?: string;
	type?: string;
	enabled?: boolean;
}): UseQueryResult<S2tCommitItem[], Error> => {
	return useQuery({
		queryKey: [...S2T_COMMIT_LIST_QUERY_KEY, params],
		queryFn: () => s2tCommitStoreService.list(params),
		staleTime: 30_000,
		enabled: params?.enabled !== false,
	});
};
