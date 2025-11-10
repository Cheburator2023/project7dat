import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AttributeTypeService {
	private readonly attributeTypeMap: Map<string, number> = new Map([
		["timestamp", 1],
		["decimal", 2],
		["string", 3],
		["integer", 4],
	]);

	private readonly reverseAttributeTypeMap: Map<number, string> = new Map([
		[1, "timestamp"],
		[2, "decimal"],
		[3, "string"],
		[4, "integer"],
	]);

	constructor(readonly _configService: ConfigService) {}

	async getAttributeTypeId(typeName: string): Promise<number> {
		return this.attributeTypeMap.get(typeName) || 3; // Default to string
	}

	async getAttributeTypeName(typeId: number): Promise<string> {
		return this.reverseAttributeTypeMap.get(typeId) || "string";
	}

	async validateAttributeType(jsonType: string): Promise<boolean> {
		return this.attributeTypeMap.has(jsonType);
	}

	async getSupportedAttributeTypes(): Promise<string[]> {
		return Array.from(this.attributeTypeMap.keys());
	}

	async resolveAttributeTypeFromJson(jsonType: string): Promise<number> {
		// Нормализация типа из JSON
		const normalizedType = jsonType.toLowerCase();

		const typeMapping: Record<string, number> = {
			timestamp: 1,
			date: 1,
			datetime: 1,
			decimal: 2,
			numeric: 2,
			double: 2,
			float: 2,
			string: 3,
			varchar: 3,
			text: 3,
			char: 3,
			integer: 4,
			int: 4,
			bigint: 4,
			smallint: 4,
		};

		return typeMapping[normalizedType] || 3; // По умолчанию string
	}
}
