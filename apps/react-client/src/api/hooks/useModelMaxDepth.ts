import { useQuery } from "@tanstack/react-query";

export const MODEL_MAX_DEPTH_QUERY_KEY = [
	"dataLineage",
	"modelMaxDepth",
] as const;
const FRONTEND_DEPTH_MAX = 100;

export const useModelMaxDepth = (params: {
	modelId: string;
	enabled?: boolean;
}) => {
	return useQuery<{ maxDepth: number }, Error>({
		queryKey: [...MODEL_MAX_DEPTH_QUERY_KEY, params.modelId],
		queryFn: async () => ({ maxDepth: FRONTEND_DEPTH_MAX }),
		staleTime: 60 * 1000,
		enabled: (params.enabled ?? true) && !!params.modelId,
	});
};
