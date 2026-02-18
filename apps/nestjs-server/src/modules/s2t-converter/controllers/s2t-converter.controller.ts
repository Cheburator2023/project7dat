import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    BadRequestException,
    Logger,
    Res,
    UsePipes,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { S2tExcelParserService } from '../services/s2t-excel-parser.service';
import { S2tToJsonConverterService } from '../services/s2t-to-json-converter.service';
import { S2tCommitJsonDto } from '../dto/s2t-commit-json.dto';
import { ConvertJsonToS2tDto } from '../dto/convert-json-to-s2t.dto';
import {JsonToS2tConverterService} from "../services/json-to-s2t-converter.service";
import { FastifyReply, FastifyRequest } from 'fastify';

@ApiTags('S2T Конвертер')
@Controller('s2t-converter')
export class S2tConverterController {
    private readonly logger = new Logger(S2tConverterController.name);

    constructor(
        private readonly excelParser: S2tExcelParserService,
        private readonly s2tToJson: S2tToJsonConverterService,
        private readonly jsonToS2t: JsonToS2tConverterService,
    ) {}

    @Post('convert-to-json')
    @ApiOperation({ summary: 'S2T Excel → JSON коммита DL' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                processName: { type: 'string' },
                processDescription: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 200, type: S2tCommitJsonDto })
    async convertS2tToJson(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
    ): Promise<void> {
        try {
            const body = req.body as any;
            if (!body || !body.file) {
                throw new BadRequestException('Файл не загружен');
            }

            const file = body.file;
            const fileBuffer = await file.toBuffer();
            const fileName = file.filename;

            if (fileBuffer.length > 1024 * 1024) {
                throw new BadRequestException('Размер файла превышает 1 МБ');
            }

            // Корректное извлечение processName и processDescription (могут быть объектами Field)
            const processName = body.processName?.value ?? body.processName ?? '';
            const processDescription = body.processDescription?.value ?? body.processDescription ?? '';

            const parsed = this.excelParser.parseExcel(fileBuffer, fileName);
            const result = this.s2tToJson.convertToJson(parsed, {
                processName,
                processDescription,
            });

            // Безопасная сериализация (циклические ссылки исключены после исправления)
            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify(result));
        } catch (error) {
            this.logger.error('Ошибка при обработке запроса:', error);
            throw error;
        }
    }

    @Post('convert-from-json')
    @ApiOperation({ summary: 'JSON коммита DL → S2T Excel' })
    @ApiBody({ type: ConvertJsonToS2tDto })
    @ApiResponse({ status: 200, content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {} } })
    async convertJsonToS2t(@Body() body: ConvertJsonToS2tDto): Promise<Buffer> {
        return this.jsonToS2t.convertToS2t(body.jsonData, body.fileType);
    }
}