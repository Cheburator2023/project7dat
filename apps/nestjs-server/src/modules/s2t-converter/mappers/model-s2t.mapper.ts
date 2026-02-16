import { Injectable } from '@nestjs/common';
import { BaseS2TMapper, S2TImportOptions } from './base-s2t.mapper';
import { S2TRow } from '../services/excel-parser.service';

@Injectable()
export class ModelS2TMapper extends BaseS2TMapper {
    /**
     * Преобразование S2T модели в JSON DL согласно таблице "Заполнение полей JSON коммита из файла S2T модели"
     * (commit_type = model, system_code по умолчанию 1655 для ПИМ)
     */
    map(rows: S2TRow[], options: S2TImportOptions): any {
        const entitiesMap = new Map<string, any>();
        const mappingsMap = new Map<string, any>();

        for (const row of rows) {
            // Source entity (источник)
            if (row.sourceSchema && row.sourceTable) {
                const sourceFullName = `${row.sourceSchema}/${row.sourceTable}`;
                if (!entitiesMap.has(sourceFullName)) {
                    // Определяем тип source сущности: если имя таблицы начинается с "JSON_", то тип json, иначе table
                    const type = row.sourceTable?.toLowerCase().startsWith('json_') ? 'json' : 'table';
                    entitiesMap.set(sourceFullName, {
                        id: sourceFullName,
                        modified: false,
                        type: type,
                        namespace: row.sourceSchema,
                        name: row.sourceTable,
                        system_code: row.sourceSystem || '1655', // для модели по умолчанию ПИМ
                        entity_change: 'new',
                        description: row.sourceTableDescription,
                        attrSeq: [],
                    });
                }
                if (row.sourceAttributeCode) {
                    const entity = entitiesMap.get(sourceFullName);
                    entity.attrSeq.push({
                        name: row.sourceAttributeCode,
                        type: this.normalizeType(row.sourceDataType),
                        comment: row.sourceAttributeDescription,
                        attr_change: 'new',
                    });
                }
            }

            // Target entity (целевой вектор)
            if (row.targetSchema && row.targetTable) {
                const targetFullName = `${row.targetSchema}/${row.targetTable}`;
                if (!entitiesMap.has(targetFullName)) {
                    // Целевая сущность всегда input_vector
                    entitiesMap.set(targetFullName, {
                        id: targetFullName,
                        modified: true,
                        type: 'input_vector',
                        namespace: row.targetSchema,
                        name: row.targetTable,
                        system_code: row.targetSystem || '1655',
                        entity_change: 'new',
                        description: row.targetTableDescription,
                        attrSeq: [],
                    });
                }
                if (row.targetAttributeCode) {
                    const entity = entitiesMap.get(targetFullName);
                    entity.attrSeq.push({
                        name: row.targetAttributeCode,
                        type: this.normalizeType(row.targetDataType),
                        comment: row.targetAttributeDescription,
                        attr_change: 'new',
                    });
                }
            }

            // Маппинг (связь source -> target)
            if (row.sourceSchema && row.sourceTable && row.targetSchema && row.targetTable) {
                const targetFullName = `${row.targetSchema}/${row.targetTable}`;
                const sourceFullName = `${row.sourceSchema}/${row.sourceTable}`;

                if (!mappingsMap.has(targetFullName)) {
                    mappingsMap.set(targetFullName, {
                        entityId: targetFullName,
                        system_code: row.targetSystem || '1655',
                        relation_change: 'new',
                        deps: [],
                    });
                }

                const mapping = mappingsMap.get(targetFullName);
                let dep = mapping.deps.find((d: any) => d.entityId === sourceFullName);
                if (!dep) {
                    dep = {
                        entityId: sourceFullName,
                        system_code: row.sourceSystem || '1655',
                        process: options.process_name,
                        process_description: options.process_description,
                        process_change: 'new',
                        attrMaps: [],
                        atrDeps: [], // для модели atrDeps не заполняется из S2T
                    };
                    mapping.deps.push(dep);
                }

                if (row.sourceAttributeCode && row.targetAttributeCode) {
                    dep.attrMaps.push({
                        src: row.sourceAttributeCode,
                        dst: row.targetAttributeCode,
                        relation_change: 'new',
                    });
                }
            }
        }

        const json: any = {
            desc: {
                commit_type: 'model',
                change_date: new Date().toISOString(),
            },
            entities: Array.from(entitiesMap.values()),
            mappings: Array.from(mappingsMap.values()),
        };

        return json;
    }

    reverseMap(jsonData: any): any[] {
        const rows: any[] = [];
        rows.push([
            '#', 'Тип объекта', 'База/Система', 'Схема', 'Таблица', 'Описание таблицы',
            'Код атрибута', 'Краткое описание атрибута', 'Тип данных', 'Длина', 'PK', 'FK', 'Not Null',
            'Dataset', 'Algorithm', 'Comment', 'Status', 'Version',
            'База/Система', 'Схема', 'Таблица', 'Код атрибута', 'Описание атрибута', 'Описание таблицы',
            'Комментарий (рус)', 'Тип данных', 'Length', 'PK', 'FK', 'Not Null', 'Rejectable', 'Trace New Values'
        ]);

        for (const mapping of jsonData.mappings || []) {
            const targetEntity = jsonData.entities.find((e: any) => e.id === mapping.entityId);
            for (const dep of mapping.deps || []) {
                const sourceEntity = jsonData.entities.find((e: any) => e.id === dep.entityId);
                for (const attrMap of dep.attrMaps || []) {
                    const row: any[] = [];
                    // Source
                    row[1] = ''; // Тип объекта
                    row[2] = sourceEntity?.system_code || '';
                    row[3] = sourceEntity?.namespace || '';
                    row[4] = sourceEntity?.name || '';
                    row[5] = sourceEntity?.description || '';
                    row[6] = attrMap.src;
                    row[7] = this.findAttributeDescription(sourceEntity, attrMap.src);
                    row[8] = this.findAttributeType(sourceEntity, attrMap.src);
                    // Target
                    row[18] = targetEntity?.system_code || '';
                    row[19] = targetEntity?.namespace || '';
                    row[20] = targetEntity?.name || '';
                    row[21] = attrMap.dst;
                    row[22] = this.findAttributeDescription(targetEntity, attrMap.dst);
                    row[23] = targetEntity?.description || '';
                    row[25] = this.findAttributeType(targetEntity, attrMap.dst);
                    rows.push(row);
                }
            }
        }

        return rows;
    }

    private normalizeType(type?: string): string {
        if (!type) return 'string';
        const t = type.toLowerCase();
        if (t.includes('timestamp') || t.includes('date')) return 'timestamp';
        if (t.includes('decimal') || t.includes('numeric')) return 'decimal';
        if (t.includes('int')) return 'integer';
        if (t.includes('bool')) return 'boolean';
        return 'string';
    }

    private findAttributeDescription(entity: any, attrName: string): string {
        const attr = entity?.attrSeq?.find((a: any) => a.name === attrName);
        return attr?.comment || '';
    }

    private findAttributeType(entity: any, attrName: string): string {
        const attr = entity?.attrSeq?.find((a: any) => a.name === attrName);
        return attr?.type || '';
    }
}