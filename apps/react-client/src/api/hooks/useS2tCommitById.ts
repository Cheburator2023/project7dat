import { useQuery } from "@tanstack/react-query";
import { s2tCommitStoreService, type S2tCommitItem } from "./s2tCommitStoreApi";

export const S2T_COMMIT_BY_ID_QUERY_KEY = "s2tCommitStore.commitById";

interface UseS2tCommitByIdOptions {
	enabled?: boolean;
}

export const useS2tCommitById = (
	commitId: string | null,
	options: UseS2tCommitByIdOptions = {},
) => {
	const { enabled = true } = options;

	return useQuery<S2tCommitItem, Error>({
		queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY, commitId],
		queryFn: () => s2tCommitStoreService.getById(commitId!),
		enabled: enabled && Boolean(commitId),
		staleTime: 0,
	});
};
