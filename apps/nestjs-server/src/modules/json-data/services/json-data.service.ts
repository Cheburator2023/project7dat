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
import { JsonCommitService } from "./json-commit.service";
import { ChangelogService } from "../../changelog/services/changelog.service";
import { VersionInfoDto } from "../dto/version-info.dto";
import { JsonCommitEntity } from "../entities/json-commit.entity";

@Injectable()
export class JsonDataService {
	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		readonly _configService: ConfigService,
		private readonly jsonCommitService: JsonCommitService,
		private readonly changelogService: ChangelogService,
	) {}

	async createGraphData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Инициализация json данных";
		const version = input.version || "1.0.0";

		const jsonData = this.jsonDataRepository.create({
			id: uuidv4(),
			name,
			data: input.data,
			description,
			version,
			authorName: input.authorName || "System",
			isCurrent: false,
		});
		const result = await this.jsonDataRepository.save(jsonData);

		await this.changelogService.logGraphCreated(result.id, result.name);
		return result;
	}

	async createDataWithId(
		id: string,
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Инициализация json данных";
		const version = input.version || "1.0.0";

		const jsonData = this.jsonDataRepository.create({
			id,
			name,
			data: input.data,
			description,
			version,
			authorName: input.authorName || "System",
			isCurrent: false,
		});
		return this.jsonDataRepository.save(jsonData);
	}

	async getAllGraphsWithPagination(
		input: GetJsonDataListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, search } = input;
		const skip = (page - 1) * limit;

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

	async getGraphDataById(id: string): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return jsonData;
	}

	async findGraphDataByIdOrNull(id: string): Promise<any | null> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		return jsonData || null;
	}

	async getLatestGraphData(): Promise<any> {
		const currentData = await this.jsonDataRepository.findOne({
			where: { isCurrent: true },
		});
		if (currentData) {
			return currentData;
		}

		const latestList = await this.jsonDataRepository.find({
			order: { createdAt: "DESC" },
			take: 1,
		});
		return latestList.length ? latestList[0] : undefined;
	}

	async updateGraphData(
		id: string,
		input: UpdateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}

		if (input.data) jsonData.data = input.data;
		if (input.name) jsonData.name = input.name;
		if (input.description) jsonData.description = input.description;
		if (input.authorName) jsonData.authorName = input.authorName;
		jsonData.updatedAt = new Date();

		return this.jsonDataRepository.save(jsonData);
	}

	async initializeGraphWithData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const graphData = await this.createGraphData(input);
		console.log(`[JsonDataService] Graph created with ID: ${graphData.id}`);

		await this.jsonCommitService.createInitialCommit(
			graphData.id,
			"Initial commit",
			input.data,
			input.authorName,
		);
		console.log(
			`[JsonDataService] Initial commit created for graph: ${graphData.id}`,
		);

		console.log(`[JsonDataService] Graph ${graphData.id} created successfully`);

		return graphData;
	}

	async createCommitForCurrentGraph(
		commitInput: CommitJsonDataInput & { authorName?: string },
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
			console.log(`[JsonDataService] JSON с ID ${id} не найден, создаем новый`);
			const name = `JSON ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный JSON для коммита";
			const newGraphData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
				version: "1.0.0",
				authorName: commitInput.authorName || "System",
			});

			console.log(
				`[JsonDataService] Создан новый JSON с ID: ${newGraphData.id}`,
			);
			await this.jsonCommitService.createInitialCommit(
				newGraphData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);

			return newGraphData;
		}

		console.log(`[JsonDataService] JSON с ID ${id} найден, обновляем`);
		const updateInput: UpdateJsonDataInput & { authorName?: string } = {
			data: commitInput.data,
			authorName: commitInput.authorName || "System",
		};

		const updatedData = await this.updateGraphData(id, updateInput);

		console.log(
			`[JsonDataService] JSON обновлен, создаем коммит для ID: ${id}`,
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
		await this.jsonDataRepository.update(id, {
			version: versionInfo.version,
			deprecated: versionInfo.deprecated,
		});
		return this.jsonDataRepository.findOne({ where: { id } });
	}

	async getDocumentHistory(
		id: string,
		fromDate?: string,
		toDate?: string,
	): Promise<any[]> {
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

	async deleteGraphData(id: string): Promise<void> {
		const result = await this.jsonDataRepository.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return;
	}

	async setCurrentById(id: string): Promise<any> {
		await this.jsonDataRepository.update({}, { isCurrent: false });

		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}

		jsonData.isCurrent = true;
		const result = await this.jsonDataRepository.save(jsonData);

		await this.changelogService.logSetCurrent(result.id, result.name);
		return result;
	}

	async setCurrentFromSnapshot(snapshot: any): Promise<any> {
		const updateData: CreateJsonDataInput & { authorName?: string } = {
			name: snapshot.name,
			data: snapshot.data,
			description: `Восстановлено из снимка: ${snapshot.name}`,
			version: snapshot.version || "1.0.0",
			authorName: snapshot.authorName || "System",
		};

		const existingData = await this.findGraphDataByIdOrNull(
			snapshot.sourceDataId,
		);

		if (existingData) {
			await this.updateGraphData(snapshot.sourceDataId, updateData);
			return await this.setCurrentById(snapshot.sourceDataId);
		}
		const created = await this.createDataWithId(
			snapshot.sourceDataId,
			updateData,
		);
		return await this.setCurrentById(created.id);
	}
}
