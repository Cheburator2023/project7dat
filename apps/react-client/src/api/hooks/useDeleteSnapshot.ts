import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { snapshotService } from "../snapshotApi";
import { SNAPSHOT_LIST_QUERY_KEY } from "./useSnapshotList";

export const useDeleteSnapshot = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: snapshotService.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SNAPSHOT_LIST_QUERY_KEY });
		},
	});
};
