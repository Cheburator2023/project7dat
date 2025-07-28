/** biome-ignore-all lint/security/noGlobalEval: <explanation> */
import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonDataEntity } from "../entities/json-data.entity";
import { GetCommitListInput } from "../schemas/json-commit.schema";
import { createHash } from "crypto";

@Injectable()
export class JsonCommitService {
	private isProduction: boolean;
	private memoryCommits: Map<string, any[]> = new Map();
	private differ: any;
	private jsondiffpatch: any;

	constructor(
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly configService: ConfigService,
	) {
		this.isProduction = this.configService.get("NODE_ENV") === "production";
		this.initializeJsonDiffPatch();
	}

	private async initializeJsonDiffPatch() {
		const jsondiffpatchModule = await eval('import("jsondiffpatch")');
		console.log(
			"🚀 ~ JsonCommitService ~ initializeJsonDiffPatch ~ jsondiffpatchModule:",
			jsondiffpatchModule,
		);
		this.jsondiffpatch = jsondiffpatchModule.default || jsondiffpatchModule;
		this.differ = this.jsondiffpatch.create({
			objectHash: (obj: any) => obj.id || obj.name || JSON.stringify(obj),
			arrays: {
				detectMove: true,
				includeValueOnMove: false,
			},
		});
	}

	private async ensureDifferInitialized() {
		if (!this.differ) {
			await this.initializeJsonDiffPatch();
		}
	}

	private generateUniqueCommitHash(
		message: string,
		diff: Record<string, any>,
		timestamp: Date,
	): string {
		const content = JSON.stringify({
			message,
			diff,
			timestamp: timestamp.toISOString(),
		});
		return createHash("sha256").update(content).digest("hex").substring(0, 8);
	}

	private async getLastCommit(graphId: string): Promise<any | null> {
		if (this.isProduction) {
			return await this.commitRepository.findOne({
				where: { graphId },
				order: { createdAt: "DESC" },
			});
		}

		const commits = this.memoryCommits.get(graphId) || [];
		if (commits.length === 0) return null;
		return commits[commits.length - 1];
	}

	private async calculateDiffFromPrevious(
		previousData: Record<string, any> | null,
		newData: Record<string, any>,
	): Promise<Record<string, any> | null> {
		if (!previousData) {
			// First commit - store full data as diff
			return { _type: "initial", data: newData };
		}

		await this.ensureDifferInitialized();
		const delta = this.differ.diff(previousData, newData);
		return delta || null;
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
				reconstructedData = commit.diff.data;
			} else {
				reconstructedData =
					this.differ.patch(reconstructedData, commit.diff) ||
					reconstructedData;
			}
		}

		return reconstructedData;
	}

	private async getAllCommitsForGraph(graphId: string): Promise<any[]> {
		if (this.isProduction) {
			return await this.commitRepository.find({
				where: { graphId },
				order: { createdAt: "ASC" },
			});
		}

		const commits = this.memoryCommits.get(graphId) || [];
		return [...commits].sort(
			(a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		);
	}

	async createInitialCommit(
		graphId: string,
		message: string,
		initialData: Record<string, any>,
	): Promise<any> {
		console.log(
			`[JsonCommitService] Создание начального коммита для graphId: ${graphId}`,
		);
		const timestamp = new Date();

		// Create initial commit with full data
		const diff = { _type: "initial", data: initialData };
		const hash = this.generateUniqueCommitHash(message, diff, timestamp);

		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({
				where: { id: graphId },
			});
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${graphId} не найден`);
			}

			const commit = this.commitRepository.create({
				hash,
				message,
				diff,
				graphId,
				createdAt: timestamp,
			});

			const savedCommit = await this.commitRepository.save(commit);
			console.log(
				`[JsonCommitService] Начальный коммит сохранен в БД:`,
				savedCommit.id,
			);
			return savedCommit;
		}

		if (!this.memoryCommits.has(graphId)) {
			this.memoryCommits.set(graphId, []);
		}

		const commit = {
			id: `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			hash,
			message,
			diff,
			graphId,
			createdAt: timestamp,
		};

		this.memoryCommits.get(graphId)!.push(commit);
		console.log(
			`[JsonCommitService] Начальный коммит добавлен в память:`,
			commit.id,
		);
		return commit;
	}

	async createNewCommit(
		graphId: string,
		message: string,
		newData: Record<string, any>,
	): Promise<any> {
		console.log(`[JsonCommitService] Создание коммита для graphId: ${graphId}`);
		const timestamp = new Date();

		// Get the last commit to calculate diff from
		const lastCommit = await this.getLastCommit(graphId);
		if (!lastCommit) {
			throw new Error(
				"No previous commits found. Use createInitialCommit for the first commit.",
			);
		}

		const previousData = await this.reconstructDataFromCommits(graphId);

		// Calculate proper diff from previous commit
		const diff = await this.calculateDiffFromPrevious(previousData, newData);
		if (!diff) {
			throw new Error("Нет изменений для создания коммита");
		}

		const hash = this.generateUniqueCommitHash(message, diff, timestamp);

		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({
				where: { id: graphId },
			});
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${graphId} не найден`);
			}

			const commit = this.commitRepository.create({
				hash,
				message,
				diff,
				graphId,
				createdAt: timestamp,
			});

			const savedCommit = await this.commitRepository.save(commit);
			console.log(`[JsonCommitService] Коммит сохранен в БД:`, savedCommit.id);
			return savedCommit;
		}

		if (!this.memoryCommits.has(graphId)) {
			this.memoryCommits.set(graphId, []);
		}

		const commit = {
			id: `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			hash,
			message,
			diff,
			graphId,
			createdAt: timestamp,
		};

		this.memoryCommits.get(graphId)!.push(commit);
		console.log(`[JsonCommitService] Коммит добавлен в память:`, commit.id);
		console.log(
			`[JsonCommitService] Всего коммитов для graphId ${graphId}:`,
			this.memoryCommits.get(graphId)!.length,
		);
		return commit;
	}

	private async enrichCommitWithFullData(commit: any): Promise<any> {
		const fullData = await this.reconstructDataFromCommits(commit.graphId);
		return {
			...commit,
			fullData: fullData || {},
		};
	}

	private async enrichCommitsWithFullData(commits: any[]): Promise<any[]> {
		const graphDataCache = new Map<string, Record<string, any> | null>();
		const enrichedCommits: any[] = [];

		for (const commit of commits) {
			let fullData = graphDataCache.get(commit.graphId);
			if (fullData === undefined) {
				fullData = await this.reconstructDataFromCommits(commit.graphId);
				graphDataCache.set(commit.graphId, fullData);
			}

			enrichedCommits.push({
				...commit,
				fullData: fullData || {},
			});
		}
		return enrichedCommits;
	}

	async getCommitsWithPagination(
		input: GetCommitListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, graphId } = input;
		console.log(
			`[JsonCommitService] Получение коммитов для graphId: ${graphId}, page: ${page}, limit: ${limit}`,
		);
		const skip = (page - 1) * limit;

		if (this.isProduction) {
			const whereCondition = graphId ? { graphId: graphId } : {};

			const [data, total] = await this.commitRepository.findAndCount({
				where: whereCondition,
				skip,
				take: limit,
				order: { createdAt: "DESC" },
			});

			console.log(`[JsonCommitService] Найдено коммитов в БД: ${total}`);
			const enrichedData = await this.enrichCommitsWithFullData(data);
			return { data: enrichedData, total };
		}

		let allCommits: any[] = [];
		if (graphId) {
			allCommits = this.memoryCommits.get(graphId) || [];
			console.log(
				`[JsonCommitService] Коммиты для graphId ${graphId} из памяти:`,
				allCommits.length,
			);
		} else {
			for (const commits of this.memoryCommits.values()) {
				allCommits.push(...commits);
			}
			console.log(
				`[JsonCommitService] Все коммиты из памяти:`,
				allCommits.length,
			);
		}

		console.log(
			`[JsonCommitService] Все ключи в memoryCommits:`,
			Array.from(this.memoryCommits.keys()),
		);

		allCommits.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		const total = allCommits.length;
		const data = allCommits.slice(skip, skip + limit);

		console.log(
			`[JsonCommitService] Возвращаем коммитов: ${data.length} из ${total}`,
		);
		const enrichedData = await this.enrichCommitsWithFullData(data);
		return { data: enrichedData, total };
	}

	async findCommitById(id: string): Promise<any> {
		if (this.isProduction) {
			const commit = await this.commitRepository.findOne({ where: { id } });
			if (!commit) {
				throw new NotFoundException(`Коммит с ID ${id} не найден`);
			}
			return await this.enrichCommitWithFullData(commit);
		}

		for (const commits of this.memoryCommits.values()) {
			const commit = commits.find((c) => c.id === id);
			if (commit) {
				return await this.enrichCommitWithFullData(commit);
			}
		}

		throw new NotFoundException(`Коммит с ID ${id} не найден`);
	}

	async getCurrentStateFromCommits(
		graphId: string,
	): Promise<Record<string, any> | null> {
		console.log(
			`[JsonCommitService] Восстановление текущего состояния для graphId: ${graphId}`,
		);
		return await this.reconstructDataFromCommits(graphId);
	}

	async verifyDataIntegrity(
		graphId: string,
		expectedData: Record<string, any>,
	): Promise<boolean> {
		const reconstructedData = await this.reconstructDataFromCommits(graphId);
		if (!reconstructedData) return false;

		return JSON.stringify(reconstructedData) === JSON.stringify(expectedData);
	}

	async getCommitChainInfo(graphId: string): Promise<{
		totalCommits: number;
		firstCommit: any | null;
		lastCommit: any | null;
		chainSize: number;
	}> {
		const commits = await this.getAllCommitsForGraph(graphId);
		const chainSize = JSON.stringify(commits).length;

		return {
			totalCommits: commits.length,
			firstCommit: commits.length > 0 ? commits[0] : null,
			lastCommit: commits.length > 0 ? commits[commits.length - 1] : null,
			chainSize,
		};
	}
}
