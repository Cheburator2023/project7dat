import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "../api-client";
import { GetJsonDataListInput } from "../../modules/json-data/schemas/json-data.schema";

const apiClient = createApiClient();

export const useJsonDataList = (params: GetJsonDataListInput) => {
	return useQuery({
		queryKey: ["jsonData", "list", params],
		queryFn: () => apiClient.jsonData.list(params),
	});
};
