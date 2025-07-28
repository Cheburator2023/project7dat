import { Injectable } from "@nestjs/common";
import { JsonDataService } from "./json-data.service";
import { JsonCommitService } from "./json-commit.service";

@Injectable()
export class DebugService {
	constructor(
		private readonly jsonDataService: JsonDataService,
		private readonly jsonCommitService: JsonCommitService,
	) {}

	async getAllData() {
		try {
			const [jsonDataResult, commitsResult] = await Promise.allSettled([
				this.jsonDataService.getAllGraphsWithPagination({
					page: 1,
					limit: 1000,
				}),
				this.jsonCommitService.getCommitsWithPagination({
					page: 1,
					limit: 1000,
				}),
			]);

			const jsonData =
				jsonDataResult.status === "fulfilled" ? jsonDataResult.value.data : [];
			const commits =
				commitsResult.status === "fulfilled" ? commitsResult.value.data : [];

			return {
				jsonData,
				commits,
				dbStatus: "connected",
				totalRecords: jsonData.length + commits.length,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				jsonData: [],
				commits: [],
				dbStatus: "error",
				totalRecords: 0,
				timestamp: new Date().toISOString(),
				error: error.message,
			};
		}
	}

	async getDatabaseStats() {
		try {
			const [jsonDataResult, commitsResult] = await Promise.allSettled([
				this.jsonDataService.getAllGraphsWithPagination({ page: 1, limit: 1 }),
				this.jsonCommitService.getCommitsWithPagination({ page: 1, limit: 1 }),
			]);

			const jsonDataCount =
				jsonDataResult.status === "fulfilled" ? jsonDataResult.value.total : 0;
			const commitsCount =
				commitsResult.status === "fulfilled" ? commitsResult.value.total : 0;

			return {
				jsonDataCount,
				commitsCount,
				dbStatus: "connected",
				totalRecords: jsonDataCount + commitsCount,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				jsonDataCount: 0,
				commitsCount: 0,
				dbStatus: "error",
				totalRecords: 0,
				timestamp: new Date().toISOString(),
				error: error.message,
			};
		}
	}
}
