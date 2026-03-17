import { useMutation } from "@tanstack/react-query";
import { mergeService, type DeduplicateResponse } from "./mergeApi";

export const useMergeDeduplicate = () => {
	return useMutation<DeduplicateResponse, Error, string>({
		mutationFn: (commitId: string) => mergeService.deduplicate(commitId),
	});
};
