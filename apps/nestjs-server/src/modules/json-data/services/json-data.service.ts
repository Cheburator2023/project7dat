import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JsonDataEntity } from "../entities/json-data.entity";
import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListInput,
} from "../schemas/json-data.schema";
import { CommitJsonDataInput } from "../schemas/json-commit.schema";
import { MemoryStorageService } from "../../../core/shared/database/service/memory-storage.service";
import { JsonCommitService } from "./json-commit.service";
import { VersionInfoDto } from "../dto/version-info.dto";
import { JsonCommitEntity } from "../entities/json-commit.entity";

@Injectable()
export class JsonDataService {
	private isProduction?: boolean;
	private memoryCommits: Map<string, any[]> = new Map();

	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		private readonly configService: ConfigService,
		private readonly memoryStorageService: MemoryStorageService,
		private readonly jsonCommitService: JsonCommitService,
	) {
		this.isProduction = this.configService.get<boolean>("app.isProduction");
	}

	async createGraphData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const name = input.name || `График ${new Date().toLocaleString("ru-RU")}`;
		const description =
			input.description || "Сохранённое состояние графика данных";

		if (this.isProduction) {
			const jsonData = new JsonDataEntity();
			jsonData.name = name;
			jsonData.data = input.data;
			jsonData.description = description;
			jsonData.authorName = input.authorName || "System";

			return this.jsonDataRepository.save(jsonData);
		}

		return await this.memoryStorageService.create(
			name,
			input.data,
			description,
			input.authorName || "System",
		);
	}

	async getAllGraphsWithPagination(
		input: GetJsonDataListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, search } = input;
		const skip = (page - 1) * limit;

		if (this.isProduction) {
			const whereCondition = search
				? [{ name: Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
				: {};

			const [data, total] = await this.jsonDataRepository.findAndCount({
				where: whereCondition,
				skip,
				take: limit,
				order: { createdAt: "DESC" },
			});

			return { data, total };
		}

		const allData = await this.memoryStorageService.findAll();

		let filteredData = allData;
		if (search) {
			filteredData = allData.filter(
				(item) =>
					item.name.toLowerCase().includes(search.toLowerCase()) ||
					(item.description &&
						item.description.toLowerCase().includes(search.toLowerCase())),
			);
		}

		const total = filteredData.length;
		const data = filteredData.slice(skip, skip + limit);

		return { data, total };
	}

	async getGraphDataById(id: string): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${id} не найден`);
			}
			return jsonData;
		}

		const result = await this.memoryStorageService.findById(id);
		if (!result) {
			throw new NotFoundException(`График с ID ${id} не найден`);
		}
		return result;
	}

	async findGraphDataByIdOrNull(id: string): Promise<any | null> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			return jsonData || null;
		}

		const result = await this.memoryStorageService.findById(id);
		return result || null;
	}

	async getLatestGraphData(): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({
				order: { createdAt: "DESC" },
			});
			if (!jsonData) {
				return undefined;
			}
			return jsonData;
		}

		const result = await this.memoryStorageService.findLatest();
		if (!result) {
			return undefined;
		}
		return result;
	}

	async updateGraphData(
		id: string,
		input: UpdateJsonDataInput & { authorName?: string },
	): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${id} не найден`);
			}

			if (input.data) jsonData.data = input.data;
			if (input.name) jsonData.name = input.name;
			if (input.description) jsonData.description = input.description;
			if (input.authorName) jsonData.authorName = input.authorName;
			jsonData.updatedAt = new Date();

			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.memoryStorageService.update(id, {
			...input,
		});
		if (!result) {
			throw new NotFoundException(`График с ID ${id} не найден`);
		}
		return result;
	}

	async initializeGraphWithData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const graphData = await this.createGraphData(input);

		await this.jsonCommitService.createInitialCommit(
			graphData.id,
			"Initial commit",
			input.data,
			input.authorName,
		);

		return graphData;
	}

	async createCommitForCurrentGraph(
		commitInput: CommitJsonDataInput & { authorName?: string },
	): Promise<any> {
		let currentData = await this.getLatestGraphData();

		if (!currentData) {
			throw new NotFoundException(
				"No graph data found. Please initialize a graph first.",
			);
		}

		const updateInput: UpdateJsonDataInput & { authorName?: string } = {
			data: commitInput.data,
			authorName: commitInput.authorName,
		};
		currentData = await this.updateGraphData(currentData.id, updateInput);

		// Check if there are any existing commits for this graph
		const existingCommits =
			await this.jsonCommitService.getCommitsWithPagination({
				page: 1,
				limit: 1,
				graphId: currentData.id,
			});

		if (existingCommits.total === 0) {
			// No commits exist, create initial commit
			await this.jsonCommitService.createInitialCommit(
				currentData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);
		} else {
			// Commits exist, create new commit
			await this.jsonCommitService.createNewCommit(
				currentData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);
		}

		return currentData;
	}

	async updateGraphWithCommit(
		id: string,
		commitInput: CommitJsonDataInput & { authorName?: string },
	): Promise<any> {
		console.log(
			`[JsonDataService] updateGraphWithCommit вызван для graphId: ${id}`,
		);
		const existingData = await this.findGraphDataByIdOrNull(id);

		if (!existingData) {
			console.log(
				`[JsonDataService] График с ID ${id} не найден, создаем новый`,
			);
			const name = `График ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный график для коммита";
			const newGraphData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
				authorName: commitInput.authorName,
			});

			console.log(
				`[JsonDataService] Создан новый график с ID: ${newGraphData.id}`,
			);
			await this.jsonCommitService.createInitialCommit(
				newGraphData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);

			return newGraphData;
		}

		console.log(`[JsonDataService] График с ID ${id} найден, обновляем`);
		const updateInput: UpdateJsonDataInput & { authorName?: string } = {
			data: commitInput.data,
			authorName: commitInput.authorName,
		};

		const updatedData = await this.updateGraphData(id, updateInput);

		console.log(
			`[JsonDataService] График обновлен, создаем коммит для ID: ${id}`,
		);
		await this.jsonCommitService.createNewCommit(
			id,
			commitInput.message,
			commitInput.data,
			commitInput.authorName,
		);

		return updatedData;
	}

	async updateVersionInfo(
		id: string,
		versionInfo: VersionInfoDto,
	): Promise<any> {
		if (this.isProduction) {
			await this.jsonDataRepository.update(id, {
				schemaVersion: versionInfo.schemaVersion,
				deprecated: versionInfo.deprecated,
			});
			return this.jsonDataRepository.findOne({ where: { id } });
		}

		const data = await this.memoryStorageService.findById(id);
		if (data) {
			data.schemaVersion = versionInfo.schemaVersion;
			data.deprecated = versionInfo.deprecated;
			return data;
		}
		throw new NotFoundException(`Data with ID ${id} not found`);
	}

	async getDocumentHistory(
		id: string,
		fromDate?: string,
		toDate?: string,
	): Promise<any[]> {
		if (this.isProduction) {
			const query: any = { graphId: id };

			if (fromDate || toDate) {
				query.createdAt = {};
				if (fromDate) query.createdAt.$gte = new Date(fromDate);
				if (toDate) query.createdAt.$lte = new Date(toDate);
			}

			return this.commitRepository.find({
				where: query,
				order: { createdAt: "DESC" },
			});
		}

		const commits = this.memoryCommits.get(id) || [];

		return commits
			.filter((commit) => {
				const commitDate = new Date(commit.createdAt);
				const afterFrom = !fromDate || commitDate >= new Date(fromDate);
				const beforeTo = !toDate || commitDate <= new Date(toDate);
				return afterFrom && beforeTo;
			})
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
	}

	async deleteGraphData(id: string): Promise<void> {
		if (this.isProduction) {
			const result = await this.jsonDataRepository.delete(id);
			if (result.affected === 0) {
				throw new NotFoundException(`График с ID ${id} не найден`);
			}
			return;
		}

		const success = await this.memoryStorageService.delete(id);
		if (!success) {
			throw new NotFoundException(`График с ID ${id} не найден`);
		}
	}
}
