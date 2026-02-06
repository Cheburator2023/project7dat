import axios from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

export const processesApi = axios.create({
	baseURL: `${API_BASE_URL}/api/processes`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface ProcessItem {
	name: string;
	description: string | null;
}

export const processesService = {
	getAll: async (): Promise<string[]> => {
		const response = await processesApi.get("");
		const data = response.data?.data;
		return Array.isArray(data) ? data : [];
	},
	getAllWithDescriptions: async (): Promise<ProcessItem[]> => {
		const response = await processesApi.get("/with-descriptions");
		const data = response.data?.data;
		return Array.isArray(data) ? data : [];
	},
};
