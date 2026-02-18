import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { S2TFileType } from '../interfaces/s2t-file-type.enum';
import { S2TRow } from '../interfaces/s2t-row.interface';
import { ParsedS2TData } from '../interfaces/s2t-parsed-data.interface';

@Injectable()
export class S2tExcelParserService {
    private readonly logger = new Logger(S2tExcelParserService.name);

    // Исправленные индексы колонок согласно реальному расположению в S2T-шаблоне
    // (0-базовые индексы)
    private readonly SOURCE_BASE_SYSTEM_INDEX = 2;      // колонка C
    private readonly SOURCE_SCHEMA_INDEX = 3;           // колонка D
    private readonly SOURCE_TABLE_INDEX = 4;            // колонка E
    private readonly SOURCE_TABLE_DESC_INDEX = 5;       // колонка F
    private readonly SOURCE_ATTR_CODE_INDEX = 6;        // колонка G
    private readonly SOURCE_ATTR_DESC_INDEX = 7;        // колонка H
    private readonly SOURCE_DATA_TYPE_INDEX = 8;        // колонка I

    private readonly TARGET_BASE_SYSTEM_INDEX = 18;     // колонка S
    private readonly TARGET_SCHEMA_INDEX = 19;          // колонка T
    private readonly TARGET_TABLE_INDEX = 20;           // колонка U
    private readonly TARGET_TABLE_DESC_INDEX = 23;      // колонка X
    private readonly TARGET_ATTR_CODE_INDEX = 21;       // колонка V
    private readonly TARGET_ATTR_DESC_INDEX = 22;       // колонка W
    private readonly TARGET_DATA_TYPE_INDEX = 25;       // колонка Z

    private readonly COMMIT_FLAG_INDEX = 14;            // колонка O

    // Слова-заголовки, которые не являются реальными данными
    private readonly HEADER_WORDS = new Set([
        'база/система',
        'схема',
        'таблица',
        'код атрибута',
        'краткое описание атрибута',
        'тип данных',
        'тип объекта',
        'описание таблицы',
        'комментарий',
        'длина',
        'pk',
        'fk',
        'not null',
        'dataset',
        'algorithm',
        'status',
        'version',
        'source',
        'target',
        '#',
        ''
    ]);

    detectFileType(filename: string): S2TFileType {
        const lower = filename.toLowerCase();
        if (lower.includes('json_')) return S2TFileType.JSON;
        if (lower.includes('model_')) return S2TFileType.MODEL;
        return S2TFileType.MART;
    }

    parseExcel(buffer: Buffer, filename: string): ParsedS2TData {
        this.logger.log(`Парсинг S2T файла: ${filename}`);

        let workbook: XLSX.WorkBook;
        try {
            workbook = XLSX.read(buffer, { type: 'buffer' });
        } catch (error) {
            throw new BadRequestException('Не удалось прочитать Excel файл');
        }

        const sheetName = workbook.SheetNames.find(name =>
            name.toLowerCase().includes('mapping'),
        );
        if (!sheetName) throw new BadRequestException('Лист "Mapping" не найден');

        const worksheet = workbook.Sheets[sheetName];
        // Получаем все строки как массив массивов (включая возможные пустые строки)
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (rows.length === 0) throw new BadRequestException('Нет данных на листе Mapping');

        // Находим первую непустую строку (обычно это строка с "Source/Target")
        let headerIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')) {
                headerIndex = i;
                break;
            }
        }
        if (headerIndex === -1) {
            throw new BadRequestException('Не найдено непустых строк на листе Mapping');
        }

        // Пропускаем две строки заголовков (первая – общая, вторая – имена колонок)
        const dataStartIndex = headerIndex + 2;

        const parsedRows: S2TRow[] = [];

        // Храним последние непустые значения для заполнения пропусков
        let lastSourceSchema: string | undefined;
        let lastSourceTable: string | undefined;
        let lastSourceBaseSystem: string | undefined;
        let lastTargetSchema: string | undefined;
        let lastTargetTable: string | undefined;
        let lastTargetBaseSystem: string | undefined;

        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i];
            // Пропускаем полностью пустые строки
            if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) continue;

            const parsedRow = this.parseRowByIndices(row);

            // Проверяем, есть ли в строке полезные данные (хотя бы один атрибут или таблица)
            const hasData = !!(parsedRow.sourceAttributeCode || parsedRow.targetAttributeCode ||
                parsedRow.sourceTable || parsedRow.targetTable);
            if (!hasData) continue;

            // Заполняем пропуски для source
            if (parsedRow.sourceSchema) {
                lastSourceSchema = parsedRow.sourceSchema;
            } else if (lastSourceSchema) {
                parsedRow.sourceSchema = lastSourceSchema;
            }

            if (parsedRow.sourceTable) {
                lastSourceTable = parsedRow.sourceTable;
            } else if (lastSourceTable) {
                parsedRow.sourceTable = lastSourceTable;
            }

            if (parsedRow.sourceBaseSystem) {
                lastSourceBaseSystem = parsedRow.sourceBaseSystem;
            } else if (lastSourceBaseSystem) {
                parsedRow.sourceBaseSystem = lastSourceBaseSystem;
            }

            // Заполняем пропуски для target
            if (parsedRow.targetSchema) {
                lastTargetSchema = parsedRow.targetSchema;
            } else if (lastTargetSchema) {
                parsedRow.targetSchema = lastTargetSchema;
            }

            if (parsedRow.targetTable) {
                lastTargetTable = parsedRow.targetTable;
            } else if (lastTargetTable) {
                parsedRow.targetTable = lastTargetTable;
            }

            if (parsedRow.targetBaseSystem) {
                lastTargetBaseSystem = parsedRow.targetBaseSystem;
            } else if (lastTargetBaseSystem) {
                parsedRow.targetBaseSystem = lastTargetBaseSystem;
            }

            parsedRows.push(parsedRow);
        }

        const fileType = this.detectFileType(filename);
        this.logger.log(`Распарсено ${parsedRows.length} строк, тип файла: ${fileType}`);

        return { fileType, rows: parsedRows, fileName: filename };
    }

    /**
     * Проверяет, является ли значение допустимым (не заголовочным словом)
     * Для критических полей (схема, таблица) вызывать не нужно – они всегда берутся как есть.
     */
    private isValidValue(value: any): boolean {
        if (value === undefined || value === null) return false;
        const str = String(value).trim().toLowerCase();
        if (str === '') return false;
        // Если значение состоит только из цифр – допустимо (код системы)
        if (/^\d+$/.test(str)) return true;
        // Если значение не является заголовочным словом – допустимо
        return !this.HEADER_WORDS.has(str);
    }

    /**
     * Парсинг строки с использованием фиксированных индексов колонок.
     * Для sourceSchema, sourceTable, targetSchema, targetTable берем любые непустые значения.
     * Для остальных полей применяем фильтрацию заголовков.
     */
    private parseRowByIndices(row: any[]): S2TRow {
        // Функция для критических полей (схема, таблица) – берем любое непустое значение
        const getCriticalValue = (index: number): string | undefined => {
            if (index >= row.length) return undefined;
            const value = row[index];
            if (value === undefined || value === null) return undefined;
            const str = String(value).trim();
            return str !== '' ? str : undefined;
        };

        // Функция для остальных полей – с фильтрацией заголовков
        const getFilteredValue = (index: number): string | undefined => {
            if (index >= row.length) return undefined;
            const value = row[index];
            return this.isValidValue(value) ? String(value).trim() : undefined;
        };

        return {
            // Source
            sourceBaseSystem: getFilteredValue(this.SOURCE_BASE_SYSTEM_INDEX),
            sourceSchema: getCriticalValue(this.SOURCE_SCHEMA_INDEX),
            sourceTable: getCriticalValue(this.SOURCE_TABLE_INDEX),
            sourceTableDescription: getFilteredValue(this.SOURCE_TABLE_DESC_INDEX),
            sourceAttributeCode: getFilteredValue(this.SOURCE_ATTR_CODE_INDEX),
            sourceAttributeDescription: getFilteredValue(this.SOURCE_ATTR_DESC_INDEX),
            sourceDataType: getFilteredValue(this.SOURCE_DATA_TYPE_INDEX),

            // Target
            targetBaseSystem: getFilteredValue(this.TARGET_BASE_SYSTEM_INDEX),
            targetSchema: getCriticalValue(this.TARGET_SCHEMA_INDEX),
            targetTable: getCriticalValue(this.TARGET_TABLE_INDEX),
            targetTableDescription: getFilteredValue(this.TARGET_TABLE_DESC_INDEX),
            targetAttributeCode: getFilteredValue(this.TARGET_ATTR_CODE_INDEX),
            targetAttributeDescription: getFilteredValue(this.TARGET_ATTR_DESC_INDEX),
            targetDataType: getFilteredValue(this.TARGET_DATA_TYPE_INDEX),

            // Commit flag
            commitFlag: getFilteredValue(this.COMMIT_FLAG_INDEX),
        };
    }
}