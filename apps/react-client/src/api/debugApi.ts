import axios from "axios";
import type { JsonDataItem, JsonCommitItem } from "./jsonDataApi";

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

export interface DebugDataResponse {
	jsonData: JsonDataItem[];
	commits: JsonCommitItem[];
	dbStatus: string;
	totalRecords: number;
}

export const debugService = {
	getAllData: async (): Promise<DebugDataResponse> => {
		try {
			// Fetch all JSON data
			const jsonDataResponse = await jsonDataApi.get("/list");
			const jsonData = jsonDataResponse.data.data || [];

			// Fetch all commits
			const commitsResponse = await jsonCommitApi.get("/commits?limit=100");
			const commits = commitsResponse.data.data || [];

			return {
				jsonData,
				commits,
				dbStatus: "connected",
				totalRecords: jsonData.length + commits.length,
			};
		} catch (error) {
			console.error("Error fetching debug data:", error);
			return {
				jsonData: [],
				commits: [],
				dbStatus: "error",
				totalRecords: 0,
			};
		}
	},

	getDatabaseStats: async (): Promise<{
		jsonDataCount: number;
		commitsCount: number;
		dbStatus: string;
	}> => {
		try {
			// Fetch counts from existing endpoints
			const jsonDataResponse = await jsonDataApi.get("/list");
			const commitsResponse = await jsonCommitApi.get("/commits?limit=1");

			const jsonDataCount = jsonDataResponse.data.data?.length || 0;
			const commitsCount = commitsResponse.data.total || 0;

			return {
				jsonDataCount,
				commitsCount,
				dbStatus: "connected",
			};
		} catch (error) {
			console.error("Error fetching database stats:", error);
			return {
				jsonDataCount: 0,
				commitsCount: 0,
				dbStatus: "error",
			};
		}
	},
};
