import axios from "axios";
import type { JsonDataItem } from "./jsonDataApi";
export type { JsonDataItem } from "./jsonDataApi";

const API_BASE_URL =
	window.urlConfig?.DATA_LINEAGE_API ||
	"https://data-lineage-api-sumd.sumd.dk1-sumd01.innodev.local";

export const jsonDataListApi = axios.create({
	baseURL: `${API_BASE_URL}/api/json-data`,
	headers: {
		"Content-Type": "application/json",
	},
});

export const jsonDataListService = {
	getAll: async (): Promise<JsonDataItem[]> => {
		const response = await jsonDataListApi.get("/list");
		return response.data.data;
	},

	getById: async (id: string): Promise<JsonDataItem> => {
		const response = await jsonDataListApi.get(`/${id}`);
		return response.data;
	},

	setCurrent: async (
		id: string,
	): Promise<{ success: boolean; message: string }> => {
		const response = await jsonDataListApi.post(`/set-current/${id}`);
		return response.data;
	},
};
