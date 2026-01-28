import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class ComprehensiveValidationRequestDto {
	@ApiProperty({
		description: "JSON данные для комплексной валидации",
		example: { desc: {}, entities: [], mappings: [] },
	})
	@IsObject()
	data: Record<string, any>;

	@ApiProperty({
		description: "Идентификатор пользователя",
		example: "user123",
		required: false,
	})
	@IsOptional()
	@IsString()
	user?: string;
}
