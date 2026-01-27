import { ApiProperty } from "@nestjs/swagger";
import {
	IsIn,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
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
	})
	@IsString()
	@IsIn(["table", "json", "model"])
	type!: "table" | "json" | "model";

	@ApiProperty({
		description: "User who created/edited commit",
		required: false,
		example: "user123",
	})
	@IsOptional()
	@IsString()
	user?: string;

	@ApiProperty({
		description: "Commit JSON payload",
		example: { desc: {}, entities: [], mappings: [] },
	})
	@IsObject()
	payload!: Record<string, any>;
}
