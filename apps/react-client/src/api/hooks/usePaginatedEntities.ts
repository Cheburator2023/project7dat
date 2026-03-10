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
	types?: string[];
	namespaces?: string[];
	modifiedOnly?: boolean;
	hasUpstream?: "any" | "yes" | "no";
	hasDownstream?: "any" | "yes" | "no";
	attrCountMin?: string;
	attrCountMax?: string;
	hideTempTables?: boolean;
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
			params.types?.join(",") ?? "",
			params.namespaces?.join(",") ?? "",
			params.modifiedOnly ?? "",
			params.hasUpstream ?? "",
			params.hasDownstream ?? "",
			params.attrCountMin ?? "",
			params.attrCountMax ?? "",
			params.hideTempTables ?? "",
			params.sortBy ?? "",
			params.sortOrder ?? "",
		],
		queryFn: () =>
			jsonDataService.getPaginatedEntities({
				page: params.page,
				limit: params.limit,
				search: params.search,
				type: params.type,
				types: params.types,
				namespaces: params.namespaces,
				modifiedOnly: params.modifiedOnly,
				hasUpstream: params.hasUpstream,
				hasDownstream: params.hasDownstream,
				attrCountMin: params.attrCountMin,
				attrCountMax: params.attrCountMax,
				hideTempTables: params.hideTempTables,
				sortBy: params.sortBy,
				sortOrder: params.sortOrder,
			}),
		placeholderData: keepPreviousData,
		staleTime: 0,
		enabled: params.enabled ?? true,
	});
};
