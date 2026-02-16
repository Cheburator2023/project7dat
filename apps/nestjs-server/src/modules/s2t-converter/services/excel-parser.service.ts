import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface S2TRow {
    // Source columns (A-M)
    sourceType?: string;        // B
    sourceSystem?: string;      // C
    sourceSchema?: string;      // D
    sourceTable?: string;       // E
    sourceTableDescription?: string; // F
    sourceAttributeCode?: string;    // G
    sourceAttributeDescription?: string; // H
    sourceDataType?: string;          // I
    sourceLength?: string;            // J
    sourcePK?: string;                // K
    sourceFK?: string;                // L
    sourceNotNull?: string;           // M
    // ... другие колонки источника (N-R) можно добавить при необходимости

    // Target columns (S-AF)
    targetSystem?: string;            // S
    targetSchema?: string;            // T
    targetTable?: string;             // U
    targetAttributeCode?: string;     // V
    targetAttributeDescription?: string; // W
    targetTableDescription?: string;  // X
    targetComment?: string;           // Y
    targetDataType?: string;          // Z
    targetLength?: string;            // AA
    targetPK?: string;                // AB
    targetFK?: string;                // AC
    targetNotNull?: string;           // AD
    targetRejectable?: string;        // AE
    targetTraceNewValues?: string;    // AF
}

@Injectable()
export class ExcelParserService {
    private readonly logger = new Logger(ExcelParserService.name);

    /**
     * Парсит Excel файл, извлекает лист "Mapping" и возвращает массив строк
     */
    parse(buffer: Buffer): S2TRow[] {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            // Ищем лист "Mapping" (регистр не важен)
            const sheetName = workbook.SheetNames.find(
                name => name.toLowerCase() === 'mapping',
            );
            if (!sheetName) {
                throw new BadRequestException('В файле отсутствует лист "Mapping"');
            }

            const worksheet = workbook.Sheets[sheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

            if (jsonRows.length < 2) {
                throw new BadRequestException('Лист Mapping не содержит данных');
            }

            // Предполагаем, что первая строка - заголовки, со второй начинаются данные
            const rows: S2TRow[] = [];
            for (let i = 1; i < jsonRows.length; i++) {
                const row = jsonRows[i];
                if (row.length === 0) continue; // пустая строка

                // Сопоставляем колонки по индексам согласно документации
                // Индексация с 0: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25, AA=26, AB=27, AC=28, AD=29, AE=30, AF=31
                const mappedRow: S2TRow = {
                    sourceType: row[1],
                    sourceSystem: row[2],
                    sourceSchema: row[3],
                    sourceTable: row[4],
                    sourceTableDescription: row[5],
                    sourceAttributeCode: row[6],
                    sourceAttributeDescription: row[7],
                    sourceDataType: row[8],
                    sourceLength: row[9],
                    sourcePK: row[10],
                    sourceFK: row[11],
                    sourceNotNull: row[12],
                    targetSystem: row[18],
                    targetSchema: row[19],
                    targetTable: row[20],
                    targetAttributeCode: row[21],
                    targetAttributeDescription: row[22],
                    targetTableDescription: row[23],
                    targetComment: row[24],
                    targetDataType: row[25],
                    targetLength: row[26],
                    targetPK: row[27],
                    targetFK: row[28],
                    targetNotNull: row[29],
                    targetRejectable: row[30],
                    targetTraceNewValues: row[31],
                };
                rows.push(mappedRow);
            }

            this.logger.log(`Парсинг завершён, получено ${rows.length} строк`);
            return rows;
        } catch (error) {
            this.logger.error(`Ошибка парсинга Excel: ${error.message}`, error.stack);
            throw new BadRequestException('Не удалось распарсить Excel файл');
        }
    }
}