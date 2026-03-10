import { useEffect, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mergeService, type MergeSessionStatus } from "./mergeApi";
import { useMergingSessionStore } from "@react-client/features/commits/stores/mergingSessionStore";
import { S2T_COMMIT_LIST_QUERY_KEY } from "./useS2tCommitList";
import { S2T_COMMIT_BY_ID_QUERY_KEY } from "./useS2tCommitById";

const POLL_INTERVAL_MS = 6000;
const MERGE_SESSION_POLLING_QUERY_KEY = [
	"merge",
	"session",
	"polling",
] as const;

export const useMergeSessionPolling = () => {
	const { activeSession, setActiveSession, clearSession } =
		useMergingSessionStore();
	const queryClient = useQueryClient();
	const [pollingSessionId, setPollingSessionId] = useState<string | null>(null);

	const stopPolling = useCallback(() => {
		if (pollingSessionId) {
			console.info("[merge-polling] stop", {
				pollingSessionId,
				activeSessionId: activeSession?.mergeSessionId ?? null,
			});
		}
		setPollingSessionId(null);
		queryClient.removeQueries({
			queryKey: [...MERGE_SESSION_POLLING_QUERY_KEY],
		});
	}, [pollingSessionId, activeSession?.mergeSessionId, queryClient]);

	const startPolling = useCallback(
		(mergeSessionId: string) => {
			if (!mergeSessionId) {
				console.warn("[merge-polling] start skipped: empty mergeSessionId");
				return;
			}

			console.info("[merge-polling] start", {
				mergeSessionId,
				activeSessionId: activeSession?.mergeSessionId ?? null,
				activeCommitId: activeSession?.commitId ?? null,
			});
			setPollingSessionId((currentSessionId) =>
				currentSessionId === mergeSessionId ? currentSessionId : mergeSessionId,
			);
		},
		[activeSession?.mergeSessionId, activeSession?.commitId],
	);

	const pollingQuery = useQuery<MergeSessionStatus, Error>({
		queryKey: [...MERGE_SESSION_POLLING_QUERY_KEY, pollingSessionId],
		queryFn: async () => {
			if (!pollingSessionId) {
				throw new Error("Polling session id is required");
			}

			console.info("[merge-polling] request", {
				mergeSessionId: pollingSessionId,
			});
			const status = await mergeService.getSession(pollingSessionId);
			console.info("[merge-polling] response", {
				mergeSessionId: pollingSessionId,
				status: status.status,
				progress: status.progress,
				stage: status.stage,
			});
			return status;
		},
		enabled: Boolean(pollingSessionId),
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (!pollingSessionId) {
				return false;
			}
			if (status === "done" || status === "failed") {
				return false;
			}
			return POLL_INTERVAL_MS;
		},
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: 1,
		staleTime: 0,
	});

	useEffect(() => {
		if (!pollingQuery.data) {
			return;
		}

		const status = pollingQuery.data;
		setActiveSession(status);

		if (status.status === "done" || status.status === "failed") {
			console.info("[merge-polling] terminal status", {
				mergeSessionId: status.mergeSessionId,
				status: status.status,
				progress: status.progress,
			});
			setPollingSessionId(null);
			queryClient.invalidateQueries({
				queryKey: S2T_COMMIT_LIST_QUERY_KEY,
			});
			queryClient.invalidateQueries({
				queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY],
			});
		}
	}, [pollingQuery.data, setActiveSession, queryClient]);

	useEffect(() => {
		if (!pollingQuery.error) {
			return;
		}

		console.error("[merge-polling] request failed", {
			mergeSessionId: pollingSessionId,
			message: pollingQuery.error.message,
		});
		setPollingSessionId(null);
		clearSession();
	}, [pollingQuery.error, pollingSessionId, clearSession]);

	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	return { activeSession, startPolling, stopPolling, clearSession };
};
