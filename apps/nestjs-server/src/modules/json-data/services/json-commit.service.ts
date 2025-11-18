/** biome-ignore-all lint/security/noGlobalEval: <explanation> */
import {
	BadRequestException,
	Injectable,
	NotFoundException,
	Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonDataEntity } from "../entities/json-data.entity";
import { GetCommitListInput } from "../schemas/json-commit.schema";
import * as fuzzysort from "fuzzysort";
import { ChangelogService } from "../../changelog/services/changelog.service";
import { fastStringify, jsonCompare } from "src/shared/src";

@Injectable()
export class JsonCommitService {
	private differ: any;
	private jsondiffpatch: any;

	constructor(
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly changelogService: ChangelogService,
	) {
		this.initializeJsonDiffPatch();
	}

	private generateShortId(id: string): string {
		// Generate a short ID from the full hash for display purposes
		return id.substring(0, 8);
	}

	private async getLastCommit(graphId: string): Promise<any | null> {
		return await this.commitRepository.findOne({
			where: { graphId },
			order: { createdAt: "DESC" },
		});
	}

	async reconstructDataFromCommits(
		graphId: string,
	): Promise<Record<string, any> | null> {
		const commits = await this.getAllCommitsForGraph(graphId);
		if (commits.length === 0) return null;

		await this.ensureDifferInitialized();
		let reconstructedData: Record<string, any> = {};

		for (const commit of commits) {
			if (commit.diff._type === "initial") {
				reconstructedData = JSON.parse(JSON.stringify(commit.diff.data));
			} else {
				try {
					const clonedData = JSON.parse(JSON.stringify(reconstructedData));
					const patchResult = this.differ.patch(clonedData, commit.diff);
					if (patchResult !== undefined && patchResult !== null) {
						reconstructedData = patchResult;
					}
				} catch (error) {
					console.error(
						`[JsonCommitService] Ошибка применения патча для коммита ${commit.id}:`,
						error,
					);
				}
			}
		}

		return reconstructedData;
	}

	private async getAllCommitsForGraph(graphId: string): Promise<any[]> {
		return await this.commitRepository.find({
			where: { graphId },
			order: { createdAt: "ASC" },
		});
	}

	async createInitialCommit(
		graphId: string,
		message: string,
		initialData: Record<string, any>,
		authorName?: string,
	): Promise<any> {
		console.log(
			`[JsonCommitService] Создание начального коммита для graphId: ${graphId}`,
		);
		if (this.calculateDataSize(initialData) > 50 * 1024 * 1024) {
			throw new BadRequestException("Размер данных превышает допустимый лимит");
		}

		const timestamp = new Date();

		// Create initial commit with full data
		const diff = { _type: "initial", data: initialData };
		let result: any;
		let graphName = "";

		const jsonData = await this.jsonDataRepository.findOne({
			where: { id: graphId },
		});
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${graphId} не найден`);
		}
		graphName = jsonData.name;

		const commit = this.commitRepository.create({
			message,
			diff,
			graphId,
			version: jsonData.version,
			status: "LOADED_VALIDATED",
			createdAt: timestamp,
			authorName: authorName || "System",
		});

		const savedCommit = await this.commitRepository.save(commit);
		console.log(
			`[JsonCommitService] Начальный коммит сохранен в БД:`,
			savedCommit.id,
		);
		result = {
			...savedCommit,
			short_id: this.generateShortId(savedCommit.id),
		};

		await this.changelogService.logCommitCreated(
			graphId,
			graphName,
			result.id,
			message,
			authorName || "System",
		);

		return result;
	}

	async createNewCommit(
		graphId: string,
		message: string,
		newData: Record<string, any>,
		authorName?: string,
	): Promise<any> {
		console.log(`[JsonCommitService] Создание коммита для graphId: ${graphId}`);
		const timestamp = new Date();

		const lastCommit = await this.getLastCommit(graphId);
		if (!lastCommit) {
			throw new Error(
				"No previous commits found. Use createInitialCommit for the first commit.",
			);
		}

		const previousData = await this.reconstructDataFromCommits(graphId);
		await this.ensureDifferInitialized();

		const diff = await this.calculateDiffFromPrevious(previousData, newData);

		console.log("New data:", JSON.stringify(newData, null, 2));
		console.log("Previous data:", JSON.stringify(previousData, null, 2));
		console.log("Calculated diff:", diff);
		if (!diff || (diff._t === "object" && Object.keys(diff).length === 0)) {
			console.log("[JsonCommitService] Нет изменений для коммита");
			throw new BadRequestException(
				"No changes detected to create a new commit",
			);
		}

		let result: any;
		let graphName = "";

		const jsonData = await this.jsonDataRepository.findOne({
			where: { id: graphId },
		});
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${graphId} не найден`);
		}
		graphName = jsonData.name;

		const commit = this.commitRepository.create({
			message,
			diff,
			graphId,
			version: jsonData.version,
			status: "LOADED_VALIDATED",
			createdAt: timestamp,
			authorName: authorName || "System",
		});

		const savedCommit = await this.commitRepository.save(commit);
		console.log(`[JsonCommitService] Коммит сохранен в БД:`, savedCommit.id);
		result = {
			...savedCommit,
			short_id: this.generateShortId(savedCommit.id),
		};

		await this.changelogService.logCommitCreated(
			graphId,
			graphName,
			result.id,
			message,
			authorName || "System",
		);

		return result;
	}

	private async enrichCommitWithFullData(commit: any): Promise<any> {
		const fullData = await this.reconstructDataFromCommits(commit.graphId);
		return {
			...commit,
			fullData: fullData || {},
			short_id: this.generateShortId(commit.id),
		};
	}

	async getCommitsWithPagination(
		input: GetCommitListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, graphId } = input;
		console.log(
			`[JsonCommitService] Получение коммитов для graphId: ${graphId}, page: ${page}, limit: ${limit}`,
		);
		const skip = (page - 1) * limit;

		const whereCondition = graphId ? { graphId: graphId } : {};

		const [data, total] = await this.commitRepository.findAndCount({
			where: whereCondition,
			skip,
			take: limit,
			order: { createdAt: "DESC" },
		});

		console.log(`[JsonCommitService] Найдено коммитов в БД: ${total}`);

		const enrichedData = data.map((commit) => ({
			...commit,
			short_id: this.generateShortId(commit.id),
		}));
		return { data: enrichedData, total };
	}

	async findCommitById(id: string): Promise<any> {
		console.log(`[JsonCommitService] Поиск коммита по ID: ${id}`);

		const commit = await this.commitRepository.findOne({
			where: { id },
			relations: ["jsonData"],
		});

		if (!commit) {
			console.log(`[JsonCommitService] Коммит с ID ${id} не найден в БД`);
			throw new NotFoundException(`Коммит с ID ${id} не найден`);
		}

		console.log(`[JsonCommitService] Коммит найден в БД:`, commit.id);
		return await this.enrichCommitWithFullData(commit);
	}

	async updateCommitStatus(id: string, status: string): Promise<any> {
		await this.commitRepository.update(id, { status });
		return this.commitRepository.findOne({ where: { id } });
	}

	async getCommitQueue(): Promise<any[]> {
		return this.commitRepository.find({
			where: { status: "IN_PROGRESS" },
			order: { createdAt: "ASC" },
		});
	}

	async getCurrentStateFromCommits(
		graphId: string,
	): Promise<Record<string, any> | null> {
		console.log(
			`[JsonCommitService] Восстановление текущего состояния для graphId: ${graphId}`,
		);
		return await this.reconstructDataFromCommits(graphId);
	}

	async getCumulativeDataAtCommit(
		commitId: string,
	): Promise<Record<string, any> | null> {
		// Get the target commit first to determine the graphId
		const targetCommit = await this.findCommitById(commitId);
		if (!targetCommit) {
			throw new NotFoundException(`Commit with ID ${commitId} not found`);
		}

		const graphId = targetCommit.graphId;
		console.log(
			`[JsonCommitService] Восстановление данных на момент коммита ${commitId} для graphId: ${graphId}`,
		);

		const allCommits = await this.getAllCommitsForGraph(graphId);
		if (allCommits.length === 0) return null;

		// Find the target commit
		const targetCommitIndex = allCommits.findIndex(
			(commit) => commit.id === commitId,
		);
		if (targetCommitIndex === -1) {
			throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
		}

		// Get commits up to and including the target commit
		const commitsUpToTarget = allCommits.slice(0, targetCommitIndex + 1);

		await this.ensureDifferInitialized();
		let reconstructedData: Record<string, any> = {};

		for (const commit of commitsUpToTarget) {
			if (commit.diff._type === "initial") {
				reconstructedData = JSON.parse(JSON.stringify(commit.diff.data));
			} else {
				try {
					const clonedData = JSON.parse(JSON.stringify(reconstructedData));
					const patchResult = this.differ.patch(clonedData, commit.diff);
					if (patchResult !== undefined && patchResult !== null) {
						reconstructedData = patchResult;
					}
				} catch (error) {
					console.error(
						`[JsonCommitService] Ошибка применения патча для коммита ${commit.id}:`,
						error,
					);
				}
			}
		}

		return reconstructedData;
	}

	async verifyDataIntegrity(
		graphId: string,
		expectedData: Record<string, any>,
	): Promise<boolean> {
		const reconstructedData = await this.reconstructDataFromCommits(graphId);
		if (!reconstructedData) return false;

		return jsonCompare(reconstructedData, expectedData);
	}

	async searchCommits(
		graphId: string,
		searchParams: {
			dateFrom?: string;
			dateTo?: string;
			user?: string;
			query?: string;
			page?: number;
			limit?: number;
		},
	): Promise<{ data: any[]; total: number }> {
		const {
			dateFrom,
			dateTo,
			user,
			query,
			page = 1,
			limit = 10,
		} = searchParams;

		let commits = await this.getAllCommitsForGraph(graphId);
		console.log(
			"🐸 Pepe said >> JsonCommitService >> searchCommits >> commits:",
			commits,
		);

		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			commits = commits.filter(
				(commit) => new Date(commit.createdAt) >= fromDate,
			);
		}

		if (dateTo) {
			const toDate = new Date(dateTo);
			commits = commits.filter(
				(commit) => new Date(commit.createdAt) <= toDate,
			);
		}

		if (user) {
			const userQuery = user.toLowerCase();
			const userResults = fuzzysort.go(userQuery, commits, {
				keys: ["author.username", "author.email"],
				threshold: -10000,
			});
			commits = userResults.map((result) => result.obj);
		}

		if (query) {
			const commitsWithStringifiedDiff = commits.map((commit) => ({
				...commit,
				diffString: fastStringify(commit.diff),
			}));

			const fuzzyResults = fuzzysort.go(query, commitsWithStringifiedDiff, {
				keys: ["message", "id", "short_id", "diffString"],
				threshold: -10000,
				limit: 1000,
			});
			commits = fuzzyResults.map((result) => result.obj);
		}

		commits.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		const total = commits.length;
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedCommits = commits.slice(startIndex, endIndex);

		const enrichedCommits = paginatedCommits.map((commit) => ({
			...commit,
			short_id: this.generateShortId(commit.id),
		}));

		return {
			data: enrichedCommits,
			total,
		};
	}

	async getCommitChainInfo(graphId: string): Promise<{
		totalCommits: number;
		firstCommit: any | null;
		lastCommit: any | null;
		chainSize: number;
	}> {
		const commits = await this.getAllCommitsForGraph(graphId);
		const chainSize = fastStringify(commits).length;

		return {
			totalCommits: commits.length,
			firstCommit: commits.length > 0 ? commits[0] : null,
			lastCommit: commits.length > 0 ? commits[commits.length - 1] : null,
			chainSize,
		};
	}

	private async initializeJsonDiffPatch() {
		const jsondiffpatchModule = await eval('import("jsondiffpatch")');

		this.jsondiffpatch = jsondiffpatchModule.default || jsondiffpatchModule;
		this.differ = this.jsondiffpatch.create({
			objectHash: (obj: any) => obj.id || obj.name || fastStringify(obj),
			arrays: {
				detectMove: true,
				includeValueOnMove: false,
			},
		});
	}

	private calculateDataSize(data: any): number {
		return Buffer.byteLength(JSON.stringify(data), "utf8");
	}

	private async ensureDifferInitialized() {
		if (!this.differ) {
			await this.initializeJsonDiffPatch();
		}
	}

	private async calculateDiffFromPrevious(
		previousData: Record<string, any> | null,
		newData: Record<string, any>,
	): Promise<Record<string, any> | null> {
		if (!previousData) {
			return { _type: "initial", data: newData };
		}

		await this.ensureDifferInitialized();

		if (JSON.stringify(previousData) === JSON.stringify(newData)) {
			return null;
		}

		const delta = this.differ.diff(previousData, newData);
		return delta || null;
	}

	async getAllCommitsFromAllGraphs(params?: {
		page?: number;
		limit?: number;
		dateFrom?: string;
		dateTo?: string;
		user?: string;
		query?: string;
	}): Promise<{ data: any[]; total: number; page: number; limit: number }> {
		const {
			page = 1,
			limit = 10,
			dateFrom,
			dateTo,
			user,
			query,
		} = params || {};

		let allCommits: any[] = await this.commitRepository.find({
			order: { createdAt: "DESC" },
		});

		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			allCommits = allCommits.filter(
				(commit) => new Date(commit.createdAt) >= fromDate,
			);
		}

		if (dateTo) {
			const toDate = new Date(dateTo);
			allCommits = allCommits.filter(
				(commit) => new Date(commit.createdAt) <= toDate,
			);
		}

		if (user) {
			const userQuery = user.toLowerCase();
			const userResults = fuzzysort.go(userQuery, allCommits, {
				keys: ["author.username", "author.email"],
				threshold: -10000,
			});
			allCommits = userResults.map((result) => result.obj);
		}

		if (query) {
			const commitsWithStringifiedDiff = allCommits.map((commit) => ({
				...commit,
				diffString: fastStringify(commit.diff),
			}));

			const fuzzyResults = fuzzysort.go(query, commitsWithStringifiedDiff, {
				keys: ["message", "id", "short_id", "diffString"],
				threshold: -10000,
				limit: 1000,
			});
			allCommits = fuzzyResults.map((result) => result.obj);
		}

		const total = allCommits.length;
		const skip = (page - 1) * limit;
		const paginatedCommits = allCommits.slice(skip, skip + limit);

		const enrichedCommits = await Promise.all(
			paginatedCommits.map(async (commit) => {
				const fullData = await this.reconstructDataFromCommits(commit.graphId);
				return {
					...commit,
					fullData: fullData || {},
					short_id: this.generateShortId(commit.id),
				};
			}),
		);

		return {
			data: enrichedCommits,
			total,
			page,
			limit,
		};
	}

	async getCommitsForGraph(graphId: string): Promise<any[]> {
		return await this.getAllCommitsForGraph(graphId);
	}

	async createCommitFromSnapshot(
		graphId: string,
		commitData: any,
	): Promise<any> {
		console.log(
			`[JsonCommitService] Восстановление коммита ${commitData.id} для JSONа ${graphId}`,
		);

		const existingCommit = await this.commitRepository.findOne({
			where: { id: commitData.id },
		});

		if (existingCommit) {
			console.log(`[JsonCommitService] Коммит ${commitData.id} уже существует`);
			return existingCommit;
		}

		const commit = this.commitRepository.create({
			id: commitData.id,
			message: commitData.message,
			diff: commitData.diff,
			graphId,
			createdAt: commitData.createdAt,
		});

		return await this.commitRepository.save(commit);
	}
}
