import { Injectable } from "@nestjs/common";
import { ChangelogActionType } from "../entities/changelog.entity";

export interface ChangelogRecord {
	id: string;
	graphId: string;
	graphName: string;
	actionType: ChangelogActionType;
	actionDescription: string;
	details?: string;
	author?: string;
	commitId?: string;
	snapshotId?: string;
	version?: string;
	createdAt: Date;
}

@Injectable()
export class ChangelogMemoryStorageService {
	private records: Map<string, ChangelogRecord> = new Map();

	async create(
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
		const id = this.generateId();
		const record: ChangelogRecord = {
			id,
			graphId,
			graphName,
			actionType,
			actionDescription,
			details,
			author,
			commitId,
			snapshotId,
			version,
			createdAt: new Date(),
		};

		this.records.set(id, record);
		return record;
	}

	async findByGraphId(
		graphId: string,
		filters?: {
			actionType?: ChangelogActionType;
			author?: string;
			dateFrom?: Date;
			dateTo?: Date;
			page?: number;
			limit?: number;
		},
	): Promise<{ data: ChangelogRecord[]; total: number }> {
		let filteredRecords = Array.from(this.records.values()).filter(
			(record) => record.graphId === graphId,
		);

		if (filters?.actionType) {
			filteredRecords = filteredRecords.filter(
				(record) => record.actionType === filters.actionType,
			);
		}

		if (filters?.author) {
			filteredRecords = filteredRecords.filter((record) =>
				record.author?.toLowerCase().includes(filters.author!.toLowerCase()),
			);
		}

		if (filters?.dateFrom) {
			filteredRecords = filteredRecords.filter(
				(record) => record.createdAt >= filters.dateFrom!,
			);
		}

		if (filters?.dateTo) {
			filteredRecords = filteredRecords.filter(
				(record) => record.createdAt <= filters.dateTo!,
			);
		}

		filteredRecords.sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);

		const total = filteredRecords.length;
		const page = filters?.page || 1;
		const limit = filters?.limit || 20;
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;

		const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

		return { data: paginatedRecords, total };
	}

	async findAll(filters?: {
		actionType?: ChangelogActionType;
		author?: string;
		dateFrom?: Date;
		dateTo?: Date;
		page?: number;
		limit?: number;
	}): Promise<{ data: ChangelogRecord[]; total: number }> {
		let filteredRecords = Array.from(this.records.values());

		if (filters?.actionType) {
			filteredRecords = filteredRecords.filter(
				(record) => record.actionType === filters.actionType,
			);
		}

		if (filters?.author) {
			filteredRecords = filteredRecords.filter((record) =>
				record.author?.toLowerCase().includes(filters.author!.toLowerCase()),
			);
		}

		if (filters?.dateFrom) {
			filteredRecords = filteredRecords.filter(
				(record) => record.createdAt >= filters.dateFrom!,
			);
		}

		if (filters?.dateTo) {
			filteredRecords = filteredRecords.filter(
				(record) => record.createdAt <= filters.dateTo!,
			);
		}

		filteredRecords.sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);

		const total = filteredRecords.length;
		const page = filters?.page || 1;
		const limit = filters?.limit || 20;
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;

		const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

		return { data: paginatedRecords, total };
	}

	async clear(): Promise<void> {
		this.records.clear();
	}

	private generateId(): string {
		return `changelog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
