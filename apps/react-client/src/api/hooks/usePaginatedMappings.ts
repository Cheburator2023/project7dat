import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jsonDataService, type PaginatedMappingsResponse } from "./jsonDataApi";

export const PAGINATED_MAPPINGS_QUERY_KEY = [
	"dataLineage",
	"paginatedMappings",
] as const;

export const usePaginatedMappings = (params: {
	page: number;
	limit: number;
	search?: string;
	enabled?: boolean;
}) => {
	return useQuery<PaginatedMappingsResponse, Error>({
		queryKey: [
			...PAGINATED_MAPPINGS_QUERY_KEY,
			params.page,
			params.limit,
			params.search ?? "",
		],
		queryFn: () =>
			jsonDataService.getPaginatedMappings({
				page: params.page,
				limit: params.limit,
				search: params.search,
			}),
		placeholderData: keepPreviousData,
		staleTime: 30 * 1000,
		enabled: params.enabled ?? true,
	});
};
