import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mergeService, type MergeSessionStatus } from "./mergeApi";
import { useMergingSessionStore } from "@react-client/features/commits/stores/mergingSessionStore";
import { S2T_COMMIT_LIST_QUERY_KEY } from "./useS2tCommitList";
import { S2T_COMMIT_BY_ID_QUERY_KEY } from "./useS2tCommitById";

const POLL_INTERVAL_MS = 6000;
const MERGE_SESSION_STORAGE_KEY = "mergePollingSessionId";
const MERGE_SESSION_POLLING_QUERY_KEY = [
	"merge",
	"session",
	"polling",
] as const;
const MERGE_SESSION_POLLING_SINGLE_QUERY_KEY = [
	...MERGE_SESSION_POLLING_QUERY_KEY,
	"check",
] as const;
let restoreFromStorageDone = false;

const isActiveBackgroundStatus = (
	status: MergeSessionStatus["status"] | null | undefined,
): boolean => status === "merging" || status === "deduplicating";

export const useMergeSessionPolling = () => {
	const store = useMergingSessionStore();

	const { activeSession, setActiveSession, clearSession } = store;
	const queryClient = useQueryClient();
	const pollingSessionId = useMergingSessionStore(
		(s) => s.pollingSessionId ?? null,
	);
	const setPollingSessionId = useMergingSessionStore(
		(s) => s.setPollingSessionId,
	);

	const stopPolling = useCallback(() => {
		const currentId = useMergingSessionStore.getState().pollingSessionId;
		if (currentId) {
			console.info("[merge-polling] stop", { pollingSessionId: currentId });
		}
		setPollingSessionId(null);
		queryClient.removeQueries({
			queryKey: [...MERGE_SESSION_POLLING_QUERY_KEY],
		});
	}, [setPollingSessionId, queryClient]);

	const justStartedRef = useRef(false);

	const startPolling = useCallback(
		(mergeSessionId: string) => {
			if (!mergeSessionId) {
				console.warn("[merge-polling] start skipped: empty mergeSessionId");
				return;
			}
			console.info("[merge-polling] start", { mergeSessionId });
			queryClient.removeQueries({
				queryKey: [...MERGE_SESSION_POLLING_QUERY_KEY, mergeSessionId],
			});
			justStartedRef.current = true;
			setPollingSessionId(mergeSessionId);
		},
		[setPollingSessionId, queryClient],
	);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			pollingSessionId ||
			restoreFromStorageDone
		) {
			return;
		}

		restoreFromStorageDone = true;
		const storedSessionId = window.localStorage.getItem(
			MERGE_SESSION_STORAGE_KEY,
		);

		if (storedSessionId) {
			console.info("[merge-polling] restore from localStorage", {
				mergeSessionId: storedSessionId,
			});

			mergeService
				.getSession(storedSessionId)
				.then((data) => {
					console.info("[merge-polling] session status after restore", {
						mergeSessionId: storedSessionId,
						status: data.status,
					});
					if (!isActiveBackgroundStatus(data.status)) {
						window.localStorage.removeItem(MERGE_SESSION_STORAGE_KEY);
						clearSession();
						return;
					}
					startPolling(data.mergeSessionId);
				})
				.catch((error) => {
					console.error("[merge-polling] failed to restore session", {
						mergeSessionId: storedSessionId,
						error: error.message,
					});
				});
			return;
		}

		mergeService
			.getActiveSession()
			.then((data) => {
				if (!data) {
					return;
				}
				console.info("[merge-polling] restore active session from api", {
					mergeSessionId: data.mergeSessionId,
					operation: data.operation,
					status: data.status,
				});
				if (!isActiveBackgroundStatus(data.status)) {
					return;
				}
				startPolling(data.mergeSessionId);
			})
			.catch((error) => {
				console.error("[merge-polling] failed to fetch active session", {
					error: error.message,
				});
			});
	}, [pollingSessionId, setPollingSessionId, setActiveSession]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (pollingSessionId) {
			window.localStorage.setItem(MERGE_SESSION_STORAGE_KEY, pollingSessionId);
			return;
		}

		window.localStorage.removeItem(MERGE_SESSION_STORAGE_KEY);
	}, [pollingSessionId]);

	const pollingQuery = useQuery<MergeSessionStatus, Error>({
		queryKey: [...MERGE_SESSION_POLLING_QUERY_KEY, pollingSessionId],
		queryFn: async () => {
			if (!pollingSessionId) {
				throw new Error("Polling session id is required");
			}

			console.info("[merge-polling] request", {
				mergeSessionId: pollingSessionId,
			});
			const data = await mergeService.getSession(pollingSessionId);
			console.info("[merge-polling] response", {
				mergeSessionId: pollingSessionId,
				status: data.status,
				progress: data.progress,
				stage: data.stage,
			});
			return data;
		},
		enabled: !!pollingSessionId,
		refetchInterval: (query) => {
			if (!pollingSessionId) {
				return false;
			}
			const data = query.state.data;
			// Пока данных нет (первый fetch) — продолжаем polling
			if (!data) {
				return POLL_INTERVAL_MS;
			}
			// pending — бэкенд мог не успеть обновить на merging, продолжаем
			if (isActiveBackgroundStatus(data.status) || data.status === "pending") {
				return POLL_INTERVAL_MS;
			}
			return false;
		},
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: 1,
		staleTime: 0,
	});

	const pollingQuerySingle = useQuery<MergeSessionStatus, Error>({
		queryKey: [...MERGE_SESSION_POLLING_SINGLE_QUERY_KEY, pollingSessionId],
		queryFn: async () => {
			const id =
				pollingSessionId ||
				window.localStorage.getItem(MERGE_SESSION_STORAGE_KEY);

			if (!id) {
				throw new Error(
					"Polling session id is required for pollingQuerySingle",
				);
			}

			console.info("[merge-polling] request", {
				mergeSessionId: id,
			});
			const data = await mergeService.getSession(id);
			console.info("[merge-polling] response", {
				mergeSessionId: id,
				status: data.status,
				progress: data.progress,
				stage: data.stage,
			});
			return data;
		},
		enabled:
			!!pollingSessionId ||
			(typeof window !== "undefined" &&
				!!window.localStorage.getItem(MERGE_SESSION_STORAGE_KEY)),
	});

	useEffect(() => {
		if (!pollingQuery.data) {
			return;
		}

		const data = pollingQuery.data;

		// pending — бэкенд ещё не обновил на merging, просто ждём следующий poll
		if (data.status === "pending") {
			console.info(
				"[merge-polling] pending status, waiting for backend update",
				{
					mergeSessionId: data.mergeSessionId,
				},
			);
			justStartedRef.current = false;
			return;
		}

		if (
			!isActiveBackgroundStatus(data.status) &&
			data.status !== "done" &&
			data.status !== "failed"
		) {
			if (justStartedRef.current) {
				justStartedRef.current = false;
				console.info(
					"[merge-polling] ignoring stale cached status after startPolling",
					{
						mergeSessionId: data.mergeSessionId,
						status: data.status,
					},
				);
				return;
			}
			console.info(
				"[merge-polling] non-background status received, stopping polling",
				{
					mergeSessionId: data.mergeSessionId,
					status: data.status,
				},
			);
			stopPolling();
			clearSession();
			return;
		}
		justStartedRef.current = false;

		setActiveSession(data);

		if (data.status === "done" || data.status === "failed") {
			console.info("[merge-polling] terminal status", {
				mergeSessionId: data.mergeSessionId,
				status: data.status,
				progress: data.progress,
			});
			setPollingSessionId(null);
			stopPolling();
			queryClient.invalidateQueries({
				queryKey: S2T_COMMIT_LIST_QUERY_KEY,
			});
			queryClient.invalidateQueries({
				queryKey: [S2T_COMMIT_BY_ID_QUERY_KEY],
			});
		}
	}, [
		pollingQuery.data,
		setActiveSession,
		setPollingSessionId,
		queryClient,
		stopPolling,
		clearSession,
	]);

	useEffect(() => {
		if (!pollingQuery.error) {
			return;
		}

		console.error("[merge-polling] request failed, stopping polling", {
			mergeSessionId: pollingSessionId,
			message: pollingQuery.error.message,
		});
		stopPolling();
		clearSession();
	}, [pollingQuery.error, pollingSessionId, stopPolling, clearSession]);

	return {
		activeSession,
		startPolling,
		stopPolling,
		clearSession,
		pollingSessionId,
		checkForPolling: pollingQuerySingle,
	};
};
