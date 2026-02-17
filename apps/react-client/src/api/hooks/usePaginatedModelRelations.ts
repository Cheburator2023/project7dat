import { useQuery } from "@tanstack/react-query";
import {
	jsonDataService,
	type PaginatedEntityRelationsResponse,
} from "./jsonDataApi";

export const PAGINATED_MODEL_RELATIONS_QUERY_KEY = [
	"dataLineage",
	"paginatedModelRelations",
] as const;

export const usePaginatedModelRelations = (params: {
	modelId: string;
	page: number;
	limit: number;
	enabled?: boolean;
}) => {
	return useQuery<PaginatedEntityRelationsResponse, Error>({
		queryKey: [
			...PAGINATED_MODEL_RELATIONS_QUERY_KEY,
			params.modelId,
			params.page,
			params.limit,
		],
		queryFn: () =>
			jsonDataService.getPaginatedModelRelations({
				modelId: params.modelId,
				page: params.page,
				limit: params.limit,
			}),
		staleTime: 0,
		enabled: (params.enabled ?? true) && !!params.modelId,
	});
};
