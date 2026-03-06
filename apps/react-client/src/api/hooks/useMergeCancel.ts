import { useMutation } from "@tanstack/react-query";
import { mergeService, type CancelMergeResponse } from "./mergeApi";

export const useMergeCancel = () => {
	return useMutation<CancelMergeResponse, Error, string>({
		mutationFn: (commitId: string) => mergeService.cancel(commitId),
	});
};
