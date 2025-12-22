import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayNotEmpty, IsString } from "class-validator";

export class ApplyPartialCommitRequestDto {
	@ApiProperty({
		description:
			"Список ID сущностей (entities.id), которые нужно применить из коммита",
		type: [String],
		example: ["entity-1", "entity-2"],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	selectedEntityIds: string[];
}
