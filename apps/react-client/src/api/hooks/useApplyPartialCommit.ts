import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jsonCommitService } from "./jsonCommitApi";
import { COMMIT_QUEUE_QUERY_KEY } from "./useCommitQueue";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export interface ApplyPartialCommitVariables {
	commitId: string;
	selectedEntityIds: string[];
}

export const useApplyPartialCommit = () => {
	const queryClient = useQueryClient();
	const loadGraphFromApi = useDataLineageStore(
		(state) => state.loadGraphFromApi,
	);

	return useMutation({
		mutationFn: (variables: ApplyPartialCommitVariables) =>
			jsonCommitService.applyPartialCommit({
				id: variables.commitId,
				selectedEntityIds: variables.selectedEntityIds,
			}),
		onSuccess: async () => {
			// Обновляем очередь коммитов и списки моделей данных
			queryClient.invalidateQueries({ queryKey: COMMIT_QUEUE_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });

			await loadGraphFromApi();
		},
		onError: (error) => {
			console.error("Ошибка при частичном применении коммита:", error);
		},
	});
};
