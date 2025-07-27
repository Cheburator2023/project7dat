import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "../api-client";

const apiClient = createApiClient();

export const useJsonData = (id: string) => {
	return useQuery({
		queryKey: ["jsonData", id],
		queryFn: () => apiClient.jsonData.getById(id),
		enabled: !!id,
	});
};
