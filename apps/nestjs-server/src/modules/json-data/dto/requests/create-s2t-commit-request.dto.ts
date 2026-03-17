import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateIf,
} from "class-validator";

export class CreateS2tCommitRequestDto {
	@ApiProperty({
		description:
			"Existing commit id to update (used for saving edited version)",
		required: false,
		example: "c058a9cb-a16d-4944-b316-885beeab4604",
	})
	@IsOptional()
	@IsUUID()
	id?: string;

	@ApiProperty({
		description: "Parent commit id (original commit id)",
		required: false,
		example: "c058a9cb-a16d-4944-b316-885beeab4604",
	})
	@IsOptional()
	@IsUUID()
	parent_id?: string;

	@ApiProperty({
		description: "Commit name",
		example: "Import S2T datamart",
	})
	@IsString()
	@IsNotEmpty()
	commit_name!: string;

	@ApiProperty({
		description: "Commit description",
		required: false,
		example: "S2T import from xlsx",
	})
	@IsOptional()
	@IsString()
	commit_description?: string;

	@ApiProperty({
		description: "Commit type",
		example: "table",
		enum: ["table", "json", "model"],
		required: false,
	})
	@IsOptional()
	@IsString()
	@IsIn(["table", "json", "model"])
	type?: "table" | "json" | "model";

	@ApiProperty({
		description: "User who created/edited commit",
		required: false,
		example: "user123",
	})
	@IsOptional()
	@IsString()
	user?: string;

	@ApiProperty({
		description: "Commit JSON payload. Required if xlsxBase64 is not provided.",
		example: { desc: {}, entities: [], mappings: [] },
		required: false,
	})
	@ValidateIf((o) => !o.xlsxBase64)
	@IsObject()
	payload?: Record<string, any>;

	// --- S2T xlsx upload fields (конвертация + валидация на беке) ---

	@ApiProperty({
		description:
			"Base64-encoded S2T xlsx file. If provided, payload is derived from conversion.",
		required: false,
		example: "UEsDBBQABgAIAAAAIQ...",
	})
	@IsOptional()
	@IsString()
	xlsxBase64?: string;

	@ApiProperty({
		description: "Original xlsx file name (used for commit type detection)",
		required: false,
		example: "prod_dm_dadm_pvr.pd_mb_behaviour_online.xlsx",
	})
	@IsOptional()
	@IsString()
	fileName?: string;

	@ApiProperty({
		description: "Process name (for table/model commit types)",
		required: false,
		example: "PD MB Behaviour Online",
	})
	@IsOptional()
	@IsString()
	processName?: string;

	@ApiProperty({
		description: "Process description (for table/model commit types)",
		required: false,
		example: "Process for mobile banking behaviour analytics",
	})
	@IsOptional()
	@IsString()
	processDescription?: string;

	@ApiProperty({
		description:
			"Force create even if a commit with the same file name was already applied",
		required: false,
		example: false,
	})
	@IsOptional()
	@IsBoolean()
	forceCreate?: boolean;
}
