import axios from "axios";
import type { JsonDataItem, JsonCommitItem } from "./jsonDataApi";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const debugApi = axios.create({
	baseURL: `${API_BASE_URL}/api/debug`,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface DebugDataResponse {
	jsonData: JsonDataItem[];
	commits: JsonCommitItem[];
	dbStatus: string;
	totalRecords: number;
}

export const debugService = {
	getAllData: (): Promise<DebugDataResponse> =>
		debugApi.get("/all").then((response) => response.data),

	getDatabaseStats: (): Promise<{
		jsonDataCount: number;
		commitsCount: number;
		dbStatus: string;
	}> => debugApi.get("/stats").then((response) => response.data),
};
