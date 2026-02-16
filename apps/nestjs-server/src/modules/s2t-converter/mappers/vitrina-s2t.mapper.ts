import { Injectable } from '@nestjs/common';
import { BaseS2TMapper, S2TImportOptions } from './base-s2t.mapper';
import { S2TRow } from '../services/excel-parser.service';

@Injectable()
export class VitrinaS2TMapper extends BaseS2TMapper {
    /**
     * Преобразование S2T витрины в JSON DL согласно таблице 1 документа "1_1_Требования_по_конвертации_S2T_в_JSON_коммита_46.docx"
     */
    map(rows: S2TRow[], options: S2TImportOptions): any {
        const entitiesMap = new Map<string, any>(); // key = full_name
        const mappingsMap = new Map<string, any>(); // key = target_full_name

        // Проходим по каждой строке
        for (const row of rows) {
            // Обработка Source сущности
            if (row.sourceSchema && row.sourceTable) {
                const sourceFullName = `${row.sourceSchema}/${row.sourceTable}`;
                if (!entitiesMap.has(sourceFullName)) {
                    entitiesMap.set(sourceFullName, {
                        id: sourceFullName,
                        modified: false,
                        type: 'table',
                        namespace: row.sourceSchema,
                        name: row.sourceTable,
                        system_code: row.sourceSystem || '1642', // default DAPP
                        entity_change: 'new', // признак изменения
                        description: row.sourceTableDescription,
                        attrSeq: [],
                    });
                }
                // Добавляем атрибут
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

            // Обработка Target сущности (целевая витрина)
            if (row.targetSchema && row.targetTable) {
                const targetFullName = `${row.targetSchema}/${row.targetTable}`;
                if (!entitiesMap.has(targetFullName)) {
                    entitiesMap.set(targetFullName, {
                        id: targetFullName,
                        modified: true, // целевая сущность
                        type: 'table',
                        namespace: row.targetSchema,
                        name: row.targetTable,
                        system_code: row.targetSystem || '1642',
                        entity_change: 'new',
                        description: row.targetTableDescription,
                        attrSeq: [],
                    });
                }
                // Добавляем атрибут цели
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

            // Обработка маппинга (связь source -> target)
            if (row.sourceSchema && row.sourceTable && row.targetSchema && row.targetTable) {
                const targetFullName = `${row.targetSchema}/${row.targetTable}`;
                const sourceFullName = `${row.sourceSchema}/${row.sourceTable}`;

                if (!mappingsMap.has(targetFullName)) {
                    mappingsMap.set(targetFullName, {
                        entityId: targetFullName,
                        system_code: row.targetSystem || '1642',
                        relation_change: 'new',
                        deps: [],
                    });
                }

                const mapping = mappingsMap.get(targetFullName);
                // Ищем или создаём зависимость для этого источника
                let dep = mapping.deps.find((d: any) => d.entityId === sourceFullName);
                if (!dep) {
                    dep = {
                        entityId: sourceFullName,
                        system_code: row.sourceSystem || '1642',
                        process: options.process_name,
                        process_description: options.process_description,
                        process_change: 'new',
                        attrMaps: [],
                        atrDeps: [], // для витрин atrDeps не заполняется из S2T
                    };
                    mapping.deps.push(dep);
                }

                // Добавляем маппинг атрибутов
                if (row.sourceAttributeCode && row.targetAttributeCode) {
                    dep.attrMaps.push({
                        src: row.sourceAttributeCode,
                        dst: row.targetAttributeCode,
                        relation_change: 'new',
                    });
                }
            }
        }

        // Формируем итоговый JSON
        const json: any = {
            desc: {
                commit_type: 'table',
                change_date: new Date().toISOString(),
            },
            entities: Array.from(entitiesMap.values()),
            mappings: Array.from(mappingsMap.values()),
        };

        return json;
    }

    /**
     * Обратное преобразование JSON DL -> S2T для витрин
     * (упрощённо, в реальном проекте нужно заполнить все колонки)
     */
    reverseMap(jsonData: any): any[] {
        const rows: any[] = [];
        // Заголовок
        rows.push([
            '#', 'Тип объекта', 'База/Система', 'Схема', 'Таблица', 'Описание таблицы',
            'Код атрибута', 'Краткое описание атрибута', 'Тип данных', 'Длина', 'PK', 'FK', 'Not Null',
            'Dataset', 'Algorithm', 'Comment', 'Status', 'Version',
            'База/Система', 'Схема', 'Таблица', 'Код атрибута', 'Описание атрибута', 'Описание таблицы',
            'Комментарий (рус)', 'Тип данных', 'Length', 'PK', 'FK', 'Not Null', 'Rejectable', 'Trace New Values'
        ]);

        // Собираем все пары source-target из маппингов
        for (const mapping of jsonData.mappings || []) {
            const targetEntity = jsonData.entities.find((e: any) => e.id === mapping.entityId);
            for (const dep of mapping.deps || []) {
                const sourceEntity = jsonData.entities.find((e: any) => e.id === dep.entityId);
                // Для каждого маппинга атрибутов создаём строку
                for (const attrMap of dep.attrMaps || []) {
                    const row: any[] = [];
                    // Source columns
                    row[1] = ''; // Тип объекта (необязательно)
                    row[2] = sourceEntity?.system_code || '';
                    row[3] = sourceEntity?.namespace || '';
                    row[4] = sourceEntity?.name || '';
                    row[5] = sourceEntity?.description || '';
                    row[6] = attrMap.src;
                    row[7] = this.findAttributeDescription(sourceEntity, attrMap.src);
                    row[8] = this.findAttributeType(sourceEntity, attrMap.src);
                    row[9] = ''; // Длина
                    row[10] = ''; // PK
                    row[11] = ''; // FK
                    row[12] = ''; // Not Null
                    // Target columns
                    row[18] = targetEntity?.system_code || '';
                    row[19] = targetEntity?.namespace || '';
                    row[20] = targetEntity?.name || '';
                    row[21] = attrMap.dst;
                    row[22] = this.findAttributeDescription(targetEntity, attrMap.dst);
                    row[23] = targetEntity?.description || '';
                    row[24] = ''; // Комментарий (рус)
                    row[25] = this.findAttributeType(targetEntity, attrMap.dst);
                    row[26] = ''; // Length
                    row[27] = ''; // PK
                    row[28] = ''; // FK
                    row[29] = ''; // Not Null
                    row[30] = ''; // Rejectable
                    row[31] = ''; // Trace New Values

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