import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jsonCommitV2Service } from "../jsonCommitV2Api";
import { COMMIT_QUEUE_V2_QUERY_KEY } from "./useCommitQueueV2";
import { JSON_DATA_V2_LIST_QUERY_KEY } from "./useJsonDataListV2";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export const useApplyCommitV2 = () => {
	const queryClient = useQueryClient();
	const loadGraphFromApi = useDataLineageStore(
		(state) => state.loadGraphFromApi,
	);

	return useMutation({
		mutationFn: (commitId: string) => jsonCommitV2Service.applyCommit(commitId),
		onSuccess: async () => {
			// Обновляем очередь коммитов и списки моделей данных
			queryClient.invalidateQueries({ queryKey: COMMIT_QUEUE_V2_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: JSON_DATA_V2_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });

			await loadGraphFromApi();
		},
		onError: (error) => {
			console.error("Ошибка при применении коммита:", error);
		},
	});
};
