import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	jsonDataService,
	type CurrentDataLineageResponse,
} from "./jsonDataApi";

export const CURRENT_DATA_LINEAGE_SNAPSHOT_QUERY_KEY = [
	"dataLineage",
	"currentSnapshot",
] as const;

export const useCurrentDataLineageWholeData = (options?: {
	enabled?: boolean;
}): UseQueryResult<CurrentDataLineageResponse, Error> => {
	return useQuery({
		queryKey: CURRENT_DATA_LINEAGE_SNAPSHOT_QUERY_KEY,
		queryFn: jsonDataService.getCurrentGraph,
		staleTime: 0,
		enabled: options?.enabled ?? true,
	});
};
