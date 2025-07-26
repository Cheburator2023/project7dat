import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "./api-client";
import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListInput,
} from "../schemas/json-data.schema";

const apiClient = createApiClient();

export const useCreateJsonData = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateJsonDataInput) => apiClient.jsonData.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["jsonData"] });
		},
	});
};

export const useJsonDataList = (params: GetJsonDataListInput) => {
	return useQuery({
		queryKey: ["jsonData", "list", params],
		queryFn: () => apiClient.jsonData.list(params),
	});
};

export const useJsonData = (id: string) => {
	return useQuery({
		queryKey: ["jsonData", id],
		queryFn: () => apiClient.jsonData.getById(id),
		enabled: !!id,
	});
};

export const useUpdateJsonData = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateJsonDataInput }) =>
			apiClient.jsonData.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["jsonData"] });
			queryClient.invalidateQueries({ queryKey: ["jsonData", id] });
		},
	});
};

export const useDeleteJsonData = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => apiClient.jsonData.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["jsonData"] });
		},
	});
};
