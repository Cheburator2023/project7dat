import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { snapshotService } from "../snapshotApi";
import { CURRENT_JSON_DATA_QUERY_KEY } from "./useCurrentJsonData";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";

export const useRestoreSnapshot = (): UseMutationResult<
	void,
	Error,
	string
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: snapshotService.restore,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CURRENT_JSON_DATA_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: JSON_DATA_LIST_QUERY_KEY });
		},
	});
};
