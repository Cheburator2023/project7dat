import { Injectable } from "@nestjs/common";

@Injectable()
export class EntityTypeService {
	private readonly jsonToEntityTypeMap: Map<string, number> = new Map([
		["table", 1], // TABLE_HIVE
		["view", 3], // VIEW_HIVE
		["json", 10], // JSON
		["input_vector", 11], // INPUT_VECTOR
		["unresolved", 5], // OUTPUT_VECTOR (ближайший fallback)
		["rdd", 1], // TABLE_HIVE (ближайший fallback)
	]);

	private readonly entityTypeToJsonMap: Map<number, string> = new Map([
		[1, "table"],
		[3, "view"],
		[5, "unresolved"],
		[10, "json"],
		[11, "input_vector"],
	]);

	async mapJsonTypeToEntityType(jsonType: string): Promise<number> {
		const normalizedType = jsonType.toLowerCase();
		return this.jsonToEntityTypeMap.get(normalizedType) || 1;
	}

	async mapEntityTypeToJson(entityTypeId: number): Promise<string> {
		return this.entityTypeToJsonMap.get(entityTypeId) || "table";
	}

	async validateEntityType(jsonType: string): Promise<boolean> {
		const normalizedType = jsonType.toLowerCase();
		return this.jsonToEntityTypeMap.has(normalizedType);
	}

	async getSupportedEntityTypes(): Promise<string[]> {
		return Array.from(this.jsonToEntityTypeMap.keys());
	}
}
