import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from './excel-parser.service';
import { VitrinaS2TMapper } from '../mappers/vitrina-s2t.mapper';
import { JsonS2TMapper } from '../mappers/json-s2t.mapper';
import { ModelS2TMapper } from '../mappers/model-s2t.mapper';
import { JsonExportService } from '../../json-data/services/json-export.service';

export interface S2TImportOptions {
    process_name?: string;
    process_description?: string;
}

@Injectable()
export class S2TConversionService {
    private readonly logger = new Logger(S2TConversionService.name);

    constructor(
        private readonly excelParser: ExcelParserService,
        private readonly vitrinaMapper: VitrinaS2TMapper,
        private readonly jsonMapper: JsonS2TMapper,
        private readonly modelMapper: ModelS2TMapper,
        private readonly jsonExportService: JsonExportService, // для экспорта
    ) {}

    /**
     * Определяет тип S2T по имени файла и преобразует Excel в JSON DL
     */
    async convertS2TToJson(
        fileBuffer: Buffer,
        fileName: string,
        options: S2TImportOptions,
    ): Promise<any> {
        this.logger.log(`Преобразование S2T файла: ${fileName}`);

        // Определяем тип по имени файла
        const type = this.detectType(fileName);
        this.logger.log(`Определён тип: ${type}`);

        // Парсим Excel
        const rows = this.excelParser.parse(fileBuffer);

        // Выбираем соответствующий маппер
        let jsonData: any;
        switch (type) {
            case 'vitrina':
                jsonData = this.vitrinaMapper.map(rows, options);
                break;
            case 'json':
                jsonData = this.jsonMapper.map(rows, options);
                break;
            case 'model':
                jsonData = this.modelMapper.map(rows, options);
                break;
            default:
                throw new BadRequestException(`Неизвестный тип S2T: ${type}`);
        }

        // Добавляем метаданные из опций в desc (process, description)
        if (!jsonData.desc) jsonData.desc = {};
        if (options.process_name) {
            jsonData.desc.process = options.process_name;
        }
        if (options.process_description) {
            jsonData.desc.description = options.process_description;
        }

        return jsonData;
    }

    /**
     * Преобразует JSON DL в Excel S2T
     */
    async convertJsonToS2T(jsonData: any, type: string): Promise<Buffer> {
        this.logger.log(`Преобразование JSON в S2T, тип: ${type}`);

        // Выбираем маппер для обратного преобразования
        let rows: any[];
        switch (type) {
            case 'vitrina':
                rows = this.vitrinaMapper.reverseMap(jsonData);
                break;
            case 'json':
                rows = this.jsonMapper.reverseMap(jsonData);
                break;
            case 'model':
                rows = this.modelMapper.reverseMap(jsonData);
                break;
            default:
                throw new BadRequestException(`Неизвестный тип S2T: ${type}`);
        }

        // Создаем Excel файл
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapping');

        // Генерируем буфер
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    /**
     * Определение типа S2T по имени файла
     */
    private detectType(fileName: string): 'vitrina' | 'json' | 'model' {
        const lower = fileName.toLowerCase();
        if (lower.includes('json_')) {
            return 'json';
        }
        if (lower.includes('model_')) {
            return 'model';
        }
        // Если нет специальных маркеров, считаем витриной
        return 'vitrina';
    }

    /**
     * Для экспорта может понадобиться доступ к JsonExportService
     */
    getJsonExportService(): JsonExportService {
        return this.jsonExportService;
    }
}