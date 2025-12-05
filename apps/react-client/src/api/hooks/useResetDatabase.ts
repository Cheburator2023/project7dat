import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { jsonDataService } from "./jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { SNAPSHOT_LIST_QUERY_KEY } from "./useSnapshotList";

export interface ResetDatabaseResult {
	success: boolean;
	message: string;
	deletedJsonData: number;
	deletedCommits: number;
	deletedSnapshots: number;
	changelogCleared: boolean;
}

export const useResetDatabase = (): UseMutationResult<
	ResetDatabaseResult,
	Error,
	void
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.resetDatabase,
		onSuccess: () => {
			// Инвалидируем все связанные кэши
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: SNAPSHOT_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["jsonData"] });
			queryClient.invalidateQueries({ queryKey: ["commits"] });
			queryClient.invalidateQueries({ queryKey: ["changelog"] });
		},
	});
};
