import { useMutation } from "@tanstack/react-query";
import { mergeService, type ConfirmMergeResponse } from "./mergeApi";

export const useMergeConfirm = () => {
	return useMutation<
		ConfirmMergeResponse,
		Error,
		{ commitId: string; user?: string }
	>({
		mutationFn: ({ commitId, user }) => mergeService.confirm(commitId, user),
	});
};
