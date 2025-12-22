import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	jsonDataService,
	type CreateJsonDataRequest,
	type JsonDataItem,
} from "./jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";

export const useInitializeJsonGraph = (): UseMutationResult<
	JsonDataItem,
	Error,
	CreateJsonDataRequest
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.initializeGraph,
		onSuccess: (newItem) => {
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_LIST_QUERY_KEY,
				(old) => (old ? [...old, newItem] : [newItem]),
			);
			queryClient.invalidateQueries({
				queryKey: ["jsonData"],
			});
		},
	});
};
