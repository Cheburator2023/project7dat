import { Injectable } from "@nestjs/common";

@Injectable()
export class AttributeTypeService {
    private readonly attributeTypeMap: Map<string, number> = new Map([
        ["string", 1],
        ["integer", 2],
        ["decimal", 3],
        ["timestamp", 4],
        ["boolean", 5],
    ]);

	async getSupportedAttributeTypes(): Promise<string[]> {
		return Array.from(this.attributeTypeMap.keys());
	}

	async resolveAttributeTypeFromJson(jsonType: string): Promise<number> {
		// Нормализация типа из JSON
		const normalizedType = jsonType.toLowerCase();

        const typeMapping: Record<string, number> = {
            timestamp: 4,
            date: 4,
            datetime: 4,
            decimal: 3,
            numeric: 3,
            double: 3,
            float: 3,
            string: 1,
            varchar: 1,
            text: 1,
            char: 1,
            integer: 2,
            int: 2,
            bigint: 2,
            smallint: 2,
            boolean: 5,
            bool: 5,
        };

        return typeMapping[normalizedType] || 1;
    }
}
