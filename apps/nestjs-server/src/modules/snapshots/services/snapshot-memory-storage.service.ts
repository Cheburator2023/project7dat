import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

interface SnapshotRecord {
	id: string;
	name: string;
	data: any;
	description?: string;
	sourceDataId: string;
	version: string;
	commits?: any[];
	originalName?: string;
	originalDescription?: string;
	createdAt: Date;
}

@Injectable()
export class SnapshotMemoryStorageService {
	private storage: Map<string, SnapshotRecord> = new Map();

	clear(): void {
		this.storage.clear();
	}

	async create(
		name: string,
		data: any,
		sourceDataId: string,
		description?: string,
		version = "1.0.0",
		commits?: any[],
		originalName?: string,
		originalDescription?: string,
	): Promise<SnapshotRecord> {
		const id = uuidv4();
		const now = new Date();
		const record: SnapshotRecord = {
			id,
			name,
			data,
			description,
			sourceDataId,
			version,
			commits,
			originalName,
			originalDescription,
			createdAt: now,
		};
		this.storage.set(id, record);
		return record;
	}

	async findAll(): Promise<SnapshotRecord[]> {
		return Array.from(this.storage.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);
	}

	async findById(id: string): Promise<SnapshotRecord | null> {
		return this.storage.get(id) || null;
	}
}
