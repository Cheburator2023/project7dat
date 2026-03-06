import { useMutation } from "@tanstack/react-query";
import { mergeService, type ApplyMergeResponse } from "./mergeApi";

export const useMergeApply = () => {
	return useMutation<ApplyMergeResponse, Error, string>({
		mutationFn: (commitId: string) => mergeService.apply(commitId),
	});
};
