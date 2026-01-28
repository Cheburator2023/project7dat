import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { ProcessEntity } from "../entities/process.entity";

@Injectable()
export class ProcessesService {
	constructor(
		@InjectRepository(ProcessEntity)
		private readonly processRepository: Repository<ProcessEntity>,
	) {}

	async listProcessNames(): Promise<{ data: string[] }> {
		const rows = await this.processRepository
			.createQueryBuilder("process")
			.select("DISTINCT process.name", "name")
			.where("process.name IS NOT NULL")
			.andWhere("process.name <> ''")
			.orderBy("process.name", "ASC")
			.getRawMany<{ name: string }>();

		return { data: rows.map((r) => r.name) };
	}
}
