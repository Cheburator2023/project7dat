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

	async create(input: CreateJsonDataInput): Promise<any> {
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

	async findAll(
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

	async findOne(id: string): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
			}
			return jsonData;
		}

		const result = await this.memoryStorageService.findById(id);
		if (!result) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
		return result;
	}

	async findLatest(): Promise<any> {
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

	async update(id: string, input: UpdateJsonDataInput): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
			}
			Object.assign(jsonData, input);
			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.memoryStorageService.update(id, input);
		if (!result) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
		return result;
	}

	async updateWithCommit(
		id: string,
		commitInput: CommitJsonDataInput,
		newData: Record<string, any>,
	): Promise<any> {
		const _existingData = await this.findOne(id);

		const updateInput: UpdateJsonDataInput = {
			data: newData,
		};

		const updatedData = await this.update(id, updateInput);

		await this.jsonCommitService.createCommit(id, commitInput, newData);

		return updatedData;
	}

	async remove(id: string): Promise<void> {
		if (this.isProduction) {
			const result = await this.jsonDataRepository.delete(id);
			if (result.affected === 0) {
				throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
			}
			return;
		}

		const success = await this.memoryStorageService.delete(id);
		if (!success) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
	}
}
