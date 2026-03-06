import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mergeService, type ConfirmMergeResponse } from "./mergeApi";
import { S2T_COMMIT_LIST_QUERY_KEY } from "./useS2tCommitList";
import { S2T_COMMIT_BY_ID_QUERY_KEY } from "./useS2tCommitById";

export const useMergeConfirm = () => {
	const queryClient = useQueryClient();

	return useMutation<
		ConfirmMergeResponse,
		Error,
		{ commitId: string; user?: string }
	>({
		mutationFn: ({ commitId, user }) => mergeService.confirm(commitId, user),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: S2T_COMMIT_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY] });
		},
	});
};
