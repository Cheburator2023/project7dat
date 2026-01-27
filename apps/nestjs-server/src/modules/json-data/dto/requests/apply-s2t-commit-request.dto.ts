import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { JsonSourceType } from "./json-import-request.dto";

export class ApplyS2tCommitRequestDto {
	@ApiProperty({
		description: "User who confirms apply/merge",
		required: false,
		example: "user123",
	})
	@IsOptional()
	@IsString()
	user?: string;

	@ApiProperty({
		description: "Target DL import source type",
		enum: JsonSourceType,
		required: false,
		example: JsonSourceType.DAPP,
	})
	@IsOptional()
	@IsEnum(JsonSourceType)
	sourceType?: JsonSourceType;
}
