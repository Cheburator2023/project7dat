import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	jsonDataService,
	type UpdateJsonDataRequest,
	type JsonDataItem,
} from "../jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";

export const useUpdateJsonData = (): UseMutationResult<
	JsonDataItem,
	Error,
	{ id: string; data: UpdateJsonDataRequest }
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }) => jsonDataService.update(id, data),
		onSuccess: (updatedItem) => {
			queryClient.setQueryData(["jsonData", updatedItem.id], updatedItem);
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_LIST_QUERY_KEY,
				(old) =>
					old?.map((item) =>
						item.id === updatedItem.id ? updatedItem : item,
					) || [],
			);
			queryClient.invalidateQueries({
				queryKey: ["jsonData"],
			});
		},
	});
};
