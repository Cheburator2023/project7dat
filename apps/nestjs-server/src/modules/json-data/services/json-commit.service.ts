/** biome-ignore-all lint/security/noGlobalEval: <explanation> */
import {
	BadRequestException,
	Injectable,
	NotFoundException,
	Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
	JsonCommitEntity,
	type CommitChangesData,
} from "../entities/json-commit.entity";
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

		// Вычисляем структурированные изменения (для initial commit - все добавлено)
		const changes = this.calculateStructuredChanges(null, initialData);

		const jsonData = await this.jsonDataRepository.findOne({
			where: { id: graphId },
		});
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${graphId} не найден`);
		}
		const graphName = jsonData.name;

		const commit = this.commitRepository.create({
			message,
			diff,
			changes,
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
		const result = {
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

		// Вычисляем структурированные изменения
		const changes = this.calculateStructuredChanges(previousData, newData);

		const jsonData = await this.jsonDataRepository.findOne({
			where: { id: graphId },
		});
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${graphId} не найден`);
		}
		const graphName = jsonData.name;

		const commit = this.commitRepository.create({
			message,
			diff,
			changes,
			graphId,
			version: jsonData.version,
			status: "LOADED_VALIDATED",
			createdAt: timestamp,
			authorName: authorName || "System",
		});

		const savedCommit = await this.commitRepository.save(commit);
		console.log(`[JsonCommitService] Коммит сохранен в БД:`, savedCommit.id);
		const result = {
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
			changes: commitData.changes || null,
			graphId,
			createdAt: commitData.createdAt,
		});

		return await this.commitRepository.save(commit);
	}

	/**
	 * Вычисляет структурированные изменения между двумя версиями данных.
	 * Определяет какие entities и mappings были добавлены, удалены или изменены.
	 */
	calculateStructuredChanges(
		previousData: Record<string, any> | null,
		newData: Record<string, any>,
	): CommitChangesData {
		const changes: CommitChangesData = {
			entities: { added: [], removed: [], modified: [] },
			mappings: { added: [], removed: [], modified: [] },
			summary: {
				totalChanges: 0,
				entities: { added: 0, removed: 0, modified: 0 },
				mappings: { added: 0, removed: 0, modified: 0 },
			},
		};

		// Если нет предыдущих данных - все сущности и маппинги добавлены
		if (!previousData) {
			const entities = newData.entities || [];
			const mappings = newData.mappings || [];

			for (const entity of entities) {
				changes.entities.added.push({
					id: entity.id,
					type: entity.type,
					name: entity.name,
					namespace: entity.namespace,
					data: entity,
				});
			}

			for (const mapping of mappings) {
				changes.mappings.added.push({
					id: mapping.id,
					entityId: mapping.entityId,
					data: mapping,
				});
			}

			this.updateSummary(changes);
			return changes;
		}

		// Сравниваем entities
		this.compareEntities(
			previousData.entities || [],
			newData.entities || [],
			changes,
		);

		// Сравниваем mappings
		this.compareMappings(
			previousData.mappings || [],
			newData.mappings || [],
			changes,
		);

		this.updateSummary(changes);
		return changes;
	}

	/**
	 * Сравнивает массивы entities и заполняет структуру изменений
	 */
	private compareEntities(
		oldEntities: any[],
		newEntities: any[],
		changes: CommitChangesData,
	): void {
		const oldMap = new Map<string, any>();
		const newMap = new Map<string, any>();

		for (const entity of oldEntities) {
			if (entity?.id) oldMap.set(entity.id, entity);
		}

		for (const entity of newEntities) {
			if (entity?.id) newMap.set(entity.id, entity);
		}

		// Найти добавленные и измененные
		for (const [id, newEntity] of newMap.entries()) {
			const oldEntity = oldMap.get(id);

			if (!oldEntity) {
				// Добавлена новая сущность
				changes.entities.added.push({
					id: newEntity.id,
					type: newEntity.type,
					name: newEntity.name,
					namespace: newEntity.namespace,
					data: newEntity,
				});
			} else {
				// Проверяем изменения
				const fieldChanges = this.compareObjects(oldEntity, newEntity);
				if (fieldChanges.length > 0) {
					changes.entities.modified.push({
						id: newEntity.id,
						type: newEntity.type,
						name: newEntity.name,
						changes: fieldChanges,
						oldData: oldEntity,
						newData: newEntity,
					});
				}
			}
		}

		// Найти удаленные
		for (const [id, oldEntity] of oldMap.entries()) {
			if (!newMap.has(id)) {
				changes.entities.removed.push({
					id: oldEntity.id,
					type: oldEntity.type,
					name: oldEntity.name,
				});
			}
		}
	}

	/**
	 * Сравнивает массивы mappings и заполняет структуру изменений
	 */
	private compareMappings(
		oldMappings: any[],
		newMappings: any[],
		changes: CommitChangesData,
	): void {
		const oldMap = new Map<number, any>();
		const newMap = new Map<number, any>();

		for (const mapping of oldMappings) {
			if (mapping?.id !== undefined) oldMap.set(mapping.id, mapping);
		}

		for (const mapping of newMappings) {
			if (mapping?.id !== undefined) newMap.set(mapping.id, mapping);
		}

		// Найти добавленные и измененные
		for (const [id, newMapping] of newMap.entries()) {
			const oldMapping = oldMap.get(id);

			if (!oldMapping) {
				// Добавлен новый маппинг
				changes.mappings.added.push({
					id: newMapping.id,
					entityId: newMapping.entityId,
					data: newMapping,
				});
			} else {
				// Проверяем изменения
				const fieldChanges = this.compareObjects(oldMapping, newMapping);
				if (fieldChanges.length > 0) {
					changes.mappings.modified.push({
						id: newMapping.id,
						entityId: newMapping.entityId,
						changes: fieldChanges,
						oldData: oldMapping,
						newData: newMapping,
					});
				}
			}
		}

		// Найти удаленные
		for (const [id, oldMapping] of oldMap.entries()) {
			if (!newMap.has(id)) {
				changes.mappings.removed.push({
					id: oldMapping.id,
					entityId: oldMapping.entityId,
				});
			}
		}
	}

	/**
	 * Сравнивает два объекта и возвращает список изменений полей
	 */
	private compareObjects(
		oldObj: Record<string, any>,
		newObj: Record<string, any>,
	): Array<{ field: string; oldValue: any; newValue: any }> {
		const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
		const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

		for (const key of allKeys) {
			const oldValue = oldObj[key];
			const newValue = newObj[key];

			// Глубокое сравнение значений
			if (!this.deepEqual(oldValue, newValue)) {
				changes.push({
					field: key,
					oldValue,
					newValue,
				});
			}
		}

		return changes;
	}

	/**
	 * Глубокое сравнение двух значений
	 */
	private deepEqual(a: any, b: any): boolean {
		if (a === b) return true;
		if (a === null || b === null) return a === b;
		if (typeof a !== typeof b) return false;

		if (typeof a === "object") {
			if (Array.isArray(a) !== Array.isArray(b)) return false;

			if (Array.isArray(a)) {
				if (a.length !== b.length) return false;
				return a.every((item, index) => this.deepEqual(item, b[index]));
			}

			const keysA = Object.keys(a);
			const keysB = Object.keys(b);
			if (keysA.length !== keysB.length) return false;

			return keysA.every((key) => this.deepEqual(a[key], b[key]));
		}

		return false;
	}

	/**
	 * Обновляет summary в структуре изменений
	 */
	private updateSummary(changes: CommitChangesData): void {
		changes.summary.entities.added = changes.entities.added.length;
		changes.summary.entities.removed = changes.entities.removed.length;
		changes.summary.entities.modified = changes.entities.modified.length;
		changes.summary.mappings.added = changes.mappings.added.length;
		changes.summary.mappings.removed = changes.mappings.removed.length;
		changes.summary.mappings.modified = changes.mappings.modified.length;
		changes.summary.totalChanges =
			changes.summary.entities.added +
			changes.summary.entities.removed +
			changes.summary.entities.modified +
			changes.summary.mappings.added +
			changes.summary.mappings.removed +
			changes.summary.mappings.modified;
	}
}
