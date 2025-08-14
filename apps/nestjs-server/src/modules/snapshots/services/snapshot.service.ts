import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { SnapshotEntity } from "../entities/snapshot.entity";
import {
	CreateSnapshotInput,
	GetSnapshotListInput,
	ApplySnapshotInput,
} from "../schemas/snapshot.schema";
import { SnapshotMemoryStorageService } from "./snapshot-memory-storage.service";
import { JsonDataService } from "../../json-data/services/json-data.service";
import { JsonCommitService } from "../../json-data/services/json-commit.service";
import { ChangelogService } from "../../changelog/services/changelog.service";

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
		private readonly jsonCommitService: JsonCommitService,
		private readonly changelogService: ChangelogService,
	) {
		this.isProduction = this.configService.get<boolean>("app.isProduction");
	}

	private async getCommitsForGraphData(graphId: string): Promise<any[]> {
		try {
			return await this.jsonCommitService.getCommitsForGraph(graphId);
		} catch (error) {
			console.warn(`Не удалось получить коммиты для JSONа ${graphId}:`, error);
			return [];
		}
	}

	async createSnapshot(input: CreateSnapshotInput): Promise<any> {
		const currentData = await this.jsonDataService.getLatestGraphData();

		if (!currentData) {
			throw new NotFoundException(
				"Нет доступных данных для создания снимка. Сначала создайте JSON данные.",
			);
		}

		const snapshotName =
			input.name || `Снимок ${new Date().toLocaleString("ru-RU")}`;
		const snapshotDescription =
			input.description || "Снимок текущего состояния JSON данных";
		const version = input.version || "1.0.0";

		const relatedCommits = await this.getCommitsForGraphData(currentData.id);

		let result: any;

		if (this.isProduction) {
			const snapshot = this.snapshotRepository.create({
				name: snapshotName,
				data: currentData.data,
				description: snapshotDescription,
				sourceDataId: currentData.id,
				version,
				commits: relatedCommits,
				originalName: currentData.name,
				originalDescription: currentData.description,
			});
			result = await this.snapshotRepository.save(snapshot);
		} else {
			result = await this.snapshotMemoryStorageService.create(
				snapshotName,
				currentData.data,
				currentData.id,
				snapshotDescription,
				version,
				relatedCommits,
				currentData.name,
				currentData.description,
			);
		}

		await this.changelogService.logSnapshotCreated(
			currentData.id,
			currentData.name,
			result.id,
			snapshotName,
		);

		return result;
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

	async applySnapshot(input: ApplySnapshotInput): Promise<any> {
		const snapshot = await this.getSnapshotById(input.snapshotId);

		if (!snapshot) {
			throw new NotFoundException(`Снепшот с ID ${input.snapshotId} не найден`);
		}

		const existingData = await this.jsonDataService.findGraphDataByIdOrNull(
			snapshot.sourceDataId,
		);

		let result: any;
		const graphName = snapshot.originalName || snapshot.name;

		if (!existingData) {
			const graphData = await this.jsonDataService.createDataWithId(
				snapshot.sourceDataId,
				{
					name: snapshot.originalName || snapshot.name,
					data: snapshot.data,
					description: snapshot.originalDescription || snapshot.description,
					version: snapshot.version,
				},
			);

			if (snapshot.commits && snapshot.commits.length > 0) {
				await this.restoreCommitsFromSnapshot(
					snapshot.sourceDataId,
					snapshot.commits,
				);
			}

			await this.jsonDataService.setCurrentById(snapshot.sourceDataId);
			result = graphData;
		} else {
			await this.jsonDataService.updateGraphData(snapshot.sourceDataId, {
				name: snapshot.originalName || snapshot.name,
				data: snapshot.data,
				description: snapshot.originalDescription || snapshot.description,
				version: snapshot.version,
			});

			if (snapshot.commits && snapshot.commits.length > 0) {
				await this.restoreCommitsFromSnapshot(
					snapshot.sourceDataId,
					snapshot.commits,
				);
			}

			await this.jsonDataService.setCurrentById(snapshot.sourceDataId);
			result = existingData;
		}

		await this.changelogService.logSnapshotApplied(
			snapshot.sourceDataId,
			graphName,
			snapshot.id,
			snapshot.name,
		);

		return result;
	}

	private async restoreCommitsFromSnapshot(
		graphId: string,
		commits: any[],
	): Promise<void> {
		console.log(
			`Восстановление ${commits.length} коммитов для JSONа ${graphId}`,
		);

		for (const commit of commits) {
			try {
				if (this.isProduction) {
					const existingCommit = await this.jsonCommitService.findCommitById(
						commit.id,
					);
					if (!existingCommit) {
						await this.jsonCommitService.createCommitFromSnapshot(
							graphId,
							commit,
						);
					}
				} else {
					await this.jsonCommitService.createCommitFromSnapshot(
						graphId,
						commit,
					);
				}
			} catch (error) {
				console.warn(`Не удалось восстановить коммит ${commit.id}:`, error);
			}
		}
	}
}
