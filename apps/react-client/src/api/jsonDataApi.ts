import axios from "axios";
import type { DataLineageSchema } from "@data-lineage/shared-schemas";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const jsonDataApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-data`,
	headers: {
		"Content-Type": "application/json",
	},
});

export const jsonCommitApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-commits`,
	headers: {
		"Content-Type": "application/json",
	},
});

// Use shared schema types
export interface JsonDataItem {
	id: string;
	name: string;
	data: DataLineageSchema;
	description?: string;
	version: string;
	isCurrent: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateJsonDataRequest {
	data: DataLineageSchema;
	name?: string;
	description?: string;
}

export interface UpdateJsonDataRequest {
	name?: string;
	data?: DataLineageSchema;
	description?: string;
	version?: string;
}

export interface SetCurrentFromSnapshotRequest {
	snapshotId: string;
}

export interface CommitJsonDataRequest {
	message: string;
	data: Record<string, any>;
}

export interface JsonCommitItem {
	id: string;
	short_id: string;
	message: string;
	diff: Record<string, any>;
	fullData?: Record<string, any>; // Optional since individual commits don't include fullData
	graphId: string;
	author?: {
		id: string;
		username: string;
		email: string;
	};
	createdAt: string;
}

export interface CumulativeCommitData {
	fullData: Record<string, any>;
	commits: JsonCommitItem[];
	targetCommit: JsonCommitItem;
}

export interface CommitListResponse {
	data: JsonCommitItem[];
	total: number;
	page: number;
	limit: number;
}

export const jsonDataService = {
	getAll: (): Promise<JsonDataItem[]> =>
		jsonDataApi.get("/list").then((response) => response.data.data),

	getById: (id: string): Promise<JsonDataItem> =>
		jsonDataApi.get(`/${id}`).then((response) => response.data),

	getCurrent: (): Promise<JsonDataItem> =>
		jsonDataApi.get("/current").then((response) => response.data),

	create: (data: CreateJsonDataRequest): Promise<JsonDataItem> =>
		jsonDataApi.post("/create", data).then((response) => response.data),

	initializeGraph: (data: CreateJsonDataRequest): Promise<JsonDataItem> =>
		jsonCommitApi.post("/initialize", data).then((response) => response.data),

	update: (id: string, data: UpdateJsonDataRequest): Promise<JsonDataItem> =>
		jsonDataApi.put(`/update/${id}`, data).then((response) => response.data),

	delete: (id: string): Promise<void> =>
		jsonDataApi.delete(`/delete/${id}`).then(() => undefined),

	commitCurrent: (data: CommitJsonDataRequest): Promise<JsonDataItem> =>
		jsonCommitApi.post("/commit", data).then((response) => response.data),

	commitUpdate: (
		id: string,
		data: CommitJsonDataRequest,
	): Promise<JsonDataItem> =>
		jsonCommitApi.post(`/commit/${id}`, data).then((response) => response.data),

	getCommits: (params?: {
		page?: number;
		limit?: number;
		graphId?: string;
	}): Promise<CommitListResponse> => {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.graphId) searchParams.append("graphId", params.graphId);

		return jsonCommitApi
			.get(`/commits?${searchParams}`)
			.then((response) => response.data);
	},

	getCommitById: (id: string): Promise<JsonCommitItem> =>
		jsonCommitApi.get(`/commits/${id}`).then((response) => response.data),

	getCumulativeDataAtCommit: (id: string): Promise<CumulativeCommitData> =>
		jsonCommitApi
			.get(`/commits/${id}/cumulative`)
			.then((response) => response.data),

	searchCommits: (
		graphId: string,
		params?: {
			dateFrom?: string;
			dateTo?: string;
			user?: string;
			query?: string;
			page?: number;
			limit?: number;
		},
	): Promise<CommitListResponse> => {
		const searchParams = new URLSearchParams();
		if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
		if (params?.user) searchParams.append("user", params.user);
		if (params?.query) searchParams.append("query", params.query);
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());

		return jsonCommitApi
			.get(`/commits/search/${graphId}?${searchParams}`)
			.then((response) => response.data);
	},

	getAllCommitsFromAllGraphs: (params?: {
		page?: number;
		limit?: number;
		dateFrom?: string;
		dateTo?: string;
		user?: string;
		query?: string;
	}): Promise<CommitListResponse> => {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
		if (params?.user) searchParams.append("user", params.user);
		if (params?.query) searchParams.append("query", params.query);

		return jsonCommitApi
			.get(`/commits/all?${searchParams}`)
			.then((response) => response.data);
	},

	setCurrent: (id: string): Promise<{ success: boolean; message: string }> =>
		jsonDataApi.post(`/set-current/${id}`).then((response) => response.data),

	setCurrentFromSnapshot: async (request: SetCurrentFromSnapshotRequest) => {
		const response = await jsonDataApi.post(
			`/set-current-from-snapshot/${request.snapshotId}`,
		);
		return response.data;
	},

	applyCommit: (commitId: string): Promise<CumulativeCommitData> =>
		jsonCommitApi
			.get(`/commits/${commitId}/cumulative`)
			.then((response) => response.data),
};
