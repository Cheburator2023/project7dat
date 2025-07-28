import axios from "axios";

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

export interface JsonDataItem {
	id: string;
	name: string;
	data: Record<string, any>;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateJsonDataRequest {
	data: Record<string, any>;
}

export interface UpdateJsonDataRequest {
	name?: string;
	data?: Record<string, any>;
	description?: string;
}

export interface CommitJsonDataRequest {
	message: string;
	data: Record<string, any>;
}

export interface JsonCommitItem {
	id: string;
	hash: string;
	message: string;
	diff: Record<string, any>;
	fullData: Record<string, any>;
	graphId: string;
	createdAt: string;
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
};
