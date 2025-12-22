import { Injectable } from "@nestjs/common";

@Injectable()
export class EntityTypeService {
    private readonly jsonToEntityTypeMap: Map<string, number> = new Map([
		["table", 1], // TABLE_HIVE
		["view", 2], // VIEW_HIVE
		["json", 3], // JSON
		["input_vector", 4], // INPUT_VECTOR
		["unresolved", 5], // Для DAPP
		["rdd", 6], // Для DAPP
	]);

    async mapJsonTypeToEntityType(jsonType: string): Promise<number> {
        const normalizedType = jsonType.toLowerCase();
        return this.jsonToEntityTypeMap.get(normalizedType) || 1;
    }

    async validateEntityType(jsonType: string): Promise<boolean> {
        const normalizedType = jsonType.toLowerCase();
        return this.jsonToEntityTypeMap.has(normalizedType);
    }

	async getSupportedEntityTypes(): Promise<string[]> {
		return Array.from(this.jsonToEntityTypeMap.keys());
	}
}
