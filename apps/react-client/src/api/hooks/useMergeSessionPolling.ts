import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mergeService, type MergeSessionStatus } from "./mergeApi";
import { useMergingSessionStore } from "@react-client/features/commits/stores/mergingSessionStore";
import { S2T_COMMIT_LIST_QUERY_KEY } from "./useS2tCommitList";
import { S2T_COMMIT_BY_ID_QUERY_KEY } from "./useS2tCommitById";

const POLL_INTERVAL_MS = 6000;

export const useMergeSessionPolling = () => {
	const { activeSession, setActiveSession, clearSession } =
		useMergingSessionStore();
	const queryClient = useQueryClient();
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const sessionIdRef = useRef<string | null>(null);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const startPolling = useCallback(
		(mergeSessionId: string) => {
			sessionIdRef.current = mergeSessionId;
			stopPolling();

			const poll = async () => {
				try {
					const status: MergeSessionStatus =
						await mergeService.getSession(mergeSessionId);
					setActiveSession(status);

					if (status.status === "done" || status.status === "failed") {
						stopPolling();
						queryClient.invalidateQueries({
							queryKey: S2T_COMMIT_LIST_QUERY_KEY,
						});
						queryClient.invalidateQueries({
							queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY],
						});
					}
				} catch {
					stopPolling();
					clearSession();
				}
			};

			poll();
			intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
		},
		[stopPolling, setActiveSession, clearSession, queryClient],
	);

	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	return { activeSession, startPolling, stopPolling, clearSession };
};
