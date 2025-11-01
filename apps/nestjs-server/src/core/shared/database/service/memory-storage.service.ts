import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

export interface JsonDataRecord {
	id: string;
	name: string;
	data: Record<string, any>;
	description?: string;
	authorName?: string;
	isCurrent: boolean;
	version?: string;
	deprecated?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

@Injectable()
export class MemoryStorageService {
	private storage: Map<string, JsonDataRecord> = new Map();

	clear(): void {
		this.storage.clear();
	}

	async create(
		name: string,
		data: any,
		description?: string,
		version = "1.0.0",
		authorName?: string,
		deprecated?: boolean,
	): Promise<JsonDataRecord> {
		const id = uuidv4();
		const now = new Date();
		const record: JsonDataRecord = {
			id,
			name,
			data,
			description,
			version,
			authorName: authorName,
			isCurrent: false,
			createdAt: now,
			updatedAt: now,
		};
		this.storage.set(id, record);
		return record;
	}

	async createWithId(
		id: string,
		name: string,
		data: any,
		description?: string,
		version = "1.0.0",
	): Promise<JsonDataRecord> {
		const now = new Date();
		const record: JsonDataRecord = {
			id,
			name,
			data,
			description,
			version,
			isCurrent: false,
			createdAt: now,
			updatedAt: now,
		};
		this.storage.set(id, record);
		return record;
	}

	async findAll(): Promise<JsonDataRecord[]> {
		return Array.from(this.storage.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);
	}

	async findById(id: string): Promise<JsonDataRecord | null> {
		return this.storage.get(id) || null;
	}

	async findLatest(): Promise<JsonDataRecord | null> {
		const records = await this.findAll();
		return records[0] || null;
	}

	async update(
		id: string,
		updates: Partial<
			Pick<
				JsonDataRecord,
				"name" | "data" | "description" | "version" | "isCurrent"
			>
		>,
		authorName?: string,
	): Promise<JsonDataRecord | null> {
		const record = this.storage.get(id);
		if (!record) {
			return null;
		}

		const updatedRecord = {
			...record,
			...updates,
			authorName: authorName,
			updatedAt: new Date(),
		};

		this.storage.set(id, updatedRecord);
		return updatedRecord;
	}

	async setCurrentById(id: string): Promise<JsonDataRecord | null> {
		const record = this.storage.get(id);
		if (!record) {
			return null;
		}

		for (const [key, value] of this.storage.entries()) {
			if (value.isCurrent) {
				this.storage.set(key, {
					...value,
					isCurrent: false,
					updatedAt: new Date(),
				});
			}
		}

		const updatedRecord = {
			...record,
			isCurrent: true,
			updatedAt: new Date(),
		};

		this.storage.set(id, updatedRecord);
		return updatedRecord;
	}

	async getCurrentRecord(): Promise<JsonDataRecord | null> {
		for (const record of this.storage.values()) {
			if (record.isCurrent) {
				return record;
			}
		}
		return null;
	}

	async delete(id: string): Promise<boolean> {
		return this.storage.delete(id);
	}
}
