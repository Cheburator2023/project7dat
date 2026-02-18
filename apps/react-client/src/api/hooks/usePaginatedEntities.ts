import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jsonDataService, type PaginatedEntitiesResponse } from "./jsonDataApi";

export const PAGINATED_ENTITIES_QUERY_KEY = [
	"dataLineage",
	"paginatedEntities",
] as const;

export const usePaginatedEntities = (params: {
	page: number;
	limit: number;
	search?: string;
	type?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	enabled?: boolean;
}) => {
	return useQuery<PaginatedEntitiesResponse, Error>({
		queryKey: [
			...PAGINATED_ENTITIES_QUERY_KEY,
			params.page,
			params.limit,
			params.search ?? "",
			params.type ?? "",
			params.sortBy ?? "",
			params.sortOrder ?? "",
		],
		queryFn: () =>
			jsonDataService.getPaginatedEntities({
				page: params.page,
				limit: params.limit,
				search: params.search,
				type: params.type,
				sortBy: params.sortBy,
				sortOrder: params.sortOrder,
			}),
		placeholderData: keepPreviousData,
		staleTime: 0,
		enabled: params.enabled ?? true,
	});
};
