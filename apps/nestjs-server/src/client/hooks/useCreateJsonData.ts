import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "../api-client";
import { CreateJsonDataInput } from "../../modules/json-data/schemas/json-data.schema";

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
