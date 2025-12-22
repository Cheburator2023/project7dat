import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	snapshotService,
	type ApplySnapshotRequest,
} from "../api/hooks/snapshotApi";
import { useDataLineageStore } from "../stores/dataLineageStore";

export const useApplySnapshot = () => {
	const queryClient = useQueryClient();
	const { loadGraphFromApi } = useDataLineageStore();

	return useMutation({
		mutationFn: (data: ApplySnapshotRequest) => snapshotService.apply(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["snapshots"] });
			queryClient.invalidateQueries({ queryKey: ["commits"] });
			loadGraphFromApi();
		},
		onError: (error) => {
			console.error("Ошибка при применении снепшота:", error);
		},
	});
};
