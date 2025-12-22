import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { snapshotService, type SnapshotListResponse } from "./snapshotApi";

export const SNAPSHOT_LIST_QUERY_KEY = ["snapshots", "list"] as const;

export const useSnapshotList = (params?: {
	page?: number;
	limit?: number;
	graphId?: string;
	enabled?: boolean;
}): UseQueryResult<SnapshotListResponse, Error> => {
	return useQuery({
		queryKey: [...SNAPSHOT_LIST_QUERY_KEY, params],
		queryFn: () => snapshotService.getAll(params),
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled !== false,
	});
};
