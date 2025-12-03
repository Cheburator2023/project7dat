import { useQuery } from "@tanstack/react-query";
import { jsonDataService, type JsonCommitItem } from "./jsonDataApi";

export const COMMIT_BY_ID_QUERY_KEY = "jsonData.commitById";

interface UseCommitByIdOptions {
	enabled?: boolean;
}

/**
 * Хук для получения коммита по ID
 */
export const useCommitById = (
	commitId: string,
	options: UseCommitByIdOptions = {},
) => {
	const { enabled = true } = options;

	return useQuery<JsonCommitItem, Error>({
		queryKey: [COMMIT_BY_ID_QUERY_KEY, commitId],
		queryFn: () => jsonDataService.getCommitById(commitId),
		enabled: enabled && Boolean(commitId),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
