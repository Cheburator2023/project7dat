import { default as axios } from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

export type S2tCommitState = "processing" | "done" | "failed";
export type S2tCommitType = "table" | "json" | "model";

export interface S2tCommitItem {
	id: string;
	parent_id: string | null;
	commit_name: string;
	commit_description: string | null;
	type: S2tCommitType;
	state: S2tCommitState;
	user: string | null;
	payload: Record<string, unknown>;
	original_payload: Record<string, unknown> | null;
	change_id: number | null;
	error: string | null;
	created_at: string;
	updated_at: string;
}

export const s2tCommitStoreApi = axios.create({
	baseURL: `${API_BASE_URL}/api/s2t-import/commits`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface UpdateS2tCommitPayload {
	id: string;
	commit_name: string;
	commit_description?: string;
	type: S2tCommitType;
	user?: string;
	payload: Record<string, unknown>;
	parent_id?: string;
}

export interface ApplyS2tCommitPayload {
	user?: string;
	sourceType?: "SURM" | "DAPP";
}

export interface S2tCommitListResponse {
	items: S2tCommitItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const s2tCommitStoreService = {
	list: async (params?: {
		state?: string;
		type?: string;
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
	}): Promise<S2tCommitListResponse> => {
		const response = await s2tCommitStoreApi.get("", { params });
		const data = response.data;
		if (!data || typeof data !== "object") {
			return {
				items: [],
				total: 0,
				page: params?.page ?? 1,
				limit: params?.limit ?? 20,
				totalPages: 1,
			};
		}
		return {
			items: Array.isArray(data.items) ? data.items : [],
			total: typeof data.total === "number" ? data.total : 0,
			page: typeof data.page === "number" ? data.page : (params?.page ?? 1),
			limit:
				typeof data.limit === "number" ? data.limit : (params?.limit ?? 20),
			totalPages: typeof data.totalPages === "number" ? data.totalPages : 1,
		};
	},
	getById: async (id: string): Promise<S2tCommitItem> => {
		const response = await s2tCommitStoreApi.get(`/${id}`);
		return response.data;
	},
	update: async (data: UpdateS2tCommitPayload): Promise<S2tCommitItem> => {
		const response = await s2tCommitStoreApi.post("", data);
		return response.data;
	},
	apply: async (
		id: string,
		data: ApplyS2tCommitPayload,
	): Promise<S2tCommitItem> => {
		const response = await s2tCommitStoreApi.post(`/${id}/apply`, data);
		return response.data;
	},
	delete: async (id: string): Promise<void> => {
		await s2tCommitStoreApi.delete(`/${id}`);
	},
};
