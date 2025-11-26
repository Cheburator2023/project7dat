import axios from "axios";
import type {
	CommitListResponse,
	CumulativeCommitData,
	CommitQueueApiItem,
	JsonDataItem,
} from "./jsonDataApi";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";

export const jsonCommitApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-commits`,
	headers: {
		"Content-Type": "application/json",
	},
});

export const jsonCommitService = {
	getCommits(params?: {
		page?: number;
		limit?: number;
		graphId?: string;
	}): Promise<CommitListResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.graphId) searchParams.append("graphId", params.graphId);
		return jsonCommitApi
			.get(`/commits?${searchParams.toString()}`)
			.then((response) => response.data);
	},

	getAllCommitsFromAllGraphs(params?: {
		page?: number;
		limit?: number;
		dateFrom?: string;
		dateTo?: string;
		user?: string;
		query?: string;
	}): Promise<CommitListResponse> {
		const searchParams = new URLSearchParams();
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
		if (params?.user) searchParams.append("user", params.user);
		if (params?.query) searchParams.append("query", params.query);
		return jsonCommitApi
			.get(`/commits/all?${searchParams.toString()}`)
			.then((response) => response.data);
	},

	searchCommits(
		graphId: string,
		params?: {
			dateFrom?: string;
			dateTo?: string;
			user?: string;
			query?: string;
			page?: number;
			limit?: number;
		},
	): Promise<CommitListResponse> {
		const searchParams = new URLSearchParams();
		if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
		if (params?.user) searchParams.append("user", params.user);
		if (params?.query) searchParams.append("query", params.query);
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		return jsonCommitApi
			.get(`/commits/search/${graphId}?${searchParams.toString()}`)
			.then((response) => response.data);
	},

	getCumulativeDataAtCommit(id: string): Promise<CumulativeCommitData> {
		return jsonCommitApi
			.get(`/commits/${id}/cumulative`)
			.then((response) => response.data);
	},

	getCommitQueue(): Promise<CommitQueueApiItem[]> {
		return jsonCommitApi.get("/queue").then((response) => response.data);
	},

	applyCommit(id: string): Promise<JsonDataItem> {
		return jsonCommitApi
			.post(`/commits/${id}/apply`)
			.then((response) => response.data);
	},

	applyPartialCommit(params: {
		id: string;
		selectedEntityIds: string[];
	}): Promise<JsonDataItem> {
		return jsonCommitApi
			.post(`/commits/${params.id}/apply-partial`, {
				selectedEntityIds: params.selectedEntityIds,
			})
			.then((response) => response.data);
	},
};
