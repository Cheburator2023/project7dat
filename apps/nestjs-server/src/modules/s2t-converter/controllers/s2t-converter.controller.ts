import {
    Controller,
    Post,
    Body,
    BadRequestException,
    Logger,
    Res,
    Req,
    UsePipes,
    ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { S2tExcelParserService } from '../services/s2t-excel-parser.service';
import { S2tToJsonConverterService } from '../services/s2t-to-json-converter.service';
import { S2tCommitJsonDto } from '../dto/s2t-commit-json.dto';
import { ConvertJsonToS2tDto } from '../dto/convert-json-to-s2t.dto';
import { JsonToS2tConverterService } from '../services/json-to-s2t-converter.service';
import { JsonToS2tTransformPipe } from '../pipes/json-to-s2t-transform.pipe';
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

            const processName = body.processName?.value ?? body.processName ?? '';
            const processDescription = body.processDescription?.value ?? body.processDescription ?? '';

            const parsed = this.excelParser.parseExcel(fileBuffer, fileName);
            const result = this.s2tToJson.convertToJson(parsed, {
                processName,
                processDescription,
            });

            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify(result));
        } catch (error) {
            this.logger.error('Ошибка при обработке запроса:', error);
            throw error;
        }
    }

    @Post('convert-from-json')
    @UsePipes(new NestValidationPipe({ whitelist: false, forbidNonWhitelisted: false }))
    @ApiOperation({
        summary: 'JSON коммита DL → S2T Excel',
        description: 'Конвертирует JSON коммита Data Lineage в Excel-файл формата S2T (витрина, JSON-файл или модель)'
    })
    @ApiBody({ type: ConvertJsonToS2tDto })
    @ApiResponse({
        status: 201,
        description: 'Excel-файл успешно сгенерирован',
        content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Ошибка валидации входных данных' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    async convertJsonToS2t(
        @Body(JsonToS2tTransformPipe) body: any,
        @Res() res: FastifyReply,
    ): Promise<void> {
        const dto = body as ConvertJsonToS2tDto;
        try {
            const excelBuffer = await this.jsonToS2t.convertToS2t(dto.jsonData, dto.fileType);

            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.header('Content-Disposition', 'attachment; filename="converted.xlsx"');
            res.header('Content-Length', excelBuffer.length.toString());

            res.send(excelBuffer);
        } catch (error) {
            this.logger.error(`Ошибка конвертации JSON -> S2T: ${error.message}`, error.stack);
            throw new BadRequestException(`Ошибка конвертации: ${error.message}`);
        }
    }
}