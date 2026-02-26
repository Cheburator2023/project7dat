import { useQuery } from "@tanstack/react-query";
import {
	jsonDataService,
	type PaginatedEntityRelationsResponse,
} from "./jsonDataApi";

export const PAGINATED_ENTITY_RELATIONS_QUERY_KEY = [
	"dataLineage",
	"paginatedEntityRelations",
] as const;

export const usePaginatedEntityRelations = (params: {
	entityId: string;
	page: number;
	limit: number;
	enabled?: boolean;
	hideTempTables?: boolean;
}) => {
	return useQuery<PaginatedEntityRelationsResponse, Error>({
		queryKey: [
			...PAGINATED_ENTITY_RELATIONS_QUERY_KEY,
			params.entityId,
			params.page,
			params.limit,
			params.hideTempTables ?? true,
		],
		queryFn: () =>
			jsonDataService.getPaginatedEntityRelations({
				entityId: params.entityId,
				page: params.page,
				limit: params.limit,
				hideTempTables: params.hideTempTables ?? true,
			}),
		staleTime: 0,
		enabled: (params.enabled ?? true) && !!params.entityId,
	});
};
