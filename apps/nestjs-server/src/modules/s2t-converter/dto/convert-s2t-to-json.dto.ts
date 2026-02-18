import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class ConvertS2tToJsonDto {
	@ApiProperty({
		description: "Наименование процесса (только для витрины/модели)",
		required: false,
	})
	@IsOptional()
	@IsString()
	processName?: string;

	@ApiProperty({
		description: "Описание процесса (только для витрины/модели)",
		required: false,
	})
	@IsOptional()
	@IsString()
	processDescription?: string;
}
