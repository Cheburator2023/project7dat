import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { JsonDataEntity } from "../entities/json-data.entity";
import {
	CreateJsonDataInput,
	UpdateJsonDataInput,
	GetJsonDataListInput,
} from "../schemas/json-data.schema";

@Injectable()
export class JsonDataService {
	constructor(
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
	) {}

	async create(input: CreateJsonDataInput): Promise<any> {
		const jsonData = this.jsonDataRepository.create({
			...input,
			data: JSON.stringify(input.data),
		});
		const saved = await this.jsonDataRepository.save(jsonData);
		return {
			...saved,
			data: JSON.parse(saved.data),
		};
	}

	async findAll(
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

		return {
			data: data.map((item) => ({
				...item,
				data: JSON.parse(item.data),
			})),
			total,
		};
	}

	async findOne(id: string): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
		return {
			...jsonData,
			data: JSON.parse(jsonData.data),
		};
	}

	async update(id: string, input: UpdateJsonDataInput): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}

		const updateData = {
			...input,
			...(input.data && { data: JSON.stringify(input.data) }),
		};

		Object.assign(jsonData, updateData);
		const saved = await this.jsonDataRepository.save(jsonData);
		return {
			...saved,
			data: JSON.parse(saved.data),
		};
	}

	async remove(id: string): Promise<void> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
		await this.jsonDataRepository.remove(jsonData);
	}
}
