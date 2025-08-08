import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { SnapshotEntity } from "../entities/snapshot.entity";
import {
	CreateSnapshotInput,
	GetSnapshotListInput,
} from "../schemas/snapshot.schema";
import { SnapshotMemoryStorageService } from "./snapshot-memory-storage.service";
import { JsonDataService } from "../../json-data/services/json-data.service";

@Injectable()
export class SnapshotService {
	private isProduction?: boolean;

	constructor(
		@Optional()
		@InjectRepository(SnapshotEntity)
		private readonly snapshotRepository: Repository<SnapshotEntity>,
		private readonly configService: ConfigService,
		private readonly snapshotMemoryStorageService: SnapshotMemoryStorageService,
		private readonly jsonDataService: JsonDataService,
	) {
		this.isProduction = this.configService.get<boolean>("app.isProduction");
	}

	async createSnapshot(input: CreateSnapshotInput): Promise<any> {
		const currentData = await this.jsonDataService.getLatestGraphData();

		if (!currentData) {
			throw new NotFoundException(
				"Нет доступных данных для создания снимка. Сначала создайте JSON данные.",
			);
		}

		const name = input.name || `Снимок ${new Date().toLocaleString("ru-RU")}`;
		const description =
			input.description || "Снимок текущего состояния JSON данных";
		const version = input.version || "1.0.0";

		if (this.isProduction) {
			const snapshot = this.snapshotRepository.create({
				name,
				data: currentData.data,
				description,
				sourceDataId: currentData.id,
				version,
			});
			return this.snapshotRepository.save(snapshot);
		}

		return await this.snapshotMemoryStorageService.create(
			name,
			currentData.data,
			currentData.id,
			description,
			version,
		);
	}

	async getAllSnapshotsWithPagination(
		input: GetSnapshotListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, search } = input;
		const skip = (page - 1) * limit;

		if (this.isProduction) {
			const whereCondition = search
				? [{ name: Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
				: {};

			const [data, total] = await this.snapshotRepository.findAndCount({
				where: whereCondition,
				skip,
				take: limit,
				order: { createdAt: "DESC" },
			});

			return { data, total };
		}

		const allData = await this.snapshotMemoryStorageService.findAll();

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

	async getSnapshotById(id: string): Promise<any> {
		if (this.isProduction) {
			const snapshot = await this.snapshotRepository.findOne({ where: { id } });
			if (!snapshot) {
				throw new NotFoundException(`Снимок с ID ${id} не найден`);
			}
			return snapshot;
		}

		const result = await this.snapshotMemoryStorageService.findById(id);
		if (!result) {
			throw new NotFoundException(`Снимок с ID ${id} не найден`);
		}
		return result;
	}
}
