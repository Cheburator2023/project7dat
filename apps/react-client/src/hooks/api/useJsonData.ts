import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import {
	jsonDataService,
	type CreateJsonDataRequest,
	type JsonDataItem,
	type UpdateJsonDataRequest,
} from "../../api/jsonDataApi";

export const JSON_DATA_QUERY_KEYS = {
	all: ["jsonData"] as const,
	lists: () => [...JSON_DATA_QUERY_KEYS.all, "list"] as const,
	list: (filters?: Record<string, any>) =>
		[...JSON_DATA_QUERY_KEYS.lists(), { filters }] as const,
	details: () => [...JSON_DATA_QUERY_KEYS.all, "detail"] as const,
	detail: (id: string) => [...JSON_DATA_QUERY_KEYS.details(), id] as const,
};

export const useJsonDataList = (): UseQueryResult<JsonDataItem[], Error> => {
	return useQuery({
		queryKey: JSON_DATA_QUERY_KEYS.list(),
		queryFn: jsonDataService.getAll,
		staleTime: 5 * 60 * 1000,
	});
};

export const useJsonDataItem = (
	id: string,
	enabled = true,
): UseQueryResult<JsonDataItem, Error> => {
	return useQuery({
		queryKey: JSON_DATA_QUERY_KEYS.detail(id),
		queryFn: () => jsonDataService.getById(id),
		enabled: enabled && Boolean(id),
		staleTime: 5 * 60 * 1000,
	});
};

export const useCreateJsonData = (): UseMutationResult<
	JsonDataItem,
	Error,
	CreateJsonDataRequest
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.create,
		onSuccess: (newItem) => {
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_QUERY_KEYS.list(),
				(old) => (old ? [...old, newItem] : [newItem]),
			);
			queryClient.invalidateQueries({
				queryKey: JSON_DATA_QUERY_KEYS.lists(),
			});
		},
	});
};

export const useUpdateJsonData = (): UseMutationResult<
	JsonDataItem,
	Error,
	{ id: string; data: UpdateJsonDataRequest }
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }) => jsonDataService.update(id, data),
		onSuccess: (updatedItem) => {
			queryClient.setQueryData(
				JSON_DATA_QUERY_KEYS.detail(updatedItem.id),
				updatedItem,
			);
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_QUERY_KEYS.list(),
				(old) =>
					old?.map((item) =>
						item.id === updatedItem.id ? updatedItem : item,
					) || [],
			);
			queryClient.invalidateQueries({
				queryKey: JSON_DATA_QUERY_KEYS.lists(),
			});
		},
	});
};

export const useDeleteJsonData = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: jsonDataService.delete,
		onSuccess: (_, deletedId) => {
			queryClient.removeQueries({
				queryKey: JSON_DATA_QUERY_KEYS.detail(deletedId),
			});
			queryClient.setQueryData<JsonDataItem[]>(
				JSON_DATA_QUERY_KEYS.list(),
				(old) => old?.filter((item) => item.id !== deletedId) || [],
			);
			queryClient.invalidateQueries({
				queryKey: JSON_DATA_QUERY_KEYS.lists(),
			});
		},
	});
};
