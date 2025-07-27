import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "../api-client";

const apiClient = createApiClient();

export const useDeleteJsonData = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => apiClient.jsonData.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["jsonData"] });
		},
	});
};
