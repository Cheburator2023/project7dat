import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	s2tCommitStoreService,
	type ApplyS2tCommitPayload,
} from "./s2tCommitStoreApi";
import { S2T_COMMIT_LIST_QUERY_KEY } from "./useS2tCommitList";
import { S2T_COMMIT_BY_ID_QUERY_KEY } from "./useS2tCommitById";
import { PAGINATED_ENTITIES_QUERY_KEY } from "./usePaginatedEntities";
import { PAGINATED_MAPPINGS_QUERY_KEY } from "./usePaginatedMappings";
import { PAGINATED_ENTITY_RELATIONS_QUERY_KEY } from "./usePaginatedEntityRelations";
import { PAGINATED_MODEL_RELATIONS_QUERY_KEY } from "./usePaginatedModelRelations";

export const useApplyS2tCommit = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: ApplyS2tCommitPayload;
		}) => s2tCommitStoreService.apply(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PAGINATED_ENTITIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: PAGINATED_MAPPINGS_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: PAGINATED_ENTITY_RELATIONS_QUERY_KEY,
			});
			queryClient.invalidateQueries({
				queryKey: PAGINATED_MODEL_RELATIONS_QUERY_KEY,
			});
			queryClient.invalidateQueries({ queryKey: S2T_COMMIT_LIST_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY] });
		},
	});
};
