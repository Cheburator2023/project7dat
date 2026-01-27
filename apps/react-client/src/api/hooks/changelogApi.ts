import axios from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

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
	details?: Record<string, any> | string | null;
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
		const { page, limit, author, dateFrom, dateTo } = params;

		const response = await changelogApiInstance.get("", {
			params: {
				...(page !== undefined ? { page } : {}),
				...(limit !== undefined ? { limit } : {}),
				...(author ? { author } : {}),
				...(dateFrom ? { dateFrom } : {}),
				...(dateTo ? { dateTo } : {}),
			},
		});
		return response.data;
	},

	getChangelogForGraph: async (
		graphId: string,
		params: Omit<GetChangelogParams, "graphId"> = {},
	): Promise<ChangelogResponse> => {
		const { page, limit, author, dateFrom, dateTo } = params;

		const response = await changelogApiInstance.get(`/graph/${graphId}`, {
			params: {
				...(page !== undefined ? { page } : {}),
				...(limit !== undefined ? { limit } : {}),
				...(author ? { author } : {}),
				...(dateFrom ? { dateFrom } : {}),
				...(dateTo ? { dateTo } : {}),
			},
		});
		return response.data;
	},
};
