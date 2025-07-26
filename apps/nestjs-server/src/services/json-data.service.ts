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
import { PGLiteService } from "../shared/database/pglite.service";

@Injectable()
export class JsonDataService {
	private isProduction: boolean;

	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly configService: ConfigService,
		private readonly pgliteService: PGLiteService,
	) {
		this.isProduction = this.configService.get("NODE_ENV") === "production";
	}

	async create(input: CreateJsonDataInput): Promise<any> {
		if (this.isProduction) {
			const jsonData = this.jsonDataRepository.create(input);
			return this.jsonDataRepository.save(jsonData);
		}

		const result = await this.pgliteService.query(
			`INSERT INTO json_data (name, data, description) 
			 VALUES ($1, $2, $3) 
			 RETURNING *`,
			[input.name, JSON.stringify(input.data), input.description],
		);

		return {
			...result[0],
			data: JSON.parse(result[0].data),
		};
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

		let whereClause = "";
		const params_array: any[] = [limit, skip];

		if (search) {
			whereClause = "WHERE name ILIKE $3 OR description ILIKE $3";
			params_array.push(`%${search}%`);
		}

		const countResult = await this.pgliteService.query(
			`SELECT COUNT(*) as total FROM json_data ${whereClause}`,
			search ? [`%${search}%`] : [],
		);

		const dataResult = await this.pgliteService.query(
			`SELECT * FROM json_data ${whereClause} 
			 ORDER BY "createdAt" DESC 
			 LIMIT $1 OFFSET $2`,
			params_array,
		);

		const data = dataResult.map((item: any) => ({
			...item,
			data: JSON.parse(item.data),
		}));

		return { data, total: Number.parseInt(countResult[0].total) };
	}

	async findOne(id: string): Promise<any> {
		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
			if (!jsonData) {
				throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
			}
			return jsonData;
		}

		const result = await this.pgliteService.query(
			"SELECT * FROM json_data WHERE id = $1",
			[id],
		);

		if (result.length === 0) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}

		return {
			...result[0],
			data: JSON.parse(result[0].data),
		};
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

		const setClauses: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		if (input.name !== undefined) {
			setClauses.push(`name = $${paramIndex++}`);
			values.push(input.name);
		}

		if (input.data !== undefined) {
			setClauses.push(`data = $${paramIndex++}`);
			values.push(JSON.stringify(input.data));
		}

		if (input.description !== undefined) {
			setClauses.push(`description = $${paramIndex++}`);
			values.push(input.description);
		}

		setClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
		values.push(id);

		const result = await this.pgliteService.query(
			`UPDATE json_data SET ${setClauses.join(", ")} 
			 WHERE id = $${paramIndex} 
			 RETURNING *`,
			values,
		);

		if (result.length === 0) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}

		return {
			...result[0],
			data: JSON.parse(result[0].data),
		};
	}

	async remove(id: string): Promise<void> {
		if (this.isProduction) {
			const result = await this.jsonDataRepository.delete(id);
			if (result.affected === 0) {
				throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
			}
			return;
		}

		const result = await this.pgliteService.query(
			"DELETE FROM json_data WHERE id = $1 RETURNING id",
			[id],
		);

		if (result.length === 0) {
			throw new NotFoundException(`JSON данные с ID ${id} не найдены`);
		}
	}
}
