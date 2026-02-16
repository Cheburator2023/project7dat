import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { changelogApi, type ReleaseNotesResponse } from "./changelogApi";

export const RELEASE_NOTES_QUERY_KEY = ["changelog", "release-notes"] as const;

export const useReleaseNotes = (params?: {
	enabled?: boolean;
}): UseQueryResult<ReleaseNotesResponse, Error> => {
	return useQuery({
		queryKey: RELEASE_NOTES_QUERY_KEY,
		queryFn: changelogApi.getReleaseNotes,
		staleTime: 5 * 60 * 1000,
		enabled: params?.enabled !== false,
	});
};
