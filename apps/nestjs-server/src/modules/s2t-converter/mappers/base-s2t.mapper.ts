import { S2TRow } from '../services/excel-parser.service';

export interface S2TImportOptions {
    process_name?: string;
    process_description?: string;
}

export abstract class BaseS2TMapper {
    /**
     * Преобразование S2T -> JSON DL
     */
    abstract map(rows: S2TRow[], options: S2TImportOptions): any;

    /**
     * Преобразование JSON DL -> S2T (массив строк для Excel)
     */
    abstract reverseMap(jsonData: any): any[];
}