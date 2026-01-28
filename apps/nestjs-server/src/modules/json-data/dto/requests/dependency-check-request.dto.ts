import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class DependencyCheckRequestDto {
	@ApiProperty({
		description: "Список полных имен сущностей для проверки",
		example: ["schema1.table1", "schema2.view1"],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	entityFullNames: string[];

	@ApiProperty({
		description: "Идентификатор текущего процесса",
		example: 1,
		required: false,
	})
	@IsOptional()
	@IsNumber()
	currentProcessId?: number;
}
