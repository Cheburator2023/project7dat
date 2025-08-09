import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jsonDataService } from "../jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export const useSetCurrentJsonData = () => {
	const queryClient = useQueryClient();
	const loadGraphFromApi = useDataLineageStore(
		(state) => state.loadGraphFromApi,
	);

	return useMutation({
		mutationFn: (id: string) => jsonDataService.setCurrent(id),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });
			await loadGraphFromApi();
		},
	});
};
