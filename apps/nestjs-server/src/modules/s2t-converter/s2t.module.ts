import { Module } from '@nestjs/common';
import { S2TController } from './controllers/s2t.controller';
import { S2TConversionService } from './services/s2t-conversion.service';
import { ExcelParserService } from './services/excel-parser.service';
import { VitrinaS2TMapper } from './mappers/vitrina-s2t.mapper';
import { JsonS2TMapper } from './mappers/json-s2t.mapper';
import { ModelS2TMapper } from './mappers/model-s2t.mapper';

@Module({
    imports: [], // возможно, нужно импортировать JsonDataModule или его сервисы
    controllers: [S2TController],
    providers: [
        S2TConversionService,
        ExcelParserService,
        VitrinaS2TMapper,
        JsonS2TMapper,
        ModelS2TMapper,
    ],
    exports: [S2TConversionService],
})
export class S2TModule {}