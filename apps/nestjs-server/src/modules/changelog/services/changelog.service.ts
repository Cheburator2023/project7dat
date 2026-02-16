import { Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
	ChangelogMemoryStorageService,
	ChangelogRecord,
} from "./changelog-memory-storage.service";
import { ChangelogActionType } from "../entities/changelog.entity";
import {
	ChangelogGroupDto,
	ChangelogResponseDto,
	GetChangelogQueryDto,
} from "../schemas/changelog.schema";

@Injectable()
export class ChangelogService {
	constructor(private readonly storageService: ChangelogMemoryStorageService) {}

	async getReleaseNotesMarkdown(): Promise<string> {
		const changelogPath = path.resolve(
			__dirname,
			"../../../../../../CHANGELOG.md",
		);

		return await readFile(changelogPath, "utf-8");
	}

	async logAction(
		graphId: string,
		graphName: string,
		actionType: ChangelogActionType,
		actionDescription: string,
		details?: string,
		author?: string,
		commitId?: string,
		snapshotId?: string,
		version?: string,
	): Promise<ChangelogRecord> {
		return this.storageService.create(
			graphId,
			graphName,
			actionType,
			actionDescription,
			details,
			author,
			commitId,
			snapshotId,
			version,
		);
	}

	async getChangelogForGraph(
		graphId: string,
		query: GetChangelogQueryDto,
	): Promise<ChangelogResponseDto> {
		const filters = {
			actionType: query.actionType,
			author: query.author,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			page: query.page || 1,
			limit: query.limit || 20,
		};

		const { data, total } = await this.storageService.findByGraphId(
			graphId,
			filters,
		);

		return this.formatChangelogResponse(
			data,
			total,
			filters.page,
			filters.limit,
		);
	}

	async getAllChangelog(
		query: GetChangelogQueryDto,
	): Promise<ChangelogResponseDto> {
		const filters = {
			actionType: query.actionType,
			author: query.author,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			page: query.page || 1,
			limit: query.limit || 20,
		};

		const { data, total } = await this.storageService.findAll(filters);

		return this.formatChangelogResponse(
			data,
			total,
			filters.page,
			filters.limit,
		);
	}

	private formatChangelogResponse(
		records: ChangelogRecord[],
		total: number,
		page: number,
		limit: number,
	): ChangelogResponseDto {
		const groupedByDate = new Map<string, ChangelogRecord[]>();

		records.forEach((record) => {
			const dateKey = record.createdAt.toISOString().split("T")[0];
			if (!groupedByDate.has(dateKey)) {
				groupedByDate.set(dateKey, []);
			}
			groupedByDate.get(dateKey)!.push(record);
		});

		const groups: ChangelogGroupDto[] = Array.from(groupedByDate.entries())
			.map(([date, entries]) => ({
				date,
				entries: entries.map((entry) => ({
					id: entry.id,
					graphId: entry.graphId,
					graphName: entry.graphName,
					actionType: entry.actionType,
					actionDescription: entry.actionDescription,
					details: entry.details,
					author: entry.author,
					commitId: entry.commitId,
					snapshotId: entry.snapshotId,
					version: entry.version,
					createdAt: entry.createdAt,
				})),
			}))
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return {
			groups,
			total,
			page,
			limit,
		};
	}

	async logGraphCreated(
		graphId: string,
		graphName: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.CREATED,
			`График "${graphName}" создан`,
			undefined,
			author,
		);
	}

	async logCommitCreated(
		graphId: string,
		graphName: string,
		commitId: string,
		message: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.COMMIT,
			`Создан коммит: ${message}`,
			undefined,
			author,
			commitId,
		);
	}

	async logSnapshotCreated(
		graphId: string,
		graphName: string,
		snapshotId: string,
		snapshotName: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.SNAPSHOT_CREATED,
			`Создан снепшот: ${snapshotName}`,
			undefined,
			author,
			undefined,
			snapshotId,
		);
	}

	async logSnapshotApplied(
		graphId: string,
		graphName: string,
		snapshotId: string,
		snapshotName: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.SNAPSHOT_APPLIED,
			`Применен снепшот: ${snapshotName}`,
			undefined,
			author,
			undefined,
			snapshotId,
		);
	}

	async logRollback(
		graphId: string,
		graphName: string,
		targetCommitId: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.ROLLBACK,
			`Откат к коммиту ${targetCommitId}`,
			undefined,
			author,
			targetCommitId,
		);
	}

	async logSetCurrent(
		graphId: string,
		graphName: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.SET_CURRENT,
			`График "${graphName}" установлен как текущий`,
			undefined,
			author,
		);
	}

	async logGraphUpdated(
		graphId: string,
		graphName: string,
		details: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.UPDATED,
			`График "${graphName}" обновлен`,
			details,
			author,
		);
	}

	async logGraphDeleted(
		graphId: string,
		graphName: string,
		author?: string,
	): Promise<void> {
		await this.logAction(
			graphId,
			graphName,
			ChangelogActionType.DELETED,
			`График "${graphName}" удален`,
			undefined,
			author,
		);
	}
}
