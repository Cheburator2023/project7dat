import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type PaginatedMappingsResponse } from "./jsonDataApi";

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
		queryFn: async () => {
			return {
				mappings: [],
				total: 0,
				page: params.page,
				limit: params.limit,
				totalPages: 1,
				desc: { change_date: "" },
			};
		},
		placeholderData: keepPreviousData,
		staleTime: 0,
		enabled: params.enabled ?? true,
	});
};
