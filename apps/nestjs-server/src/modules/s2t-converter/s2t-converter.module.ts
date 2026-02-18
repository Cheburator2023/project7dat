import { Module } from "@nestjs/common";
import { S2tConverterController } from "./controllers/s2t-converter.controller";
import { S2tExcelParserService } from "./services/s2t-excel-parser.service";
import { S2tToJsonConverterService } from "./services/s2t-to-json-converter.service";
import { JsonToS2tConverterService } from "./services/json-to-s2t-converter.service";

@Module({
	controllers: [S2tConverterController],
	providers: [
		S2tExcelParserService,
		S2tToJsonConverterService,
		JsonToS2tConverterService,
	],
	exports: [
		S2tExcelParserService,
		S2tToJsonConverterService,
		JsonToS2tConverterService,
	],
})
export class S2tConverterModule {}
