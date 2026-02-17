import axios from "axios";
import type { DataLineageSchema } from "@data-lineage/shared-schemas";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API ||
	"https://data-lineage-api-sumd.sumd.dk1-sumd01.innodev.local";

export const jsonDataApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-export`,
	headers: {
		"Content-Type": "application/json",
	},
});

export const jsonSearchApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-search`,
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
	authorName?: string;
	deprecated?: boolean;
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

/**
 * Структура изменений коммита
 */
export interface CommitChanges {
	entities: {
		added: Array<{
			id: string;
			type: string;
			name: string | null;
			namespace?: string;
			data: Record<string, any>;
		}>;
		removed: Array<{
			id: string;
			type?: string;
			name?: string | null;
		}>;
		modified: Array<{
			id: string;
			type: string;
			name: string | null;
			changes: Array<{ field: string; oldValue: any; newValue: any }>;
			oldData?: Record<string, any>;
			newData?: Record<string, any>;
		}>;
	};
	mappings: {
		added: Array<{
			id: number;
			entityId: string;
			data: Record<string, any>;
		}>;
		removed: Array<{
			id: number;
			entityId?: string;
		}>;
		modified: Array<{
			id: number;
			entityId: string;
			changes: Array<{ field: string; oldValue: any; newValue: any }>;
			oldData?: Record<string, any>;
			newData?: Record<string, any>;
		}>;
	};
	summary: {
		totalChanges: number;
		entities: { added: number; removed: number; modified: number };
		mappings: { added: number; removed: number; modified: number };
	};
}

export interface JsonCommitItem {
	id: string;
	short_id: string;
	message: string;
	diff: Record<string, any>;
	/** Структурированные изменения коммита */
	changes?: CommitChanges | null;
	fullData?: DataLineageSchema; // Optional since individual commits don't include fullData
	graphId: string;
	author?: {
		id: string;
		username: string;
		email: string;
	};
	authorName?: string;
	createdAt: string;
}

export interface CumulativeCommitData {
	fullData: DataLineageSchema;
	commits: JsonCommitItem[];
	targetCommit: JsonCommitItem;
}

export interface CommitListResponse {
	data: JsonCommitItem[];
	total: number;
	page: number;
	limit: number;
}

// Commit queue API item (matches JsonCommitEntity on backend)
export interface CommitQueueApiItem {
	id: string;
	message: string;
	diff: Record<string, any>;
	graphId: string;
	version: string;
	status: string;
	authorName?: string;
	createdAt: string;
}

export interface PaginatedEntitiesResponse {
	entities: Array<{
		id: string;
		modified: boolean;
		type: string;
		namespace: string;
		name: string;
		system_code?: string;
		system_name?: string;
		entity_change: string;
		description?: string;
		container_description?: string;
		container_change: string;
		attrSeq: Array<{
			name: string;
			type: string;
			comment?: string;
			attr_change: string;
		}>;
	}>;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	desc: { change_date: string };
}

export interface PaginatedMappingsResponse {
	mappings: Array<{
		entityId: string;
		system_code?: string;
		relation_change: string;
		description?: string;
		entity_map_id?: number;
		target_id?: number;
		deps: Array<{
			entityId: string;
			system_code?: string;
			source_id?: number;
			process_id?: number;
			process?: string;
			process_description?: string;
			process_change?: string;
			attrMaps: Array<{
				src: string;
				dst: string;
				src_id?: number;
				dst_id?: number;
				relation_change: string;
			}>;
			atrDeps: Array<{
				attr: string;
				linkTypes: string[];
				src_id?: number;
				relation_change: string;
			}>;
		}>;
	}>;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	desc: { change_date: string };
}

export interface PaginatedEntityRelationsResponse {
	entity: PaginatedEntitiesResponse["entities"][0] | null;
	mappings: PaginatedMappingsResponse["mappings"];
	relatedEntities: PaginatedEntitiesResponse["entities"];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	desc: { change_date: string };
}

export const jsonDataService = {
	getAll: (): Promise<JsonDataItem[]> =>
		jsonDataApi.get("/list").then((response) => response.data.data),

	getById: (id: string): Promise<JsonDataItem> =>
		jsonDataApi.get(`/${id}`).then((response) => response.data),

	getCurrent: (): Promise<JsonDataItem> =>
		jsonDataApi.get("/dl").then((response) => response.data),

	getSearchEntity: (search: string): Promise<JsonDataItem> =>
		jsonSearchApi.post("/search", { search }).then((response) => response.data),

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

	getPaginatedEntities: (params: {
		page?: number;
		limit?: number;
		search?: string;
		type?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
	}): Promise<PaginatedEntitiesResponse> => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append("page", params.page.toString());
		if (params.limit) searchParams.append("limit", params.limit.toString());
		if (params.search) searchParams.append("search", params.search);
		if (params.type) searchParams.append("type", params.type);
		if (params.sortBy) searchParams.append("sortBy", params.sortBy);
		if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

		return jsonDataApi
			.get(`/dl/paginated?${searchParams}`)
			.then((response) => response.data);
	},

	getPaginatedMappings: (params: {
		page?: number;
		limit?: number;
		search?: string;
	}): Promise<PaginatedMappingsResponse> => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append("page", params.page.toString());
		if (params.limit) searchParams.append("limit", params.limit.toString());
		if (params.search) searchParams.append("search", params.search);

		return jsonDataApi
			.get(`/dl/paginated/mappings?${searchParams}`)
			.then((response) => response.data);
	},

	getPaginatedEntityRelations: (params: {
		entityId: string;
		page?: number;
		limit?: number;
	}): Promise<PaginatedEntityRelationsResponse> => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.append("page", params.page.toString());
		if (params.limit) searchParams.append("limit", params.limit.toString());

		return jsonDataApi
			.get(
				`/dl/entity-relations/${encodeURIComponent(params.entityId)}?${searchParams}`,
			)
			.then((response) => response.data);
	},

	resetDatabase: (): Promise<{
		success: boolean;
		message: string;
		deletedJsonData: number;
		deletedCommits: number;
		deletedSnapshots: number;
		changelogCleared: boolean;
	}> => jsonDataApi.post("/reset").then((response) => response.data),
};
