import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { jsonDataService, type JsonDataItem } from "../jsonDataApi";
import { JSON_DATA_LIST_QUERY_KEY } from "./useJsonDataList";

export const useDeleteJsonData = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.delete,
		onSuccess: (_, deletedId) => {
			queryClient.removeQueries({
				queryKey: ["jsonData", deletedId],
			});
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_LIST_QUERY_KEY,
				(old) => old?.filter((item) => item.id !== deletedId) || [],
			);
			queryClient.invalidateQueries({
				queryKey: ["jsonData"],
			});
		},
	});
};
