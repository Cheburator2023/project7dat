import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	snapshotService,
	type CreateSnapshotRequest,
	type SnapshotItem,
} from "./snapshotApi";
import { SNAPSHOT_LIST_QUERY_KEY } from "./useSnapshotList";

export const useCreateSnapshot = (): UseMutationResult<
	SnapshotItem,
	Error,
	CreateSnapshotRequest
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: snapshotService.create,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SNAPSHOT_LIST_QUERY_KEY });
		},
	});
};
