import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class S2tConvertToCommitRequestDto {
	@ApiProperty({
		description: "Base64-encoded XLSX file content",
		example: "UEsDBBQABgAIAAAAIQ...",
	})
	@IsString()
	@IsNotEmpty()
	xlsxBase64!: string;

	@ApiProperty({
		description: "Original file name (optional)",
		example: "prod_dm_dadm_pvr.pd_mb_behaviour_online.xlsx",
		required: false,
	})
	@IsString()
	@IsOptional()
	fileName?: string;

	@ApiProperty({
		description: "Process name for commit metadata",
		example: "PD MB Behaviour Online",
		required: false,
	})
	@IsString()
	@IsOptional()
	processName?: string;

	@ApiProperty({
		description: "Process description for commit metadata",
		example: "Process for mobile banking behaviour analytics",
		required: false,
	})
	@IsString()
	@IsOptional()
	processDescription?: string;

	@ApiProperty({
		description: "Commit name",
		example: "Import S2T datamart",
	})
	@IsString()
	@IsNotEmpty()
	commitName!: string;
}
