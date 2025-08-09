import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { JsonDataEntity } from "../entities/json-data.entity";
import {
	CreateJsonDataInput,
	GetJsonDataListInput,
	UpdateJsonDataInput,
} from "../schemas/json-data.schema";
import { CommitJsonDataInput } from "../schemas/json-commit.schema";
import { MemoryStorageService } from "../../../core/shared/database/service/memory-storage.service";
import { JsonCommitService } from "./json-commit.service";

@Injectable()
export class JsonDataService {
	private isProduction?: boolean;

	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly configService: ConfigService,
		private readonly memoryStorageService: MemoryStorageService,
		private readonly jsonCommitService: JsonCommitService,
	) {
		this.isProduction = this.configService.get<boolean>("app.isProduction");
	}

	async createGraphData(input: CreateJsonDataInput): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Иннициализация json данных";
		const version = input.version || "1.0.0";

		if (this.isProduction) {
			const jsonData = this.jsonDataRepository.create({
				id: uuidv4(),
				name,
				data: input.data,
				description,
				version,
				isCurrent: false,
			});
			return this.jsonDataRepository.save(jsonData);
		}

		return await this.memoryStorageService.create(
			name,
			input.data,
			description,
			version,
		);
	}

	async createDataWithId(id: string, input: CreateJsonDataInput): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Иннициализация json данных";
		const version = input.version || "1.0.0";

		if (this.isProduction) {
			const jsonData = this.jsonDataRepository.create({
				id,
				name,
				data: input.data,
				description,
				version,
				isCurrent: false,
			});
			return this.jsonDataRepository.save(jsonData);
		}

		return await this.memoryStorageService.createWithId(
			id,
			name,
			input.data,
			description,
			version,
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
				throw new NotFoundException(`JSON с ID ${id} не найден`);
			}
			return jsonData;
		}

		const result = await this.memoryStorageService.findById(id);
		if (!result) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
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
			const currentData = await this.jsonDataRepository.findOne({
				where: { isCurrent: true },
			});
			if (currentData) {
				return currentData;
			}

			const jsonData = await this.jsonDataRepository.findOne({
				order: { createdAt: "DESC" },
			});
			if (!jsonData) {
				return undefined;
			}
			return jsonData;
		}

		const currentResult = await this.memoryStorageService.getCurrentRecord();
		if (currentResult) {
			return currentResult;
		}

		const result = await this.memoryStorageService.findLatest();
		if (!result) {
			return undefined;
		}
		return result;
	}

	async updateGraphData(id: string, input: UpdateJsonDataInput): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`JSON с ID ${id} не найден`);
			}
			Object.assign(jsonData, input);
			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.memoryStorageService.update(id, input);
		if (!result) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return result;
	}

	async initializeGraphWithData(input: CreateJsonDataInput): Promise<any> {
		console.log(`[JsonDataService] initializeGraphWithData called`);
		const graphData = await this.createGraphData(input);
		console.log(`[JsonDataService] Graph created with ID: ${graphData.id}`);

		await this.jsonCommitService.createInitialCommit(
			graphData.id,
			"Initial commit",
			input.data,
		);
		console.log(
			`[JsonDataService] Initial commit created for graph: ${graphData.id}`,
		);

		await this.setCurrentById(graphData.id);
		console.log(`[JsonDataService] Graph ${graphData.id} set as current`);

		return graphData;
	}

	async createCommitForCurrentGraph(
		commitInput: CommitJsonDataInput,
	): Promise<any> {
		console.log(
			`[JsonDataService] createCommitForCurrentGraph called with message: ${commitInput.message}`,
		);
		let currentData = await this.getLatestGraphData();

		if (!currentData) {
			throw new NotFoundException(
				"No graph data found. Please initialize a graph first.",
			);
		}

		const updateInput: UpdateJsonDataInput = {
			data: commitInput.data,
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
			);
		} else {
			// Commits exist, create new commit
			await this.jsonCommitService.createNewCommit(
				currentData.id,
				commitInput.message,
				commitInput.data,
			);
		}

		return currentData;
	}

	async updateGraphWithCommit(
		id: string,
		commitInput: CommitJsonDataInput,
	): Promise<any> {
		console.log(
			`[JsonDataService] updateGraphWithCommit вызван для graphId: ${id}`,
		);
		const existingData = await this.findGraphDataByIdOrNull(id);

		if (!existingData) {
			console.log(`[JsonDataService] JSON с ID ${id} не найден, создаем новый`);
			const name = `JSON ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный JSON для коммита";
			const newGraphData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
				version: "1.0.0",
			});

			console.log(
				`[JsonDataService] Создан новый JSON с ID: ${newGraphData.id}`,
			);
			await this.jsonCommitService.createInitialCommit(
				newGraphData.id,
				commitInput.message,
				commitInput.data,
			);

			return newGraphData;
		}

		console.log(`[JsonDataService] JSON с ID ${id} найден, обновляем`);
		const updateInput: UpdateJsonDataInput = {
			data: commitInput.data,
		};

		const updatedData = await this.updateGraphData(id, updateInput);

		console.log(
			`[JsonDataService] JSON обновлен, создаем коммит для ID: ${id}`,
		);
		await this.jsonCommitService.createNewCommit(
			id,
			commitInput.message,
			commitInput.data,
		);

		return updatedData;
	}

	async setCurrentById(id: string): Promise<any> {
		if (this.isProduction) {
			await this.jsonDataRepository.update({}, { isCurrent: false });

			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`JSON с ID ${id} не найден`);
			}

			jsonData.isCurrent = true;
			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.memoryStorageService.setCurrentById(id);
		if (!result) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return result;
	}

	async setCurrentFromSnapshot(snapshot: any): Promise<any> {
		const updateData = {
			name: snapshot.name,
			data: snapshot.data,
			description: `Восстановлено из снимка: ${snapshot.name}`,
			version: snapshot.version || "1.0.0",
		};

		const existingData = await this.findGraphDataByIdOrNull(
			snapshot.sourceDataId,
		);

		if (existingData) {
			await this.updateGraphData(snapshot.sourceDataId, updateData);
			return await this.setCurrentById(snapshot.sourceDataId);
		} else {
			const created = await this.createDataWithId(
				snapshot.sourceDataId,
				updateData,
			);
			return await this.setCurrentById(created.id);
		}
	}

	async deleteGraphData(id: string): Promise<void> {
		if (this.isProduction) {
			const result = await this.jsonDataRepository.delete(id);
			if (result.affected === 0) {
				throw new NotFoundException(`JSON с ID ${id} не найден`);
			}
			return;
		}

		const success = await this.memoryStorageService.delete(id);
		if (!success) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
	}
}
