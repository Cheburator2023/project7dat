import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { snapshotService, type SnapshotItem } from "./snapshotApi";

export const useSnapshot = (
	id: string,
	enabled = true,
): UseQueryResult<SnapshotItem, Error> => {
	return useQuery({
		queryKey: ["snapshots", id],
		queryFn: () => snapshotService.getById(id),
		staleTime: 5 * 60 * 1000,
		enabled: enabled && !!id,
	});
};
