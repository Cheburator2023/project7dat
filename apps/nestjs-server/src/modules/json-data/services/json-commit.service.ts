/** biome-ignore-all lint/security/noGlobalEval: <explanation> */
import {
	BadRequestException,
	Injectable,
	NotFoundException,
	Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonDataEntity } from "../entities/json-data.entity";
import { GetCommitListInput } from "../schemas/json-commit.schema";
import { createHash } from "crypto";
import { fastStringify, jsonCompare } from "@data-lineage/shared";

@Injectable()
export class JsonCommitService {
	private isProduction?: boolean;
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
		this.isProduction = this.configService.get<boolean>("app.isProduction");
		this.initializeJsonDiffPatch();
		if (!this.isProduction) {
			console.log("[JsonCommitService] Работаем в memory-режиме");
			console.log(
				"Текущие коммиты в памяти:",
				Array.from(this.memoryCommits.keys()),
			);
		}
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
				schemaVersion: jsonData.schemaVersion,
				status: "LOADED_VALIDATED",
				createdAt: timestamp,
				authorName: authorName || "System",
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
			authorName: authorName || "System",
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
				schemaVersion: jsonData.schemaVersion,
				status: "LOADED_VALIDATED",
				createdAt: timestamp,
				authorName: authorName || "System",
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
			schemaVersion: "1.0.0",
			status: "LOADED_VALIDATED",
			createdAt: timestamp,
			authorName: authorName || "System",
		};

		this.memoryCommits.get(graphId)!.push(commit);
		console.log(`[JsonCommitService] Коммит добавлен в память:`, commit.id);
		return commit;
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
		console.log(`[JsonCommitService] Поиск коммита по ID: ${id}`);

		if (this.isProduction) {
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

		// Поиск в memory-хранилище
		for (const commits of this.memoryCommits.values()) {
			const commit = commits.find((c) => c.id === id);
			if (commit) {
				console.log(`[JsonCommitService] Коммит найден в памяти:`, commit.id);
				return await this.enrichCommitWithFullData(commit);
			}
		}

		console.log(`[JsonCommitService] Коммит с ID ${id} не найден в памяти`);
		throw new NotFoundException(`Коммит с ID ${id} не найден`);
	}

	async updateCommitStatus(id: string, status: string): Promise<any> {
		if (this.isProduction) {
			await this.commitRepository.update(id, { status });
			return this.commitRepository.findOne({ where: { id } });
		}

		const commits = Array.from(this.memoryCommits.values()).flat();
		const commit = commits.find((c) => c.id === id);
		if (commit) {
			commit.status = status;
			return commit;
		}
		throw new NotFoundException(`Commit with ID ${id} not found`);
	}

	async getCommitQueue(): Promise<any[]> {
		if (this.isProduction) {
			return this.commitRepository.find({
				where: { status: "IN_PROGRESS" },
				order: { createdAt: "ASC" },
			});
		}

		return Array.from(this.memoryCommits.values())
			.flat()
			.filter((c) => c.status === "IN_PROGRESS")
			.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			);
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

		return jsonCompare(reconstructedData, expectedData);
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

	private isValidUuid(id: string): boolean {
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return uuidRegex.test(id);
	}

	private generateUniqueCommitHash(
		message: string,
		diff: Record<string, any>,
		timestamp: Date,
	): string {
		const content = fastStringify({
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
			return { _type: "initial", data: newData };
		}

		await this.ensureDifferInitialized();

		if (JSON.stringify(previousData) === JSON.stringify(newData)) {
			return null;
		}

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
}
