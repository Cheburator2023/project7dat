import { useQuery } from "@tanstack/react-query";

export const MAX_DEPTH_QUERY_KEY = ["dataLineage", "maxDepth"] as const;
const FRONTEND_DEPTH_MAX = 100;

export const useMaxDepth = (params: {
	entityId: string;
	enabled?: boolean;
}) => {
	return useQuery<{ maxDepth: number }, Error>({
		queryKey: [...MAX_DEPTH_QUERY_KEY, params.entityId],
		queryFn: async () => ({ maxDepth: FRONTEND_DEPTH_MAX }),
		staleTime: 60 * 1000,
		enabled: (params.enabled ?? true) && !!params.entityId,
	});
};
