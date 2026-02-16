import { Injectable } from '@nestjs/common';
import { BaseS2TMapper, S2TImportOptions } from './base-s2t.mapper';
import { S2TRow } from '../services/excel-parser.service';

@Injectable()
export class JsonS2TMapper extends BaseS2TMapper {
    /**
     * Преобразование S2T JSON файла в JSON DL согласно таблице 2 документа "1_1_Требования_по_конвертации_S2T_в_JSON_коммита_46.docx"
     * Особенность: для JSON файла маппинги не заполняются, только сущности (целевые)
     */
    map(rows: S2TRow[], options: S2TImportOptions): any {
        const entitiesMap = new Map<string, any>();

        for (const row of rows) {
            // В S2T для JSON файла источником являются атрибуты, но в сущности попадает только Target
            // Согласно документации, entities.id = Схема (Target) + "/" + Таблица (Target)
            if (row.targetSchema && row.targetTable) {
                const targetFullName = `${row.targetSchema}/${row.targetTable}`;
                if (!entitiesMap.has(targetFullName)) {
                    entitiesMap.set(targetFullName, {
                        id: targetFullName,
                        modified: true,
                        type: 'json',
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
        }

        const json: any = {
            desc: {
                commit_type: 'json',
                change_date: new Date().toISOString(),
            },
            entities: Array.from(entitiesMap.values()),
            mappings: [], // для JSON маппинги не заполняются
        };

        return json;
    }

    reverseMap(jsonData: any): any[] {
        // Обратное преобразование для JSON файла – заполняем только целевые сущности
        const rows: any[] = [];
        rows.push([
            '#', 'Тип объекта', 'База/Система', 'Схема', 'Таблица', 'Описание таблицы',
            'Код атрибута', 'Краткое описание атрибута', 'Тип данных', 'Длина', 'PK', 'FK', 'Not Null',
            'Dataset', 'Algorithm', 'Comment', 'Status', 'Version',
            'База/Система', 'Схема', 'Таблица', 'Код атрибута', 'Описание атрибута', 'Описание таблицы',
            'Комментарий (рус)', 'Тип данных', 'Length', 'PK', 'FK', 'Not Null', 'Rejectable', 'Trace New Values'
        ]);

        // Ищем сущности с типом json
        const jsonEntities = jsonData.entities?.filter((e: any) => e.type === 'json') || [];
        for (const entity of jsonEntities) {
            for (const attr of entity.attrSeq || []) {
                const row: any[] = [];
                // Source columns оставляем пустыми (или можно заполнить, но по документации не нужно)
                // Target columns
                row[18] = entity.system_code || '1642';
                row[19] = entity.namespace || '';
                row[20] = entity.name || '';
                row[21] = attr.name;
                row[22] = attr.comment || '';
                row[23] = entity.description || '';
                row[24] = ''; // Комментарий (рус)
                row[25] = attr.type?.toUpperCase() || 'STRING';
                rows.push(row);
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
}