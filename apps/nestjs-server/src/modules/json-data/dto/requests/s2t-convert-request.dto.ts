import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class S2tConvertRequestDto {
	@ApiProperty({
		description: "Файл S2T в формате xlsx, закодированный в base64",
		example: "UEsDB...",
	})
	@IsString()
	xlsxBase64: string;

	@ApiProperty({
		description: "Оригинальное имя файла (для метаданных)",
		required: false,
		example: "prod_dm_dadm_pvr.pd_mb_behaviour_online.xlsx",
	})
	@IsOptional()
	@IsString()
	fileName?: string;
}
