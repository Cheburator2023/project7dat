import { create } from "zustand";
import type { MergeSessionStatus } from "@react-client/api/hooks/mergeApi";

interface MergingSessionState {
	activeSession: MergeSessionStatus | null;
	setActiveSession: (session: MergeSessionStatus | null) => void;
	clearSession: () => void;
}

export const useMergingSessionStore = create<MergingSessionState>()((set) => ({
	activeSession: null,
	setActiveSession: (activeSession) => set({ activeSession }),
	clearSession: () => set({ activeSession: null }),
}));
