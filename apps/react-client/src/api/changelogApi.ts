import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const changelogApiInstance = axios.create({
	baseURL: `${API_BASE_URL}/api/changelog`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface ChangelogEntry {
	id: string;
	graphId: string;
	graphName: string;
	actionType: string;
	actionDescription: string;
	details?: Record<string, any>;
	author?: string;
	commitId?: string;
	snapshotId?: string;
	version?: string;
	createdAt: string;
}

export interface ChangelogGroup {
	date: string;
	entries: ChangelogEntry[];
}

export interface ChangelogResponse {
	groups: ChangelogGroup[];
	total: number;
	page: number;
	limit: number;
}

export interface GetChangelogParams {
	page?: number;
	limit?: number;
	graphId?: string;
	author?: string;
	dateFrom?: string;
	dateTo?: string;
}

export const changelogApi = {
	getChangelog: async (
		params: GetChangelogParams = {},
	): Promise<ChangelogResponse> => {
		const searchParams = new URLSearchParams();

		if (params.page) searchParams.append("page", params.page.toString());
		if (params.limit) searchParams.append("limit", params.limit.toString());
		if (params.author) searchParams.append("author", params.author);
		if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params.dateTo) searchParams.append("dateTo", params.dateTo);

		const response = await changelogApiInstance.get(
			`?${searchParams.toString()}`,
		);
		return response.data;
	},

	getChangelogForGraph: async (
		graphId: string,
		params: Omit<GetChangelogParams, "graphId"> = {},
	): Promise<ChangelogResponse> => {
		const searchParams = new URLSearchParams();

		if (params.page) searchParams.append("page", params.page.toString());
		if (params.limit) searchParams.append("limit", params.limit.toString());
		if (params.author) searchParams.append("author", params.author);
		if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
		if (params.dateTo) searchParams.append("dateTo", params.dateTo);

		const response = await changelogApiInstance.get(
			`/graph/${graphId}?${searchParams.toString()}`,
		);
		return response.data;
	},
};
