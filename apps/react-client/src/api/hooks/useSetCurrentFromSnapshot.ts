import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	jsonDataService,
	type SetCurrentFromSnapshotRequest,
} from "../jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export const useSetCurrentFromSnapshot = () => {
	const queryClient = useQueryClient();
	const loadGraphFromApi = useDataLineageStore(
		(state) => state.loadGraphFromApi,
	);

	return useMutation({
		mutationFn: (data: SetCurrentFromSnapshotRequest) =>
			jsonDataService.setCurrentFromSnapshot(data),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });
			await loadGraphFromApi();
		},
	});
};
