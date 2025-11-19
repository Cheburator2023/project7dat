import axios from "axios";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";

export const changelogV2ApiInstance = axios.create({
	baseURL: `${API_BASE_URL}/api/v2/changelog`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface ChangelogEntryV2 {
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

export interface ChangelogGroupV2 {
	date: string;
	entries: ChangelogEntryV2[];
}

export interface ChangelogResponseV2 {
	groups: ChangelogGroupV2[];
	total: number;
	page: number;
	limit: number;
}

export interface GetChangelogV2Params {
	page?: number;
	limit?: number;
	graphId?: string;
	author?: string;
	dateFrom?: string;
	dateTo?: string;
}

export const changelogV2Api = {
	getChangelog: async (
		params: GetChangelogV2Params = {},
	): Promise<ChangelogResponseV2> => {
		const { page, limit, author, dateFrom, dateTo } = params;

		const response = await changelogV2ApiInstance.get("", {
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
		params: Omit<GetChangelogV2Params, "graphId"> = {},
	): Promise<ChangelogResponseV2> => {
		const { page, limit, author, dateFrom, dateTo } = params;

		const response = await changelogV2ApiInstance.get(`/graph/${graphId}`, {
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
