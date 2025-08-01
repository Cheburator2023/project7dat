import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "../api-client";
import { UpdateJsonDataInput } from "../../modules/json-data/schemas/json-data.schema";

const apiClient = createApiClient();

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
