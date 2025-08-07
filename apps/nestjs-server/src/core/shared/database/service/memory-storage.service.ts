import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

interface JsonDataRecord {
	id: string;
	name: string;
	data: any;
	description?: string;
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
	): Promise<JsonDataRecord> {
		const id = uuidv4();
		const now = new Date();
		const record: JsonDataRecord = {
			id,
			name,
			data,
			description,
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
		updates: Partial<Pick<JsonDataRecord, "name" | "data" | "description">>,
	): Promise<JsonDataRecord | null> {
		const record = this.storage.get(id);
		if (!record) {
			return null;
		}

		const updatedRecord = {
			...record,
			...updates,
			updatedAt: new Date(),
		};

		this.storage.set(id, updatedRecord);
		return updatedRecord;
	}

	async delete(id: string): Promise<boolean> {
		return this.storage.delete(id);
	}
}
