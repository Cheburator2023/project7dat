import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	snapshotService,
	type UpdateSnapshotRequest,
	type SnapshotItem,
} from "./snapshotApi";
import { SNAPSHOT_LIST_QUERY_KEY } from "./useSnapshotList";

export const useUpdateSnapshot = (): UseMutationResult<
	SnapshotItem,
	Error,
	{ id: string; data: UpdateSnapshotRequest }
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }) => snapshotService.update(id, data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: SNAPSHOT_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["snapshots", data.id] });
		},
	});
};
