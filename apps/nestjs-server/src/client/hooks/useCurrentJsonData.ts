import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "../api-client";

const apiClient = createApiClient();

export const useCurrentJsonData = () => {
	return useQuery({
		queryKey: ["jsonData", "current"],
		queryFn: () => apiClient.jsonData.getCurrent(),
	});
};
