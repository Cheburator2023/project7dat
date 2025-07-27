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
import { MemoryStorageService } from "../shared/database/memory-storage.service";
import { JsonCommitService } from "./json-commit.service";

@Injectable()
export class JsonDataService {
	private isProduction: boolean;

	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly configService: ConfigService,
		private readonly memoryStorageService: MemoryStorageService,
		private readonly jsonCommitService: JsonCommitService,
	) {
		this.isProduction = this.configService.get("NODE_ENV") === "production";
	}

	async createGraphData(input: CreateJsonDataInput): Promise<any> {
		const name = input.name || `График ${new Date().toLocaleString("ru-RU")}`;
		const description =
			input.description || "Сохранённое состояние графика данных";

		if (this.isProduction) {
			const jsonData = this.jsonDataRepository.create({
				name,
				data: input.data,
				description,
			});
			return this.jsonDataRepository.save(jsonData);
		}

		return await this.memoryStorageService.create(
			name,
			input.data,
			description,
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
			return [];
			// throw new NotFoundException(`График с ID ${id} не найден`);
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

	async updateGraphData(id: string, input: UpdateJsonDataInput): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${id} не найден`);
			}
			Object.assign(jsonData, input);
			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.memoryStorageService.update(id, input);
		if (!result) {
			throw new NotFoundException(`График с ID ${id} не найден`);
		}
		return result;
	}

	async createCommitForCurrentGraph(
		commitInput: CommitJsonDataInput,
	): Promise<any> {
		let currentData = await this.getLatestGraphData();

		if (!currentData) {
			const name = `График ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный график для коммита";
			currentData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
			});
		} else {
			const updateInput: UpdateJsonDataInput = {
				data: commitInput.data,
			};
			currentData = await this.updateGraphData(currentData.id, updateInput);
		}

		await this.jsonCommitService.createNewCommit(
			currentData.id,
			commitInput.message,
			commitInput.data,
		);

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
			console.log(
				`[JsonDataService] График с ID ${id} не найден, создаем новый`,
			);
			const name = `График ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный график для коммита";
			const newGraphData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
			});

			console.log(
				`[JsonDataService] Создан новый график с ID: ${newGraphData.id}`,
			);
			await this.jsonCommitService.createNewCommit(
				newGraphData.id,
				commitInput.message,
				commitInput.data,
			);

			return newGraphData;
		}

		console.log(`[JsonDataService] График с ID ${id} найден, обновляем`);
		const updateInput: UpdateJsonDataInput = {
			data: commitInput.data,
		};

		const updatedData = await this.updateGraphData(id, updateInput);

		console.log(
			`[JsonDataService] График обновлен, создаем коммит для ID: ${id}`,
		);
		await this.jsonCommitService.createNewCommit(
			id,
			commitInput.message,
			commitInput.data,
		);

		return updatedData;
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
