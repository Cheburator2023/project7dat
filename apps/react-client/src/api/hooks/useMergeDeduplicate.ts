import { useMutation } from "@tanstack/react-query";
import { mergeService, type DeduplicateResponse } from "./mergeApi";

export const useMergeDeduplicate = () => {
	return useMutation<DeduplicateResponse, Error>({
		mutationFn: () => mergeService.deduplicate(),
	});
};
