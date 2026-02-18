import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	s2tCommitStoreService,
	type S2tCommitListResponse,
} from "./s2tCommitStoreApi";

export const S2T_COMMIT_LIST_QUERY_KEY = ["s2tCommits", "list"] as const;

export const useS2tCommitList = (params?: {
	state?: string;
	type?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	enabled?: boolean;
}): UseQueryResult<S2tCommitListResponse, Error> => {
	const { enabled = true, ...requestParams } = params ?? {};

	return useQuery({
		queryKey: [...S2T_COMMIT_LIST_QUERY_KEY, requestParams],
		queryFn: () => s2tCommitStoreService.list(requestParams),
		staleTime: 0,
		enabled,
	});
};
