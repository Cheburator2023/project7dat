import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Logger,
    Get,
    Query,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { S2TConversionService } from '../services/s2t-conversion.service';
import { S2TImportRequestDto } from '../dto/s2t-import-request.dto';
import { S2TExportRequestDto } from '../dto/s2t-export-request.dto';
import { JsonCommitService } from '../../json-data/services/json-commit.service';
import { JsonValidationOrchestratorService } from '../../json-data/services/json-validation-orchestrator.service';
import { Response } from 'express';
import * as XLSX from 'xlsx';

@ApiTags('Импорт S2T')
@Controller('s2t')
export class S2TController {
    private readonly logger = new Logger(S2TController.name);

    constructor(
        private readonly s2tConversionService: S2TConversionService,
        private readonly jsonCommitService: JsonCommitService,
        private readonly validationOrchestrator: JsonValidationOrchestratorService,
    ) {}

    @Post('import')
    @ApiOperation({ summary: 'Импорт S2T файла', description: 'Загружает S2T (.xlsx), преобразует в JSON и сохраняет как коммит' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'S2T файл в формате Excel (.xlsx)',
                },
                commit_name: { type: 'string' },
                commit_description: { type: 'string' },
                process_name: { type: 'string' },
                process_description: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async importS2T(
        @UploadedFile() file: Express.Multer.File,
        @Body() importDto: S2TImportRequestDto,
    ) {
        if (!file) {
            throw new BadRequestException('Файл не загружен');
        }

        this.logger.log(`Начало импорта S2T файла: ${file.originalname}, пользователь: ${importDto.commit_name}`);

        // 1. Преобразование S2T -> JSON
        const jsonData = await this.s2tConversionService.convertS2TToJson(file.buffer, file.originalname, {
            process_name: importDto.process_name,
            process_description: importDto.process_description,
        });

        // 2. Валидация JSON
        const validationResult = await this.validationOrchestrator.validate(jsonData);
        if (!validationResult.isValid) {
            throw new BadRequestException({
                message: 'Валидация JSON не пройдена',
                details: validationResult,
            });
        }

        // 3. Сохранение коммита
        const commitSaveDto = {
            timestamp: new Date().toISOString(),
            user: 'system', // В реальности брать из JWT
            commit_name: importDto.commit_name,
            commit_description: importDto.commit_description,
            commit: jsonData,
            type: jsonData.desc?.commit_type || 'table', // commit_type должен быть проставлен маппером
        };

        const savedCommit = await this.jsonCommitService.saveCommit(commitSaveDto as any);

        this.logger.log(`Импорт завершён, создан коммит: ${savedCommit.commit_id}`);

        return {
            message: 'S2T файл успешно импортирован',
            commit_id: savedCommit.commit_id,
        };
    }

    @Post('export')
    @ApiOperation({ summary: 'Экспорт в S2T', description: 'Формирует S2T файл на основе данных из БД или коммита' })
    async exportS2T(
        @Body() exportDto: S2TExportRequestDto,
        @Res() res: Response,
    ) {
        this.logger.log(`Начало экспорта S2T, type: ${exportDto.type}, commit_id: ${exportDto.commit_id}`);

        // Получаем данные для экспорта (либо из коммита, либо текущую модель)
        let jsonData: any;
        if (exportDto.commit_id) {
            const commit = await this.jsonCommitService.getCommitById(exportDto.commit_id);
            if (!commit || !commit.commit) {
                throw new BadRequestException('Коммит не найден или не содержит JSON');
            }
            jsonData = commit.commit;
        } else {
            // Получаем текущую модель из БД через сервис экспорта
            const exportService = this.s2tConversionService.getJsonExportService();
            jsonData = await exportService.exportToJson();
        }

        // Определяем тип экспорта
        let exportType: string;

        if (exportDto.type) {
            // Если тип указан в запросе, используем его (преобразуем enum в строку)
            exportType = exportDto.type;
        } else {
            // Иначе пытаемся определить тип из JSON
            const commitType = jsonData.desc?.commit_type;
            if (commitType === 'table') {
                // Для витрины в маппере используется 'table', а в сервисе экспорта ожидается 'vitrina'
                exportType = 'vitrina';
            } else {
                // Для json и model значения совпадают
                exportType = commitType || 'model';
            }
        }

        // Теперь exportType гарантированно строка, подходящая для convertJsonToS2T
        const buffer = await this.s2tConversionService.convertJsonToS2T(jsonData, exportType);

        // Формируем имя файла
        const filename = `export_${exportType}_${new Date().toISOString().slice(0,10)}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
}