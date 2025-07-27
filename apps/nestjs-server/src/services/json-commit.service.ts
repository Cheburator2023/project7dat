import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonDataEntity } from "../entities/json-data.entity";
import { GetCommitListInput } from "../schemas/json-commit.schema";
import { createHash } from "crypto";

@Injectable()
export class JsonCommitService {
	private isProduction: boolean;
	private memoryCommits: Map<string, any[]> = new Map();

	constructor(
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		private readonly configService: ConfigService,
	) {
		this.isProduction = this.configService.get("NODE_ENV") === "production";
	}

	private generateUniqueCommitHash(
		message: string,
		diff: Record<string, any>,
		timestamp: Date,
	): string {
		const content = JSON.stringify({
			message,
			diff,
			timestamp: timestamp.toISOString(),
		});
		return createHash("sha256").update(content).digest("hex").substring(0, 8);
	}

	async createNewCommit(
		graphId: string,
		message: string,
		diff: Record<string, any>,
		fullData: Record<string, any>,
	): Promise<any> {
		console.log(`[JsonCommitService] Создание коммита для graphId: ${graphId}`);
		const timestamp = new Date();
		const hash = this.generateUniqueCommitHash(message, diff, timestamp);

		if (this.isProduction) {
			const jsonData = await this.jsonDataRepository.findOne({
				where: { id: graphId },
			});
			if (!jsonData) {
				throw new NotFoundException(`График с ID ${graphId} не найден`);
			}

			const commit = this.commitRepository.create({
				hash,
				message,
				diff,
				fullData,
				graphId,
				createdAt: timestamp,
			});

			const savedCommit = await this.commitRepository.save(commit);
			console.log(`[JsonCommitService] Коммит сохранен в БД:`, savedCommit.id);
			return savedCommit;
		}

		if (!this.memoryCommits.has(graphId)) {
			this.memoryCommits.set(graphId, []);
		}

		const commit = {
			id: `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			hash,
			message,
			diff,
			fullData,
			graphId,
			createdAt: timestamp,
		};

		this.memoryCommits.get(graphId)!.push(commit);
		console.log(`[JsonCommitService] Коммит добавлен в память:`, commit.id);
		console.log(
			`[JsonCommitService] Всего коммитов для graphId ${graphId}:`,
			this.memoryCommits.get(graphId)!.length,
		);
		return commit;
	}

	async getCommitsWithPagination(
		input: GetCommitListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, graphId } = input;
		console.log(
			`[JsonCommitService] Получение коммитов для graphId: ${graphId}, page: ${page}, limit: ${limit}`,
		);
		const skip = (page - 1) * limit;

		if (this.isProduction) {
			const whereCondition = graphId ? { graphId: graphId } : {};

			const [data, total] = await this.commitRepository.findAndCount({
				where: whereCondition,
				skip,
				take: limit,
				order: { createdAt: "DESC" },
			});

			console.log(`[JsonCommitService] Найдено коммитов в БД: ${total}`);
			return { data, total };
		}

		let allCommits: any[] = [];
		if (graphId) {
			allCommits = this.memoryCommits.get(graphId) || [];
			console.log(
				`[JsonCommitService] Коммиты для graphId ${graphId} из памяти:`,
				allCommits.length,
			);
		} else {
			for (const commits of this.memoryCommits.values()) {
				allCommits.push(...commits);
			}
			console.log(
				`[JsonCommitService] Все коммиты из памяти:`,
				allCommits.length,
			);
		}

		console.log(
			`[JsonCommitService] Все ключи в memoryCommits:`,
			Array.from(this.memoryCommits.keys()),
		);

		allCommits.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		const total = allCommits.length;
		const data = allCommits.slice(skip, skip + limit);

		console.log(
			`[JsonCommitService] Возвращаем коммитов: ${data.length} из ${total}`,
		);
		return { data, total };
	}

	async findCommitById(id: string): Promise<any> {
		if (this.isProduction) {
			const commit = await this.commitRepository.findOne({ where: { id } });
			if (!commit) {
				throw new NotFoundException(`Коммит с ID ${id} не найден`);
			}
			return commit;
		}

		for (const commits of this.memoryCommits.values()) {
			const commit = commits.find((c) => c.id === id);
			if (commit) {
				return commit;
			}
		}

		throw new NotFoundException(`Коммит с ID ${id} не найден`);
	}
}
