import { useCallback, useEffect } from "react";
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

	const startPolling = useCallback(
		(mergeSessionId: string) => {
			if (!mergeSessionId) {
				console.warn("[merge-polling] start skipped: empty mergeSessionId");
				return;
			}
			console.info("[merge-polling] start", { mergeSessionId });
			setPollingSessionId(mergeSessionId);
		},
		[setPollingSessionId],
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
		const storedSessionId = window.sessionStorage.getItem(
			MERGE_SESSION_STORAGE_KEY,
		);

		if (!storedSessionId) {
			return;
		}

		console.info("[merge-polling] restore from sessionStorage", {
			mergeSessionId: storedSessionId,
		});

		if (
			useMergingSessionStore.getState().pollingSessionId !== storedSessionId
		) {
			setPollingSessionId(storedSessionId);
		}
	}, [pollingSessionId, setPollingSessionId]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (pollingSessionId) {
			window.sessionStorage.setItem(
				MERGE_SESSION_STORAGE_KEY,
				pollingSessionId,
			);
			return;
		}

		window.sessionStorage.removeItem(MERGE_SESSION_STORAGE_KEY);
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
			const status = await mergeService.getSession(pollingSessionId);
			console.info("[merge-polling] response", {
				mergeSessionId: pollingSessionId,
				status: status.status,
				progress: status.progress,
				stage: status.stage,
			});
			return status;
		},
		enabled: !!pollingSessionId,
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

	const pollingQuerySingle = useQuery<MergeSessionStatus, Error>({
		queryKey: [...MERGE_SESSION_POLLING_SINGLE_QUERY_KEY, pollingSessionId],
		queryFn: async () => {
			const id =
				pollingSessionId ||
				window.sessionStorage.getItem(MERGE_SESSION_STORAGE_KEY);
			console.log("🐸 Pepe said >> useMergeSessionPolling >> id:", id);

			if (!id) {
				throw new Error(
					"Polling session id is required for pollingQuerySingle",
				);
			}

			console.info("[merge-polling] request", {
				mergeSessionId: id,
			});
			const status = await mergeService.getSession(id);
			console.info("[merge-polling] response", {
				mergeSessionId: id,
				status: status.status,
				progress: status.progress,
				stage: status.stage,
			});
			return status;
		},
		enabled: false,
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
	}, [pollingQuery.data, setActiveSession, setPollingSessionId, queryClient]);

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
	}, [pollingQuery.error, pollingSessionId, setPollingSessionId, clearSession]);

	const isPolling =
		!!pollingSessionId &&
		activeSession?.status !== "done" &&
		activeSession?.status !== "failed";

	return {
		activeSession,
		startPolling,
		stopPolling,
		clearSession,
		isPolling,
		pollingSessionId,
		checkForPolling: pollingQuerySingle,
	};
};
