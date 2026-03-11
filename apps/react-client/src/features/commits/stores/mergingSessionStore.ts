import { create } from "zustand";
import type { MergeSessionStatus } from "@react-client/api/hooks/mergeApi";

interface MergingSessionState {
	activeSession: MergeSessionStatus | null;
	pollingSessionId: string | null;
	setActiveSession: (session: MergeSessionStatus | null) => void;
	setPollingSessionId: (id: string | null) => void;
	clearSession: () => void;
}

export const useMergingSessionStore = create<MergingSessionState>()((set) => ({
	activeSession: null,
	pollingSessionId: null,
	setActiveSession: (activeSession) => set({ activeSession }),
	setPollingSessionId: (pollingSessionId) => set({ pollingSessionId }),
	clearSession: () => set({ activeSession: null, pollingSessionId: null }),
}));
