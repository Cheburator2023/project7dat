import { Injectable, Inject, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EntityTypeService {
    private readonly entityTypeMap: Map<string, number> = new Map([
        ['TABLE_HIVE', 1],
        ['VIEW_HIVE', 2],
        ['JSON', 3],
        ['INPUT_VECTOR', 4]
    ]);

    private readonly reverseEntityTypeMap: Map<number, string> = new Map([
        [1, 'TABLE_HIVE'],
        [2, 'VIEW_HIVE'],
        [3, 'JSON'],
        [4, 'INPUT_VECTOR']
    ]);

    private readonly jsonToEntityTypeMap: Map<string, number> = new Map([
        ['table', 1],    // TABLE_HIVE
        ['view', 2],     // VIEW_HIVE
        ['json', 3],     // JSON
        ['input_vector', 4], // INPUT_VECTOR
        ['unresolved', 5], // Для DAPP
        ['rdd', 6]       // Для DAPP
    ]);

    constructor(
        private readonly configService: ConfigService
    ) {}

    async getEntityTypeId(typeName: string): Promise<number> {
        return this.entityTypeMap.get(typeName) || 1; // Default to TABLE_HIVE
    }

    async getEntityTypeName(typeId: number): Promise<string> {
        return this.reverseEntityTypeMap.get(typeId) || 'TABLE_HIVE';
    }

    async mapJsonTypeToEntityType(jsonType: string): Promise<number> {
        return this.jsonToEntityTypeMap.get(jsonType) || 1;
    }

    async validateEntityType(jsonType: string): Promise<boolean> {
        return this.jsonToEntityTypeMap.has(jsonType);
    }

    async getSupportedEntityTypes(): Promise<string[]> {
        return Array.from(this.jsonToEntityTypeMap.keys());
    }
}