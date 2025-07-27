import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListInput,
	JsonDataResponse,
} from "../schemas/json-data.schema";
import {
	CommitJsonDataInput,
	GetCommitListInput,
	JsonCommitResponse,
} from "../schemas/json-commit.schema";

export interface JsonDataListResponse {
	data: JsonDataResponse[];
	total: number;
	page: number;
	limit: number;
}

export interface CommitListResponse {
	data: JsonCommitResponse[];
	total: number;
	page: number;
	limit: number;
}

export interface ApiClient {
	jsonData: {
		create: (data: CreateJsonDataInput) => Promise<JsonDataResponse>;
		list: (params: GetJsonDataListInput) => Promise<JsonDataListResponse>;
		getById: (id: string) => Promise<JsonDataResponse>;
		getCurrent: () => Promise<JsonDataResponse>;
		update: (
			id: string,
			data: UpdateJsonDataInput,
		) => Promise<JsonDataResponse>;
		delete: (id: string) => Promise<{ success: boolean }>;
		commitUpdate: (
			id: string,
			data: CommitJsonDataInput & { data: Record<string, any> },
		) => Promise<JsonDataResponse>;
		getCommits: (params: GetCommitListInput) => Promise<CommitListResponse>;
		getCommitById: (id: string) => Promise<JsonCommitResponse>;
	};
}

export const createApiClient = (
	baseUrl = "http://localhost:3000",
): ApiClient => {
	const request = async <T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> => {
		const response = await fetch(`${baseUrl}${endpoint}`, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	};

	return {
		jsonData: {
			create: (data: CreateJsonDataInput) =>
				request<JsonDataResponse>("/api/json-data/create", {
					method: "POST",
					body: JSON.stringify(data),
				}),

			list: (params: GetJsonDataListInput) => {
				const searchParams = new URLSearchParams();
				if (params.page) searchParams.append("page", params.page.toString());
				if (params.limit) searchParams.append("limit", params.limit.toString());
				if (params.search) searchParams.append("search", params.search);

				return request<JsonDataListResponse>(
					`/api/json-data/list?${searchParams}`,
				);
			},

			getById: (id: string) =>
				request<JsonDataResponse>(`/api/json-data/${id}`),

			getCurrent: () => request<JsonDataResponse>("/api/json-data/current"),

			update: (id: string, data: UpdateJsonDataInput) =>
				request<JsonDataResponse>(`/api/json-data/update/${id}`, {
					method: "PUT",
					body: JSON.stringify(data),
				}),

			delete: (id: string) =>
				request<{ success: boolean }>(`/api/json-data/delete/${id}`, {
					method: "DELETE",
				}),

			commitUpdate: (
				id: string,
				data: CommitJsonDataInput & { data: Record<string, any> },
			) =>
				request<JsonDataResponse>(`/api/json-commits/commit/${id}`, {
					method: "POST",
					body: JSON.stringify(data),
				}),

			getCommits: (params: GetCommitListInput) => {
				const searchParams = new URLSearchParams();
				if (params.page) searchParams.append("page", params.page.toString());
				if (params.limit) searchParams.append("limit", params.limit.toString());
				if (params.graphId) searchParams.append("graphId", params.graphId);

				return request<CommitListResponse>(
					`/api/json-commits/commits?${searchParams}`,
				);
			},

			getCommitById: (id: string) =>
				request<JsonCommitResponse>(`/api/json-commits/commits/${id}`),
		},
	};
};
