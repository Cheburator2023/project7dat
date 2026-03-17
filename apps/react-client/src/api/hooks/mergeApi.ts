import { default as axios } from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

export const mergeApi = axios.create({
	baseURL: `${API_BASE_URL}/api/merge`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface MergeDiffItem {
	type: "added" | "removed" | "modified";
	path: string;
	oldValue?: unknown;
	newValue?: unknown;
}

export interface ApplyMergeResponse {
	mergeSessionId: string;
	mergedJson: Record<string, unknown>;
	diff: MergeDiffItem[];
	changedEntitiesCount: number;
	changedAttributesCount: number;
	changedMappingsCount: number;
	hasDuplicates: boolean;
	duplicatesCount: number;
	validationWarnings: string[];
}

export interface DeduplicateResponse {
	success: boolean;
	removedCount: number;
	affectedGroups: number;
}

export interface ConfirmMergeResponse {
	success: boolean;
	mergeSessionId: string;
	message: string;
}

export interface MergeSessionStatus {
	mergeSessionId: string;
	commitId: string;
	commitName: string;
	status: "merging" | "done" | "failed";
	progress: number;
	stage: string;
	startedAt: string;
	estimatedSecondsLeft: number | null;
	snapshotId: string | null;
	errorMessage: string | null;
}

export interface CancelMergeResponse {
	success: boolean;
	message: string;
}

export const mergeService = {
	apply: async (commitId: string): Promise<ApplyMergeResponse> => {
		const response = await mergeApi.post("/apply", { commitId });
		return response.data;
	},

	confirm: async (
		commitId: string,
		user?: string,
	): Promise<ConfirmMergeResponse> => {
		const response = await mergeApi.post("/confirm", { commitId, user });
		return response.data;
	},

	cancel: async (commitId: string): Promise<CancelMergeResponse> => {
		const response = await mergeApi.post("/cancel", { commitId });
		return response.data;
	},

	getSession: async (sessionId: string): Promise<MergeSessionStatus> => {
		const response = await mergeApi.get(`/session/${sessionId}`);
		return response.data;
	},

	deduplicate: async (): Promise<DeduplicateResponse> => {
		const response = await mergeApi.post("/deduplicate");
		return response.data;
	},
};
