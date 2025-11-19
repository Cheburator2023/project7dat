import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jsonDataV2Service } from "../jsonDataV2Api";
import { JSON_DATA_V2_LIST_QUERY_KEY } from "./useJsonDataListV2";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export const useSetCurrentJsonDataV2 = () => {
	const queryClient = useQueryClient();
	const loadGraphFromApi = useDataLineageStore(
		(state) => state.loadGraphFromApi,
	);

	return useMutation({
		mutationFn: (id: string) => jsonDataV2Service.setCurrent(id),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: JSON_DATA_V2_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });
			await loadGraphFromApi();
		},
	});
};
