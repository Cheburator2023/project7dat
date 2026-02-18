import { S2TFileType } from './s2t-file-type.enum';
import { S2TRow } from './s2t-row.interface';

export interface ParsedS2TData {
    fileType: S2TFileType;
    rows: S2TRow[];
    fileName: string;
}