import axios from "axios";
import type { DataLineageSchema } from "@data-lineage/shared-schemas";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";

export const snapshotApi = axios.create({
	baseURL: `${API_BASE_URL}/api/snapshots`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface SnapshotItem {
	id: string;
	name: string;
	description?: string;
	version: string;
	data: DataLineageSchema;
	metadata?: Record<string, any>;
	graphId: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSnapshotRequest {
	name: string;
	description?: string;
	version?: string;
	metadata?: Record<string, any>;
}

export interface UpdateSnapshotRequest {
	name?: string;
	description?: string;
	version?: string;
	metadata?: Record<string, any>;
}

export interface SnapshotListResponse {
	data: SnapshotItem[];
	total: number;
	page: number;
	limit: number;
}

export interface ApplySnapshotRequest {
	snapshotId: string;
	message?: string;
}

export const snapshotService = {
	getAll: (params?: {
		page?: number;
		limit?: number;
		graphId?: string;
	}): Promise<SnapshotListResponse> => {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.graphId) searchParams.append("graphId", params.graphId);

		return snapshotApi
			.get(`/list?${searchParams}`)
			.then((response) => response.data);
	},

	getById: (id: string): Promise<SnapshotItem> =>
		snapshotApi.get(`/${id}`).then((response) => response.data),

	create: (data: CreateSnapshotRequest): Promise<SnapshotItem> =>
		snapshotApi.post("/create", data).then((response) => response.data),

	update: (id: string, data: UpdateSnapshotRequest): Promise<SnapshotItem> =>
		snapshotApi.put(`/${id}`, data).then((response) => response.data),

	delete: (id: string): Promise<void> =>
		snapshotApi.delete(`/${id}`).then(() => undefined),

	restore: (id: string): Promise<void> =>
		snapshotApi.post(`/${id}/restore`).then(() => undefined),

	apply: (data: ApplySnapshotRequest): Promise<void> =>
		snapshotApi.post("/apply", data).then(() => undefined),
};
